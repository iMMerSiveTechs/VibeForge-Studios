import { C } from "@/theme/colors";
import type { Run } from "@/lib/types";

export function getProviderInfo(model: string): { name: string; color: string } {
  if (model.includes("claude")) return { name: "Claude", color: "#D4A574" };
  if (model.includes("gpt") || model.includes("openai"))
    return { name: "OpenAI", color: "#74AA9C" };
  if (model.includes("gemini")) return { name: "Gemini", color: "#4285F4" };
  return { name: "AI", color: "#999" };
}

export function getRate(model: string): number {
  if (model.includes("claude")) return 15;
  if (model.includes("gpt")) return 10;
  if (model.includes("gemini")) return 7;
  return 10;
}

export function getRunCost(run: Run): number {
  const totalTokens =
    (run.usageInputTokens ?? 0) + (run.usageOutputTokens ?? 0);
  const rate = getRate(run.inputModel);
  return (totalTokens / 1_000_000) * rate;
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatTokens(n: number | null): string {
  if (n === null || n === undefined) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function getStatusColor(status: string): string {
  if (status === "done" || status === "completed") return C.green;
  if (status === "error" || status === "failed") return C.red;
  if (status === "pending" || status === "running") return C.warn;
  return C.dim;
}
