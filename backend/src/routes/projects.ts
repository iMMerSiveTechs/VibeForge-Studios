import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../prisma";
import { auth } from "../auth";

const projectsRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// GET /api/projects - list projects for the authenticated user
projectsRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const projects = await db.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  return c.json({ data: projects });
});

// POST /api/projects - create project for the authenticated user
projectsRouter.post(
  "/",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const { name } = c.req.valid("json");
    const bundleId =
      "com.vibeforge." + name.toLowerCase().replace(/[^a-z0-9]/g, "");

    const project = await db.project.create({
      data: { name, bundleId, userId: user.id },
    });
    return c.json({ data: project }, 201);
  }
);

// GET /api/projects/:id - get single project with runs (ownership enforced)
projectsRouter.get("/:id", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const id = c.req.param("id");
  const project = await db.project.findUnique({
    where: { id },
    include: { runs: { orderBy: { createdAt: "desc" } } },
  });

  if (!project) {
    return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
  }

  if (project.userId !== user.id) {
    return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
  }

  return c.json({ data: project });
});

// PUT /api/projects/:id - update project (ownership enforced)
projectsRouter.put(
  "/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).optional(),
      notes: z.string().optional(),
      vfAppSpec: z.string().nullable().optional(),
      previewState: z.string().optional(),
      files: z.string().optional(),
      artifacts: z.string().optional(),
      sourceRunId: z.string().nullable().optional(),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const id = c.req.param("id");
    const existing = await db.project.findUnique({ where: { id } });

    if (!existing) {
      return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
    }

    if (existing.userId !== user.id) {
      return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
    }

    const body = c.req.valid("json");
    const project = await db.project.update({
      where: { id },
      data: body,
    });
    return c.json({ data: project });
  }
);

// DELETE /api/projects/:id - delete project (ownership enforced)
projectsRouter.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const id = c.req.param("id");
  const existing = await db.project.findUnique({ where: { id } });

  if (!existing) {
    return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
  }

  if (existing.userId !== user.id) {
    return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
  }

  await db.project.delete({ where: { id } });
  return c.json({ data: { success: true } });
});

export { projectsRouter };
