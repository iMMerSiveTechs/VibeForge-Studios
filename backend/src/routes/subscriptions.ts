import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../prisma";
import { auth } from "../auth";

const PLAN_LIMITS = {
  FREE: {
    maxTokensPerDay: 10000,
    maxRequestsPerDay: 20,
    maxImagesPerDay: 5,
    maxAudioMinutesPerDay: 5,
    maxBuildsPerMonth: 0,
    maxFilesPerProject: 50,
  },
  PRO: {
    maxTokensPerDay: 100000,
    maxRequestsPerDay: 200,
    maxImagesPerDay: 50,
    maxAudioMinutesPerDay: 60,
    maxBuildsPerMonth: 10,
    maxFilesPerProject: 500,
  },
  ENTERPRISE: {
    maxTokensPerDay: -1,
    maxRequestsPerDay: -1,
    maxImagesPerDay: -1,
    maxAudioMinutesPerDay: -1,
    maxBuildsPerMonth: -1,
    maxFilesPerProject: -1,
  },
} as const;

type PlanName = keyof typeof PLAN_LIMITS;

function mapProductToPlan(productId: string): PlanName {
  if (productId.includes("enterprise")) return "ENTERPRISE";
  if (productId.includes("pro")) return "PRO";
  return "FREE";
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

const subscriptionsRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// GET /api/subscriptions/me — Get current user's subscription + today's usage
subscriptionsRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  // Auto-create FREE subscription if none exists
  const subscription = await db.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, plan: "FREE", status: "ACTIVE" },
    update: {},
  });

  const today = todayDateString();

  // Get or create today's usage record
  const usage = await db.usageRecord.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    create: { userId: user.id, date: today },
    update: {},
  });

  return c.json({
    data: {
      subscription,
      usage,
      plan: subscription.plan,
    },
  });
});

// POST /api/subscriptions/webhook — RevenueCat webhook handler (no auth middleware)
subscriptionsRouter.post("/webhook", async (c) => {
  const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

  if (webhookSecret) {
    const authKey = c.req.header("X-RevenueCat-Webhook-Auth-Key");
    if (authKey !== webhookSecret) {
      return c.json({ error: { message: "Invalid webhook secret", code: "UNAUTHORIZED" } }, 401);
    }
  }

  const body = await c.req.json();
  const event = body?.event;

  if (!event || !event.type || !event.app_user_id) {
    return c.json({ error: { message: "Invalid webhook payload", code: "BAD_REQUEST" } }, 400);
  }

  const { type, app_user_id: userId, product_id: productId, expiration_at_ms: expirationAtMs } = event;

  const handledEvents = ["INITIAL_PURCHASE", "RENEWAL", "CANCELLATION", "EXPIRATION"];
  if (!handledEvents.includes(type)) {
    // Acknowledge but ignore unhandled event types
    return c.json({ data: { received: true } });
  }

  const plan = productId ? mapProductToPlan(productId) : "FREE";
  const currentPeriodEnd = expirationAtMs ? new Date(expirationAtMs) : null;

  let status = "ACTIVE";
  if (type === "CANCELLATION") {
    status = "CANCELLED";
  } else if (type === "EXPIRATION") {
    status = "EXPIRED";
  }

  await db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: type === "EXPIRATION" ? "FREE" : plan,
      status,
      currentPeriodEnd,
    },
    update: {
      plan: type === "EXPIRATION" ? "FREE" : plan,
      status,
      currentPeriodEnd,
    },
  });

  return c.json({ data: { received: true } });
});

// GET /api/subscriptions/entitlements — Return plan limits
subscriptionsRouter.get("/entitlements", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const subscription = await db.subscription.findUnique({
    where: { userId: user.id },
  });

  const plan = (subscription?.plan ?? "FREE") as PlanName;
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;

  return c.json({ data: { plan, limits } });
});

// POST /api/subscriptions/sync — Mobile calls after purchase to sync state
subscriptionsRouter.post(
  "/sync",
  zValidator(
    "json",
    z.object({
      revenuecatId: z.string(),
      plan: z.enum(["FREE", "PRO", "ENTERPRISE"]),
      expiresAt: z.string().optional(),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const { revenuecatId, plan, expiresAt } = c.req.valid("json");
    const currentPeriodEnd = expiresAt ? new Date(expiresAt) : null;

    const subscription = await db.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        revenuecatId,
        plan,
        status: "ACTIVE",
        currentPeriodEnd,
      },
      update: {
        revenuecatId,
        plan,
        status: "ACTIVE",
        currentPeriodEnd,
      },
    });

    return c.json({ data: subscription });
  }
);

export { subscriptionsRouter };
