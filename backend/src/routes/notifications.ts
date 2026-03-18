import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "../auth";
import { db } from "../prisma";

const notificationsRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// POST /api/notifications/register — Save push token for authenticated user
notificationsRouter.post(
  "/register",
  zValidator("json", z.object({ token: z.string().min(1) })),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const { token } = c.req.valid("json");

    await db.user.update({
      where: { id: user.id },
      data: { pushToken: token },
    });

    return c.json({ data: { status: "registered" } });
  }
);

// GET /api/notifications/status — Check if user has a push token registered
notificationsRouter.get("/status", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { pushToken: true },
  });

  return c.json({ data: { registered: !!dbUser?.pushToken } });
});

export { notificationsRouter };
