import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../prisma";
import { auth } from "../auth";

const snapshotsRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// GET /projects/:projectId/snapshots — list snapshots for a project
snapshotsRouter.get("/projects/:projectId/snapshots", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const projectId = c.req.param("projectId");

  // Verify project ownership
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== user.id) {
    return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
  }

  const snapshots = await db.projectSnapshot.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return c.json({ data: snapshots });
});

// POST /projects/:projectId/snapshots — create a snapshot from current project files
snapshotsRouter.post(
  "/projects/:projectId/snapshots",
  zValidator("json", z.object({ description: z.string().optional() })),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const projectId = c.req.param("projectId");
    const { description } = c.req.valid("json");

    // Verify project ownership
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== user.id) {
      return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
    }

    const snapshot = await db.projectSnapshot.create({
      data: {
        projectId,
        files: project.files,
        description: description ?? "",
      },
    });

    return c.json({ data: snapshot });
  }
);

// POST /projects/:projectId/snapshots/:snapshotId/restore — restore project files from snapshot
snapshotsRouter.post("/projects/:projectId/snapshots/:snapshotId/restore", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const projectId = c.req.param("projectId");
  const snapshotId = c.req.param("snapshotId");

  // Verify project ownership
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== user.id) {
    return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
  }

  // Find the snapshot
  const snapshot = await db.projectSnapshot.findUnique({ where: { id: snapshotId } });
  if (!snapshot || snapshot.projectId !== projectId) {
    return c.json({ error: { message: "Snapshot not found", code: "NOT_FOUND" } }, 404);
  }

  // Restore project files from snapshot
  const updatedProject = await db.project.update({
    where: { id: projectId },
    data: { files: snapshot.files },
  });

  return c.json({ data: updatedProject });
});

export { snapshotsRouter };
