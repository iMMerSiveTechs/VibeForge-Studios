import { Hono } from "hono";
import { auth } from "../auth";
import { db } from "../prisma";
import { MODEL_CATALOG } from "../lib/model-catalog";

const modelsRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// GET /api/models - returns model catalog filtered by configured providers
modelsRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);

  // Determine which providers the user has configured
  const settings = await db.setting.findMany({ where: { userId: user.id } });
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const configuredProviders = new Set<string>();
  if (settingsMap["api_key_claude"]) configuredProviders.add("anthropic");
  if (settingsMap["api_key_openai"]) configuredProviders.add("openai");
  if (settingsMap["api_key_gemini"]) configuredProviders.add("gemini");

  // If no providers configured, return all (user hasn't set up yet)
  const models =
    configuredProviders.size === 0
      ? MODEL_CATALOG
      : MODEL_CATALOG.filter((m) => configuredProviders.has(m.provider));

  const presetDefaults = {
    FAST: { tier: "fast", description: "Speed-optimized. Best for iteration and quick answers." },
    SMART: { tier: "smart", description: "Balanced. Best for most production tasks." },
    DEEP: { tier: "max", description: "Maximum capability. Best for complex architecture and reasoning." },
  };

  return c.json({ data: { models, presetDefaults } });
});

export { modelsRouter };
