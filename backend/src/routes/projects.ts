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
    select: {
      id: true,
      name: true,
      bundleId: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
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

// --- File CRUD within a project ---

// Helper: parse files JSON from project
function parseFiles(filesJson: string): Array<{ path: string; content: string }> {
  try {
    return JSON.parse(filesJson);
  } catch {
    return [];
  }
}

// GET /api/projects/:id/files - list file paths (lightweight, no content)
projectsRouter.get("/:id/files", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const id = c.req.param("id");
  const project = await db.project.findUnique({ where: { id } });
  if (!project || project.userId !== user.id) {
    return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
  }

  const files = parseFiles(project.files);
  const paths = files.map((f) => f.path);
  return c.json({ data: paths });
});

// GET /api/projects/:id/file?path=... - get single file content
projectsRouter.get("/:id/file", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const id = c.req.param("id");
  const filePath = c.req.query("path");
  if (!filePath) {
    return c.json({ error: { message: "Missing path query param", code: "BAD_REQUEST" } }, 400);
  }

  const project = await db.project.findUnique({ where: { id } });
  if (!project || project.userId !== user.id) {
    return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
  }

  const files = parseFiles(project.files);
  const file = files.find((f) => f.path === filePath);
  if (!file) {
    return c.json({ error: { message: "File not found", code: "NOT_FOUND" } }, 404);
  }

  return c.json({ data: file });
});

// PUT /api/projects/:id/file - create or update a file
projectsRouter.put(
  "/:id/file",
  zValidator(
    "json",
    z.object({
      path: z.string().min(1),
      content: z.string(),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const id = c.req.param("id");
    const project = await db.project.findUnique({ where: { id } });
    if (!project || project.userId !== user.id) {
      return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
    }

    const { path: filePath, content } = c.req.valid("json");
    const files = parseFiles(project.files);
    const idx = files.findIndex((f) => f.path === filePath);

    if (idx >= 0) {
      files[idx]!.content = content;
    } else {
      files.push({ path: filePath, content });
    }

    await db.project.update({
      where: { id },
      data: { files: JSON.stringify(files) },
    });

    return c.json({ data: { path: filePath, content } });
  }
);

// POST /api/projects/:id/file/rename - rename a file
projectsRouter.post(
  "/:id/file/rename",
  zValidator(
    "json",
    z.object({
      oldPath: z.string().min(1),
      newPath: z.string().min(1),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const id = c.req.param("id");
    const project = await db.project.findUnique({ where: { id } });
    if (!project || project.userId !== user.id) {
      return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
    }

    const { oldPath, newPath } = c.req.valid("json");
    const files = parseFiles(project.files);

    // Rename single file or all files under a folder
    let renamed = 0;
    for (const f of files) {
      if (f.path === oldPath) {
        f.path = newPath;
        renamed++;
      } else if (f.path.startsWith(oldPath + "/")) {
        f.path = newPath + f.path.slice(oldPath.length);
        renamed++;
      }
    }

    if (renamed === 0) {
      return c.json({ error: { message: "File not found", code: "NOT_FOUND" } }, 404);
    }

    await db.project.update({
      where: { id },
      data: { files: JSON.stringify(files) },
    });

    return c.json({ data: { renamed } });
  }
);

// DELETE /api/projects/:id/file?path=... - delete a file
projectsRouter.delete("/:id/file", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const id = c.req.param("id");
  const filePath = c.req.query("path");
  if (!filePath) {
    return c.json({ error: { message: "Missing path query param", code: "BAD_REQUEST" } }, 400);
  }

  const project = await db.project.findUnique({ where: { id } });
  if (!project || project.userId !== user.id) {
    return c.json({ error: { message: "Project not found", code: "NOT_FOUND" } }, 404);
  }

  const files = parseFiles(project.files);
  // Delete file or all files under folder
  const filtered = files.filter(
    (f) => f.path !== filePath && !f.path.startsWith(filePath + "/")
  );

  if (filtered.length === files.length) {
    return c.json({ error: { message: "File not found", code: "NOT_FOUND" } }, 404);
  }

  await db.project.update({
    where: { id },
    data: { files: JSON.stringify(filtered) },
  });

  return c.json({ data: { deleted: files.length - filtered.length } });
});

export { projectsRouter };
