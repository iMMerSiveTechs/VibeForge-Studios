import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../prisma";
import { auth } from "../auth";
import { triggerBuild, getBuildStatus } from "../lib/eas-build";

const buildsRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// POST /api/builds/:projectId — Trigger a build
buildsRouter.post(
  "/:projectId",
  zValidator(
    "json",
    z.object({
      platform: z.enum(["ios", "android"]),
      profile: z.enum(["development", "preview", "production"]),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const projectId = c.req.param("projectId");
    const project = await db.project.findUnique({ where: { id: projectId } });

    if (!project) {
      return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
    }

    if (project.userId !== user.id) {
      return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
    }

    // Check entitlements: require a paid plan
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription || subscription.plan === "FREE") {
      return c.json(
        { error: { message: "Upgrade to Pro to use builds", code: "FORBIDDEN" } },
        403
      );
    }

    // Rate limit: only one active build at a time
    const activeBuild = await db.build.findFirst({
      where: {
        userId: user.id,
        status: { in: ["QUEUED", "BUILDING"] },
      },
    });

    if (activeBuild) {
      return c.json(
        { error: { message: "You already have an active build", code: "RATE_LIMITED" } },
        429
      );
    }

    // Get EXPO_TOKEN from user settings
    const expoTokenSetting = await db.setting.findUnique({
      where: { userId_key: { userId: user.id, key: "expo_token" } },
    });

    if (!expoTokenSetting) {
      return c.json(
        { error: { message: "Add your Expo token in Settings", code: "BAD_REQUEST" } },
        400
      );
    }

    const { platform, profile } = c.req.valid("json");

    // Trigger the build via EAS
    const easResult = await triggerBuild({
      projectId,
      platform,
      profile,
      expoToken: expoTokenSetting.value,
    });

    // Create Build record in DB
    const build = await db.build.create({
      data: {
        projectId,
        userId: user.id,
        platform,
        profile,
        status: "QUEUED",
        easBuildId: easResult.easBuildId,
      },
    });

    return c.json({ data: build }, 201);
  }
);

// GET /api/builds/:projectId — List builds for a project
buildsRouter.get("/:projectId", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const projectId = c.req.param("projectId");
  const project = await db.project.findUnique({ where: { id: projectId } });

  if (!project) {
    return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
  }

  if (project.userId !== user.id) {
    return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
  }

  const builds = await db.build.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return c.json({ data: builds });
});

// GET /api/builds/:projectId/:buildId — Get single build status
buildsRouter.get("/:projectId/:buildId", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const projectId = c.req.param("projectId");
  const buildId = c.req.param("buildId");

  const build = await db.build.findUnique({ where: { id: buildId } });

  if (!build) {
    return c.json({ error: { message: "Build not found", code: "NOT_FOUND" } }, 404);
  }

  if (build.userId !== user.id || build.projectId !== projectId) {
    return c.json({ error: { message: "Build not found", code: "NOT_FOUND" } }, 404);
  }

  // If build is still in progress, poll EAS for the latest status
  if ((build.status === "QUEUED" || build.status === "BUILDING") && build.easBuildId) {
    // Get expo token for status polling
    const expoTokenSetting = await db.setting.findUnique({
      where: { userId_key: { userId: user.id, key: "expo_token" } },
    });
    const latestStatus = await getBuildStatus(build.easBuildId, expoTokenSetting?.value ?? "");

    if (latestStatus.status !== build.status) {
      const now = new Date();
      const updatedBuild = await db.build.update({
        where: { id: buildId },
        data: {
          status: latestStatus.status,
          artifactUrl: latestStatus.artifactUrl ?? build.artifactUrl,
          logsUrl: latestStatus.logsUrl ?? build.logsUrl,
          startedAt: latestStatus.status === "BUILDING" && !build.startedAt ? now : build.startedAt,
          completedAt: ["SUCCESS", "FAILED", "CANCELLED"].includes(latestStatus.status) ? now : build.completedAt,
        },
      });

      return c.json({ data: updatedBuild });
    }
  }

  return c.json({ data: build });
});

export { buildsRouter };
