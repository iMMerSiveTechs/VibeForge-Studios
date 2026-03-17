/**
 * EAS Build Module
 *
 * Handles triggering Expo Application Services (EAS) builds
 * and polling their status. Returns mock results in dev mode.
 */

import { env } from "../env";

interface BuildParams {
  projectId: string;
  platform: "ios" | "android";
  profile: "development" | "preview" | "production";
  expoToken: string;
  expoProjectId?: string;
}

interface BuildResult {
  easBuildId: string;
  status: string;
  artifactUrl?: string;
  logsUrl?: string;
}

/**
 * Trigger an EAS build. In dev mode, returns a mock build.
 */
export async function triggerBuild(params: BuildParams): Promise<BuildResult> {
  // In dev mode, return mock
  if (env.NODE_ENV !== "production") {
    const mockId = `mock-build-${Date.now()}`;
    return {
      easBuildId: mockId,
      status: "QUEUED",
      logsUrl: `https://expo.dev/builds/${mockId}`,
    };
  }

  // In production, call Expo API
  const response = await fetch("https://api.expo.dev/v2/builds", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.expoToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      platform: params.platform,
      profile: params.profile,
      projectId: params.expoProjectId,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`EAS Build API error: ${err}`);
  }

  const data = (await response.json()) as { id: string; status: string };
  return {
    easBuildId: data.id,
    status: data.status,
    logsUrl: `https://expo.dev/builds/${data.id}`,
  };
}

/**
 * Get build status from Expo API
 */
export async function getBuildStatus(
  easBuildId: string,
  expoToken: string
): Promise<BuildResult> {
  // Mock in dev
  if (env.NODE_ENV !== "production" || easBuildId.startsWith("mock-")) {
    // Simulate progression
    const age =
      Date.now() - parseInt(easBuildId.replace("mock-build-", ""), 10);
    let status = "QUEUED";
    if (age > 5000) status = "BUILDING";
    if (age > 15000) status = "SUCCESS";
    return {
      easBuildId,
      status,
      artifactUrl:
        status === "SUCCESS"
          ? `https://expo.dev/artifacts/${easBuildId}`
          : undefined,
      logsUrl: `https://expo.dev/builds/${easBuildId}`,
    };
  }

  const response = await fetch(
    `https://api.expo.dev/v2/builds/${easBuildId}`,
    {
      headers: { Authorization: `Bearer ${expoToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get build status`);
  }

  const data = (await response.json()) as {
    id: string;
    status: string;
    artifacts?: { buildUrl?: string };
    logsUrl?: string;
  };
  return {
    easBuildId: data.id,
    status: data.status,
    artifactUrl: data.artifacts?.buildUrl,
    logsUrl: data.logsUrl,
  };
}
