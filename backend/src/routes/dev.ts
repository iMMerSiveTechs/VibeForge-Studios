import { Hono } from "hono";
import { env } from "../env";
import { prisma } from "../prisma";

const devRouter = new Hono();

/**
 * Development-only endpoint to get the latest OTP for an email
 * This helps with testing without having to check the database manually
 *
 * IMPORTANT: This endpoint only works in development mode
 */
devRouter.get("/otp/:email", async (c) => {
  // Only allow in development
  if (env.NODE_ENV === "production") {
    return c.json({ error: "Not available in production" }, 403);
  }

  const email = c.req.param("email");
  if (!email) {
    return c.json({ error: "Email is required" }, 400);
  }

  // Get the latest OTP for this email
  const verification = await prisma.verification.findFirst({
    where: {
      identifier: {
        contains: email,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!verification) {
    return c.json({ error: "No OTP found for this email" }, 404);
  }

  // Extract OTP from value (format: "123456:0")
  const [otp, attempts] = verification.value.split(":");
  const isExpired = verification.expiresAt < new Date();

  return c.json({
    data: {
      email,
      otp,
      identifier: verification.identifier,
      attempts: parseInt(attempts || "0"),
      expiresAt: verification.expiresAt,
      isExpired,
      createdAt: verification.createdAt,
    },
  });
});

/**
 * Development-only endpoint to clear all verifications
 * Useful for testing
 */
devRouter.delete("/verifications", async (c) => {
  // Only allow in development
  if (env.NODE_ENV === "production") {
    return c.json({ error: "Not available in production" }, 403);
  }

  const result = await prisma.verification.deleteMany({});

  return c.json({
    data: {
      deleted: result.count,
    },
  });
});

export { devRouter };
