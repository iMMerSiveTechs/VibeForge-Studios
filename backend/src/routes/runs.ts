import { auth } from "../auth";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../prisma";

const runsRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// GET /api/runs - list all runs ordered by createdAt desc, include project name
runsRouter.get("/", async (c) => {
  const runs = await db.run.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      project: {
        select: { name: true },
      },
    },
  });
  return c.json({ data: runs });
});

// GET /api/runs/:id - get single run
runsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const run = await db.run.findUnique({
    where: { id },
    include: {
      project: {
        select: { name: true },
      },
    },
  });

  if (!run) {
    return c.json({ error: { message: "Run not found", code: "NOT_FOUND" } }, 404);
  }

  return c.json({ data: run });
});

// POST /api/runs - create run
runsRouter.post(
  "/",
  zValidator(
    "json",
    z.object({
      projectId: z.string().min(1),
      inputSystem: z.string().optional(),
      inputUser: z.string().optional(),
      inputModel: z.string().optional(),
      inputMaxTokens: z.number().int().positive().optional(),
      inputTemperature: z.number().min(0).max(2).optional(),
    })
  ),
  async (c) => {
    const body = c.req.valid("json");

    const project = await db.project.findUnique({
      where: { id: body.projectId },
    });
    if (!project) {
      return c.json(
        { error: { message: "Project not found", code: "NOT_FOUND" } },
        404
      );
    }

    const run = await db.run.create({
      data: {
        projectId: body.projectId,
        inputSystem: body.inputSystem ?? "",
        inputUser: body.inputUser ?? "",
        inputModel: body.inputModel ?? "claude-opus-4-6",
        inputMaxTokens: body.inputMaxTokens ?? 16000,
        inputTemperature: body.inputTemperature ?? 0.7,
      },
    });
    return c.json({ data: run }, 201);
  }
);

// PUT /api/runs/:id - update run
runsRouter.put(
  "/:id",
  zValidator(
    "json",
    z.object({
      status: z.string().optional(),
      outputTextExcerpt: z.string().optional(),
      outputStoredPath: z.string().nullable().optional(),
      usageInputTokens: z.number().int().nullable().optional(),
      usageOutputTokens: z.number().int().nullable().optional(),
      parseHasVfApp: z.boolean().optional(),
      parseHasVfPack: z.boolean().optional(),
      parseFileCount: z.number().int().optional(),
      error: z.string().nullable().optional(),
    })
  ),
  async (c) => {
    const id = c.req.param("id");

    const existing = await db.run.findUnique({ where: { id } });
    if (!existing) {
      return c.json(
        { error: { message: "Run not found", code: "NOT_FOUND" } },
        404
      );
    }

    const body = c.req.valid("json");
    const run = await db.run.update({
      where: { id },
      data: body,
    });
    return c.json({ data: run });
  }
);

export { runsRouter };

// Separate router for project-scoped runs
const projectRunsRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// GET /api/projects/:projectId/runs - get runs for specific project
projectRunsRouter.get("/:projectId/runs", async (c) => {
  const projectId = c.req.param("projectId");

  const project = await db.project.findUnique({
    where: { id: projectId },
  });
  if (!project) {
    return c.json(
      { error: { message: "Project not found", code: "NOT_FOUND" } },
      404
    );
  }

  const runs = await db.run.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  return c.json({ data: runs });
});

export { projectRunsRouter };
