import { Hono } from "hono";
import { db } from "../prisma";
import { auth } from "../auth";

const filesRouter = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// DELETE /api/files/:id
// Deletes a file from the database and storage service
filesRouter.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json(
      { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      401
    );
  }

  const assetId = c.req.param("id");

  try {
    // Find the asset and verify ownership
    const asset = await db.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return c.json(
        { error: { message: "Asset not found", code: "NOT_FOUND" } },
        404
      );
    }

    if (asset.userId !== user.id) {
      return c.json(
        { error: { message: "Forbidden", code: "FORBIDDEN" } },
        403
      );
    }

    // Delete from storage service
    const storageResponse = await fetch(
      `https://storage.vibecodeapp.com/v1/files/${asset.fileId}`,
      {
        method: "DELETE",
      }
    );

    // Even if storage deletion fails, we'll still delete from database
    // Log the error but continue
    if (!storageResponse.ok) {
      console.error(
        `Failed to delete file ${asset.fileId} from storage: ${storageResponse.status}`
      );
    }

    // Delete from database
    await db.asset.delete({
      where: { id: assetId },
    });

    return c.body(null, 204);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete file";
    return c.json(
      { error: { message, code: "DELETE_ERROR" } },
      500
    );
  }
});

// GET /api/files
// List all files for the authenticated user
filesRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json(
      { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      401
    );
  }

  try {
    const assets = await db.asset.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ data: assets });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch files";
    return c.json(
      { error: { message, code: "FETCH_ERROR" } },
      500
    );
  }
});

export { filesRouter };
