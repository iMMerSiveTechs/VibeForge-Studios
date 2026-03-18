import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import "./env";
import { auth } from "./auth";
import { sampleRouter } from "./routes/sample";
import { projectsRouter } from "./routes/projects";
import { runsRouter, projectRunsRouter } from "./routes/runs";
import { settingsRouter } from "./routes/settings";
import { generateRouter } from "./routes/generate";
import { uploadRouter } from "./routes/upload";
import { filesRouter } from "./routes/files";
import { aiRouter } from "./routes/ai";
import { devRouter } from "./routes/dev";
import { vceHonoRouter } from "./routes/vce";
import { modelsRouter } from "./routes/models";
import { feedbackRouter } from "./routes/feedback";
import { subscriptionsRouter } from "./routes/subscriptions";
import { buildsRouter } from "./routes/builds";
import { codegenRouter } from "./routes/codegen";
import { analyticsRouter } from "./routes/analytics";
import { templatesRouter } from "./routes/templates";
import { snapshotsRouter } from "./routes/snapshots";
import { logger } from "hono/logger";
import { rateLimit, getClientIP, getUserId } from "./middleware/rate-limit";

// Type the Hono app with user/session variables
const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// CORS middleware - validates origin against allowlist
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecodeapp\.com$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.dev$/,
  /^https:\/\/vibecode\.dev$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Auth middleware - populates user/session for all routes
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

// Apply rate limits (after auth middleware so user is available)
app.use("/api/auth/*", rateLimit({ windowMs: 60_000, max: 10, keyFn: getClientIP }));
app.use("/api/ai/*", rateLimit({ windowMs: 60_000, max: 20, keyFn: getUserId }));
app.use("/api/vce/*", rateLimit({ windowMs: 60_000, max: 10, keyFn: getUserId }));
app.use("/api/generate/*", rateLimit({ windowMs: 60_000, max: 15, keyFn: getUserId }));

// Mount auth handler
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Example protected route
app.get("/api/me", (c) => {
  const user = c.get("user");
  if (!user) return c.body(null, 401);
  return c.json({ data: { user } });
});

// GDPR: Delete account and all associated data
app.delete("/api/me", async (c) => {
  const user = c.get("user");
  if (!user) return c.body(null, 401);

  const { db } = await import("./prisma");

  // Cascade deletes all related data (sessions, accounts, projects, runs, settings, assets)
  // because Prisma schema has onDelete: Cascade on all User relations
  await db.user.delete({ where: { id: user.id } });

  return c.body(null, 204);
});

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/projects", projectsRouter);
app.route("/api/runs", runsRouter);
app.route("/api/projects", projectRunsRouter);
app.route("/api/settings", settingsRouter);
app.route("/api/models", modelsRouter);
app.route("/api/generate", generateRouter);
app.route("/api/projects", uploadRouter);
app.route("/api/files", filesRouter);
app.route("/api/ai", aiRouter);
app.route("/api/dev", devRouter);
app.route("/api/vce", vceHonoRouter);
app.route("/api/feedback", feedbackRouter);
app.route("/api/subscriptions", subscriptionsRouter);
app.route("/api/builds", buildsRouter);
app.route("/api/codegen", codegenRouter);
app.route("/api/analytics", analyticsRouter);
app.route("/api/templates", templatesRouter);
app.route("/api", snapshotsRouter);

// Mount upload endpoint directly
app.post("/api/upload", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json(
      { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      401
    );
  }

  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return c.json(
      { error: { message: "No file provided", code: "MISSING_FILE" } },
      400
    );
  }

  try {
    const storageFormData = new FormData();
    storageFormData.append("file", file);

    const storageResponse = await fetch(
      "https://storage.vibecodeapp.com/v1/files/upload",
      {
        method: "POST",
        body: storageFormData,
      }
    );

    if (!storageResponse.ok) {
      const errorData = await storageResponse.json().catch(() => ({}));
      return c.json(
        {
          error: {
            message:
              (errorData as { error?: string }).error ||
              "Failed to upload file to storage",
            code: "STORAGE_UPLOAD_FAILED",
          },
        },
        500
      );
    }

    const storageData = (await storageResponse.json()) as {
      fileId: string;
      url: string;
      filename: string;
      contentType: string;
      sizeBytes: number;
    };

    const { db } = await import("./prisma");
    const asset = await db.asset.create({
      data: {
        userId: user.id,
        fileId: storageData.fileId,
        url: storageData.url,
        filename: storageData.filename,
        contentType: storageData.contentType,
        sizeBytes: storageData.sizeBytes,
      },
    });

    return c.json({ data: asset });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to upload file";
    return c.json(
      { error: { message, code: "UPLOAD_ERROR" } },
      500
    );
  }
});

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
