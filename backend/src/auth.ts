import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "./prisma";
import { env } from "./env";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BACKEND_URL,

  // ============================================
  // REQUIRED: All trustedOrigins below are needed
  // ============================================
  trustedOrigins: [
    "vibecode://*/*",           // Mobile deep links - REQUIRED
    "exp://*/*",                // Expo development - REQUIRED
    "http://localhost:*",
    "http://127.0.0.1:*",
    "https://*.dev.vibecode.run",
    "https://*.vibecode.run",
    "https://*.vibecodeapp.com",
    "https://*.vibecode.dev",
    "https://vibecode.dev",
  ],

  plugins: [
    expo(),
    emailOTP({
      // Set OTP expiration time (in seconds) - default is 5 minutes
      expiresIn: 60 * 10, // 10 minutes for easier testing

      // IMPORTANT: Disable this to allow OTP sign-in for users who don't exist yet
      // When false, Better Auth will create the user account on successful OTP verification
      disableSignUp: false,

      async sendVerificationOTP({ email, otp, type }) {
        // Log OTP for debugging (remove in production)
        console.log(`[OTP DEBUG] Sending OTP for ${email}:`, { otp, type });

        // Send OTP via Vibecode SMTP service (no auth required)
        const response = await fetch("https://smtp.vibecodeapp.com/v1/send/otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            code: String(otp),
            fromName: "VibeForge Studio",
            lang: "en",
          }),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          console.error(`[OTP DEBUG] Failed to send OTP:`, data);
          throw new Error(data?.error || `Failed to send OTP (HTTP ${response.status})`);
        }

        console.log(`[OTP DEBUG] OTP sent successfully to ${email}`);
      },
    }),
  ],

  // ============================================
  // REQUIRED: Cross-origin cookie settings
  // Without this, sessions return null in mobile/iframe
  // ============================================
  advanced: {
    trustedProxyHeaders: true,
    disableCSRFCheck: true,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true,
    },
  },
});
