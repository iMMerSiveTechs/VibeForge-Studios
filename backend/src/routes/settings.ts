import { auth } from "../auth";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../prisma";

const settingsRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// Auth guard middleware for all settings routes
settingsRouter.use("/*", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json(
      { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      401
    );
  }
  await next();
});

// GET /api/settings - get all settings as { key: value } object for current user
settingsRouter.get("/", async (c) => {
  const user = c.get("user")!;
  const settings = await db.setting.findMany({ where: { userId: user.id } });
  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }
  return c.json({ data: result });
});

// PUT /api/settings - bulk update settings for current user
settingsRouter.put(
  "/",
  zValidator("json", z.record(z.string(), z.string())),
  async (c) => {
    const user = c.get("user")!;
    const body = c.req.valid("json");

    const operations = Object.entries(body).map(([key, value]) =>
      db.setting.upsert({
        where: { userId_key: { userId: user.id, key } },
        update: { value },
        create: { userId: user.id, key, value },
      })
    );

    await Promise.all(operations);

    // Return all settings for this user after update
    const settings = await db.setting.findMany({ where: { userId: user.id } });
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return c.json({ data: result });
  }
);

// GET /api/settings/:key - get single setting value for current user
settingsRouter.get("/:key", async (c) => {
  const user = c.get("user")!;
  const key = c.req.param("key");
  const setting = await db.setting.findUnique({
    where: { userId_key: { userId: user.id, key } },
  });

  if (!setting) {
    return c.json(
      { error: { message: `Setting '${key}' not found`, code: "NOT_FOUND" } },
      404
    );
  }

  return c.json({ data: { key: setting.key, value: setting.value } });
});

// PUT /api/settings/:key - set single setting for current user
settingsRouter.put(
  "/:key",
  zValidator("json", z.object({ value: z.string() })),
  async (c) => {
    const user = c.get("user")!;
    const key = c.req.param("key");
    const { value } = c.req.valid("json");

    const setting = await db.setting.upsert({
      where: { userId_key: { userId: user.id, key } },
      update: { value },
      create: { userId: user.id, key, value },
    });

    return c.json({ data: { key: setting.key, value: setting.value } });
  }
);

// DELETE /api/settings/:key - delete setting for current user
settingsRouter.delete("/:key", async (c) => {
  const user = c.get("user")!;
  const key = c.req.param("key");

  const existing = await db.setting.findUnique({
    where: { userId_key: { userId: user.id, key } },
  });
  if (!existing) {
    return c.json(
      { error: { message: `Setting '${key}' not found`, code: "NOT_FOUND" } },
      404
    );
  }

  await db.setting.delete({ where: { userId_key: { userId: user.id, key } } });
  return c.json({ data: { success: true } });
});

export { settingsRouter };
