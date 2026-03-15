/**
 * VibeForge Cognitive Engine - Fusion Layer
 * Reconciles outputs from parallel specialist roles + applies Critic patches
 */

import type { FusionInput, FusionOutput, CriticFinding, Artifact, CompressedSnapshot, RouterDecision } from "../types/vce";

export class Fusion {
  /**
   * Calculate contradiction score (0–1) based on role output conflicts
   */
  private calculateContradictionScore(taskResults: Map<string, string>): number {
    const results = Array.from(taskResults.values());
    if (results.length < 2) return 0;

    // Simple heuristic: if outputs differ in length significantly, likely contradiction
    const lengths = results.map((r) => r.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const deviation = Math.sqrt(
      lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length
    );

    // Normalize to 0–1 (high deviation = high contradiction score)
    const score = Math.min(deviation / (avgLength * 2), 1);

    // Check for explicit contradiction keywords
    const text = results.join("\n").toLowerCase();
    if (
      text.includes("however") ||
      text.includes("but") ||
      text.includes("contradiction") ||
      text.includes("conflict")
    ) {
      return Math.min(score + 0.3, 1);
    }

    return score;
  }

  /**
   * Apply Critic patches to Builder output if P0 issues found
   */
  private applyP0Patches(builderOutput: string, criticFindings: CriticFinding[]): string {
    let patched = builderOutput;

    for (const finding of criticFindings) {
      if (finding.severity === "P0" && finding.patchSuggestion) {
        // Simple replacement: if suggestion provided, incorporate it
        patched = patched.replace(
          `// TODO: ${finding.issue}`,
          `// PATCHED: ${finding.patchSuggestion}`
        );
      }
    }

    return patched;
  }

  /**
   * Merge multiple specialist outputs into coherent final
   */
  private mergeOutputs(
    taskResults: Map<string, string>,
    routeDecision: RouterDecision
  ): string {
    const resultArray = Array.from(taskResults.entries()).map(([role, output]) => ({
      role,
      output,
    }));

    if (resultArray.length === 0) return "";

    // For single mode, just return the Builder output
    if (routeDecision.mode === "single") {
      return taskResults.get("BUILDER") || "";
    }

    // For duo/fanout, format as sections
    let merged = "";

    // BUILDER output as primary
    if (taskResults.has("BUILDER")) {
      merged += `## Implementation\n${taskResults.get("BUILDER")!}\n\n`;
    }

    // ARCHITECT as secondary
    if (taskResults.has("ARCHITECT")) {
      merged += `## Architecture\n${taskResults.get("ARCHITECT")!}\n\n`;
    }

    // CRITIC findings
    if (taskResults.has("CRITIC")) {
      merged += `## Review\n${taskResults.get("CRITIC")!}\n\n`;
    }

    // Other roles
    for (const [role, output] of taskResults) {
      if (!["BUILDER", "ARCHITECT", "CRITIC"].includes(role) && output.trim()) {
        merged += `## ${role}\n${output}\n\n`;
      }
    }

    return merged.trim();
  }

  /**
   * Extract artifacts (code blocks, specs, etc.) from merged output
   */
  private extractArtifacts(output: string): Artifact[] {
    const artifacts: Artifact[] = [];
    let id = 0;

    // Find code blocks with language
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(output)) !== null) {
      const language = match[1] || "text";
      const content = (match[2] || "").trim();

      artifacts.push({
        id: `artifact-${id++}`,
        kind: "code",
        path: `generated.${language === "text" ? "txt" : language}`,
        language,
        content,
      });
    }

    // Find JSON spec blocks
    if (output.includes("VF_APP") || output.includes("vf_app")) {
      const jsonMatch = output.match(/\{[\s\S]*?"name"\s*:\s*[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          artifacts.push({
            id: `artifact-${id++}`,
            kind: "spec",
            path: "vf_app.json",
            content: JSON.stringify(parsed, null, 2),
          });
        } catch {
          // Not valid JSON
        }
      }
    }

    return artifacts;
  }

  /**
   * Compress output into a summary for memory
   */
  private compressOutput(output: string, maxChars: number = 500): string {
    if (output.length <= maxChars) return output;

    // Take first maxChars and add ellipsis
    return output.substring(0, maxChars) + "\n... [truncated]";
  }

  /**
   * Main fusion orchestration
   */
  async fuse(input: FusionInput): Promise<FusionOutput> {
    const { turnId, routeDecision, taskResults, criticFindings, contradictionScore } = input;

    // Apply P0 patches from Critic
    let builderOutput = taskResults.get("BUILDER") || "";
    if (criticFindings.some((f) => f.severity === "P0")) {
      builderOutput = this.applyP0Patches(builderOutput, criticFindings);
    }

    // Merge outputs based on mode
    const mergedOutput = this.mergeOutputs(taskResults, routeDecision);

    // Extract artifacts
    const artifacts = this.extractArtifacts(mergedOutput);

    // Determine if debate round should run
    // (only if fanout ≥ 3 AND contradiction > 0.7)
    const debateRoundPerformed =
      routeDecision.mode === "fanout" && taskResults.size >= 3 && contradictionScore > 0.7;

    // Create compressed snapshot
    const snapshot: CompressedSnapshot = {
      turnId,
      userInput: "[stored in turn record]",
      routePlan: routeDecision,
      finalOutput: mergedOutput,
      summary: this.compressOutput(mergedOutput),
      artifacts,
      createdAt: Date.now(),
      tokensUsed: {
        input: 0, // populated by caller
        output: 0,
      },
    };

    return {
      finalText: mergedOutput,
      artifacts,
      debateRoundPerformed,
      compressedSnapshot: snapshot,
    };
  }
}

export default Fusion;
