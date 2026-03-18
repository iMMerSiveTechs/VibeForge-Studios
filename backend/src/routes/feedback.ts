import { auth } from "../auth";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../prisma";

const feedbackRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// GET / - list user's feedback
feedbackRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const feedbacks = await db.feedback.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return c.json({ data: feedbacks });
});

// POST / - submit feedback
feedbackRouter.post(
  "/",
  zValidator(
    "json",
    z.object({
      type: z.enum(["bug", "feature", "question", "other"]),
      subject: z.string().min(1).max(500),
      description: z.string().min(1).max(5000),
    })
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const { type, subject, description } = c.req.valid("json");

    const feedback = await db.feedback.create({
      data: {
        userId: user.id,
        type,
        subject,
        description,
      },
    });

    return c.json({ data: feedback });
  }
);

// DELETE /:id - delete feedback
feedbackRouter.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const id = c.req.param("id");
  const feedback = await db.feedback.findUnique({ where: { id } });

  if (!feedback || feedback.userId !== user.id) {
    return c.json({ error: { message: "Not found", code: "NOT_FOUND" } }, 404);
  }

  await db.feedback.delete({ where: { id } });
  return c.body(null, 204);
});

export { feedbackRouter };
