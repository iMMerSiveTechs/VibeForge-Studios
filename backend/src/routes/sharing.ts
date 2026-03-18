import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "../auth";
import { db } from "../prisma";

const sharingRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// POST /projects/:projectId/members — Add a member to a project (owner only)
sharingRouter.post(
  "/projects/:projectId/members",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      role: z.enum(["editor", "viewer"]),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const projectId = c.req.param("projectId");

    // Verify project exists and user is the owner
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
    }
    if (project.userId !== user.id) {
      return c.json({ error: { message: "Only the project owner can add members", code: "FORBIDDEN" } }, 403);
    }

    const { email, role } = c.req.valid("json");

    // Find user by email
    const targetUser = await db.user.findUnique({ where: { email } });
    if (!targetUser) {
      return c.json({ error: { message: "User not found with that email", code: "NOT_FOUND" } }, 404);
    }

    // Cannot add yourself
    if (targetUser.id === user.id) {
      return c.json({ error: { message: "Cannot add yourself as a member", code: "BAD_REQUEST" } }, 400);
    }

    // Create or update membership
    const member = await db.projectMember.upsert({
      where: {
        projectId_userId: { projectId, userId: targetUser.id },
      },
      update: { role },
      create: { projectId, userId: targetUser.id, role },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    return c.json({ data: member }, 201);
  }
);

// GET /projects/:projectId/members — List all members of a project
sharingRouter.get("/projects/:projectId/members", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const projectId = c.req.param("projectId");

  // Verify project exists
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
  }

  // Must be owner or a member
  const isOwner = project.userId === user.id;
  if (!isOwner) {
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    if (!membership) {
      return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
    }
  }

  const members = await db.projectMember.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { invitedAt: "desc" },
  });

  return c.json({ data: members });
});

// DELETE /projects/:projectId/members/:memberId — Remove a member (owner only)
sharingRouter.delete("/projects/:projectId/members/:memberId", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const projectId = c.req.param("projectId");
  const memberId = c.req.param("memberId");

  // Verify project exists and user is the owner
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
  }
  if (project.userId !== user.id) {
    return c.json({ error: { message: "Only the project owner can remove members", code: "FORBIDDEN" } }, 403);
  }

  // Find and delete the member
  const member = await db.projectMember.findFirst({
    where: { id: memberId, projectId },
  });
  if (!member) {
    return c.json({ error: { message: "Member not found", code: "NOT_FOUND" } }, 404);
  }

  await db.projectMember.delete({ where: { id: memberId } });

  return c.json({ data: { success: true } });
});

// GET /shared — Return projects shared with the current user (not owned)
sharingRouter.get("/shared", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const memberships = await db.projectMember.findMany({
    where: { userId: user.id },
    include: {
      project: true,
    },
    orderBy: { invitedAt: "desc" },
  });

  // Filter out projects the user owns (they shouldn't be members of their own, but just in case)
  const sharedProjects = memberships
    .filter((m) => m.project.userId !== user.id)
    .map((m) => ({
      ...m.project,
      role: m.role,
    }));

  return c.json({ data: sharedProjects });
});

export { sharingRouter };
