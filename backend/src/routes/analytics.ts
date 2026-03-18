import { Hono } from "hono";
import { auth } from "../auth";
import { db } from "../prisma";

const analyticsRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// ---- GET /usage ----
// Returns usage summary: last 30 UsageRecord rows + totals
analyticsRouter.get("/usage", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json(
      { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      401
    );
  }

  const daily = await db.usageRecord.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 30,
  });

  const totals = daily.reduce(
    (acc, r) => {
      acc.tokens += r.tokensUsed;
      acc.requests += r.requestCount;
      acc.images += r.imagesGenerated;
      acc.audio += r.audioMinutes;
      return acc;
    },
    { tokens: 0, requests: 0, images: 0, audio: 0 }
  );

  return c.json({ data: { daily, totals } });
});

// ---- GET /cost ----
// Returns estimated cost breakdown from UsageRecord totals
analyticsRouter.get("/cost", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json(
      { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      401
    );
  }

  const records = await db.usageRecord.findMany({
    where: { userId: user.id },
  });

  const totals = records.reduce(
    (acc, r) => {
      acc.tokens += r.tokensUsed;
      acc.images += r.imagesGenerated;
      acc.audio += r.audioMinutes;
      return acc;
    },
    { tokens: 0, images: 0, audio: 0 }
  );

  // Approximate rates
  const INPUT_RATE = 3 / 1_000_000; // $3 per 1M input tokens
  const OUTPUT_RATE = 15 / 1_000_000; // $15 per 1M output tokens
  // Rough split: assume 30% input, 70% output
  const tokenCost =
    totals.tokens * 0.3 * INPUT_RATE + totals.tokens * 0.7 * OUTPUT_RATE;
  const imageCost = totals.images * 0.04; // ~$0.04 per image
  const audioCost = totals.audio * 0.006; // ~$0.006 per minute

  const estimatedCostUSD = Math.round((tokenCost + imageCost + audioCost) * 100) / 100;

  return c.json({
    data: {
      estimatedCostUSD,
      breakdown: {
        tokens: Math.round(tokenCost * 100) / 100,
        images: Math.round(imageCost * 100) / 100,
        audio: Math.round(audioCost * 100) / 100,
      },
    },
  });
});

// ---- GET /activity ----
// Returns last 20 GenerationMessage records across all user's projects
analyticsRouter.get("/activity", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json(
      { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      401
    );
  }

  // Get user's project IDs
  const projects = await db.project.findMany({
    where: { userId: user.id },
    select: { id: true, name: true },
  });

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return c.json({ data: [] });
  }

  const messages = await db.generationMessage.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const activities = messages.map((m) => ({
    id: m.id,
    projectName: projectMap.get(m.projectId) ?? "Unknown",
    role: m.role,
    contentPreview: m.content.length > 100 ? m.content.slice(0, 100) + "..." : m.content,
    createdAt: m.createdAt,
  }));

  return c.json({ data: activities });
});

export { analyticsRouter };
