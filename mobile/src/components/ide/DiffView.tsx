import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { C } from "@/theme/colors";

interface DiffViewProps {
  oldText: string;
  newText: string;
}

type DiffLineType = "added" | "removed" | "unchanged";

interface DiffLine {
  type: DiffLineType;
  text: string;
  oldLineNum: number | null;
  newLineNum: number | null;
}

/**
 * Simple LCS-based diff algorithm.
 * Computes the longest common subsequence of lines, then marks
 * lines not in the LCS as added or removed.
 */
function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  const stack: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      stack.push({
        type: "unchanged",
        text: oldLines[i - 1],
        oldLineNum: i,
        newLineNum: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({
        type: "added",
        text: newLines[j - 1],
        oldLineNum: null,
        newLineNum: j,
      });
      j--;
    } else {
      stack.push({
        type: "removed",
        text: oldLines[i - 1],
        oldLineNum: i,
        newLineNum: null,
      });
      i--;
    }
  }

  // Reverse since we built it backwards
  for (let k = stack.length - 1; k >= 0; k--) {
    result.push(stack[k]);
  }

  return result;
}

const LINE_COLORS: Record<DiffLineType, { bg: string; text: string; prefix: string }> = {
  added: {
    bg: "rgba(0, 200, 83, 0.12)",
    text: "#68D391",
    prefix: "+",
  },
  removed: {
    bg: "rgba(255, 59, 48, 0.12)",
    text: "#FF6B6B",
    prefix: "-",
  },
  unchanged: {
    bg: "transparent",
    text: C.mid,
    prefix: " ",
  },
};

export function DiffView({ oldText, newText }: DiffViewProps) {
  const diffLines = useMemo(() => computeDiff(oldText, newText), [oldText, newText]);

  const maxOldLine = diffLines.reduce(
    (max, l) => Math.max(max, l.oldLineNum ?? 0),
    0
  );
  const maxNewLine = diffLines.reduce(
    (max, l) => Math.max(max, l.newLineNum ?? 0),
    0
  );
  const gutterWidth = Math.max(String(maxOldLine).length, String(maxNewLine).length) * 9 + 4;

  const addedCount = diffLines.filter((l) => l.type === "added").length;
  const removedCount = diffLines.filter((l) => l.type === "removed").length;

  return (
    <View className="flex-1 bg-black">
      {/* Diff header */}
      <View className="flex-row items-center px-3 py-2 bg-vf-s1 border-b border-vf-b1">
        <Text
          className="text-vf-text text-xs"
          style={{ fontFamily: "monospace" }}
        >
          Changes
        </Text>
        <Text
          className="text-xs ml-3"
          style={{ fontFamily: "monospace", color: "#68D391" }}
        >
          +{addedCount}
        </Text>
        <Text
          className="text-xs ml-2"
          style={{ fontFamily: "monospace", color: "#FF6B6B" }}
        >
          -{removedCount}
        </Text>
      </View>

      {/* Diff body */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: "100%" }}>
            {diffLines.map((line, idx) => {
              const colors = LINE_COLORS[line.type];
              return (
                <View
                  key={idx}
                  className="flex-row"
                  style={{ backgroundColor: colors.bg }}
                >
                  {/* Old line number */}
                  <Text
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      lineHeight: 20,
                      width: gutterWidth,
                      textAlign: "right",
                      color: C.dim,
                      paddingRight: 2,
                    }}
                  >
                    {line.oldLineNum ?? " "}
                  </Text>

                  {/* New line number */}
                  <Text
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      lineHeight: 20,
                      width: gutterWidth,
                      textAlign: "right",
                      color: C.dim,
                      paddingRight: 4,
                    }}
                  >
                    {line.newLineNum ?? " "}
                  </Text>

                  {/* Prefix */}
                  <Text
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      lineHeight: 20,
                      width: 16,
                      textAlign: "center",
                      color: colors.text,
                    }}
                  >
                    {colors.prefix}
                  </Text>

                  {/* Line text */}
                  <Text
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      lineHeight: 20,
                      color: colors.text,
                      paddingRight: 16,
                    }}
                  >
                    {line.text}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}
