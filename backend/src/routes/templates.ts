import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "../auth";
import { db } from "../prisma";
import { TEMPLATES, getTemplate } from "../lib/templates";

const templatesRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// GET /api/templates — list all templates (without files)
templatesRouter.get("/", (c) => {
  const list = TEMPLATES.map(({ id, name, description, icon }) => ({
    id,
    name,
    description,
    icon,
  }));
  return c.json({ data: list });
});

// POST /api/templates/:id/instantiate — create a project from a template
templatesRouter.post(
  "/:id/instantiate",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json(
        { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        401
      );
    }

    const templateId = c.req.param("id");
    const template = getTemplate(templateId);

    if (!template) {
      return c.json(
        { error: { message: "Template not found", code: "NOT_FOUND" } },
        404
      );
    }

    const { name } = c.req.valid("json");
    const bundleId =
      "com.vibeforge." + name.toLowerCase().replace(/[^a-z0-9]/g, "");

    const project = await db.project.create({
      data: {
        name,
        bundleId,
        userId: user.id,
        files: JSON.stringify(template.files),
      },
    });

    return c.json({ data: project }, 201);
  }
);

export { templatesRouter };
