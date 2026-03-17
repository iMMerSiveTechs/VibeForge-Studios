import { auth } from "../auth";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../prisma";
import { encrypt, decrypt, isSensitiveKey } from "../lib/crypto";

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

// Mask sensitive values (API keys)
function maskSensitiveValue(key: string, value: string): string {
  if (key.startsWith("api_key_") && value.length > 8) {
    return value.slice(0, 4) + "..." + value.slice(-4);
  }
  return value;
}

// GET /api/settings - get all settings as { key: value } object for current user
// API keys are masked in the response; use has_api_key_* to check presence
settingsRouter.get("/", async (c) => {
  const user = c.get("user")!;
  const settings = await db.setting.findMany({ where: { userId: user.id } });
  const result: Record<string, string> = {};
  for (const s of settings) {
    let value = s.value;
    if (isSensitiveKey(s.key)) {
      const decrypted = decrypt(value);
      // If decrypt returned the same value, it's legacy plain-text — re-encrypt and save
      if (decrypted === value) {
        const encrypted = encrypt(value);
        await db.setting.update({
          where: { userId_key: { userId: user.id, key: s.key } },
          data: { value: encrypted },
        });
      }
      value = decrypted;
    }
    result[s.key] = maskSensitiveValue(s.key, value);
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

    const operations = Object.entries(body).map(([key, value]) => {
      const storedValue = isSensitiveKey(key) ? encrypt(value) : value;
      return db.setting.upsert({
        where: { userId_key: { userId: user.id, key } },
        update: { value: storedValue },
        create: { userId: user.id, key, value: storedValue },
      });
    });

    await Promise.all(operations);

    // Return all settings for this user after update
    const settings = await db.setting.findMany({ where: { userId: user.id } });
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = isSensitiveKey(s.key) ? decrypt(s.value) : s.value;
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

  let value = setting.value;
  if (isSensitiveKey(setting.key)) {
    const decrypted = decrypt(value);
    // If decrypt returned the same value, it's legacy plain-text — re-encrypt and save
    if (decrypted === value) {
      const encrypted = encrypt(value);
      await db.setting.update({
        where: { userId_key: { userId: user.id, key } },
        data: { value: encrypted },
      });
    }
    value = decrypted;
  }

  return c.json({ data: { key: setting.key, value } });
});

// PUT /api/settings/:key - set single setting for current user
settingsRouter.put(
  "/:key",
  zValidator("json", z.object({ value: z.string() })),
  async (c) => {
    const user = c.get("user")!;
    const key = c.req.param("key");
    const { value } = c.req.valid("json");

    const storedValue = isSensitiveKey(key) ? encrypt(value) : value;
    const setting = await db.setting.upsert({
      where: { userId_key: { userId: user.id, key } },
      update: { value: storedValue },
      create: { userId: user.id, key, value: storedValue },
    });

    return c.json({ data: { key: setting.key, value } });
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
