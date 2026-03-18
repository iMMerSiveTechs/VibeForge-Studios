import React, { useState, useRef, useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Copy, Check, ChevronRight } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { C } from "@/theme/colors";
import { cn } from "@/lib/cn";

interface FileItem {
  id: string;
  path: string;
  content: string;
}

interface FileTreeProps {
  files: FileItem[];
  projectName?: string;
}

export function FileTree({ files, projectName }: FileTreeProps) {
  const [activeId, setActiveId] = useState<string>(files[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyAllTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (copyAllTimerRef.current) clearTimeout(copyAllTimerRef.current);
    };
  }, []);

  const activeFile = files.find((f) => f.id === activeId);
  const lines = activeFile?.content.split("\n") ?? [];

  const handleCopy = async () => {
    if (!activeFile) return;
    await Clipboard.setStringAsync(activeFile.content);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAll = async () => {
    const allContent = files
      .map((f) => `// --- ${f.path} ---\n${f.content}`)
      .join("\n\n");
    await Clipboard.setStringAsync(allContent);
    setCopiedAll(true);
    if (copyAllTimerRef.current) clearTimeout(copyAllTimerRef.current);
    copyAllTimerRef.current = setTimeout(() => setCopiedAll(false), 2000);
  };

  const getFilename = (path: string) => {
    const parts = path.split("/");
    return parts[parts.length - 1] ?? path;
  };

  return (
    <View className="rounded-xl border border-vf-b1 overflow-hidden bg-vf-s1">
      {/* Project header */}
      {projectName ? (
        <View className="flex-row items-center px-3 py-2 border-b border-vf-b1">
          <ChevronRight size={14} color={C.cy} />
          <Text
            className="text-vf-cyan text-xs ml-1 uppercase tracking-wider"
            style={{ fontFamily: "monospace" }}
          >
            {projectName}
          </Text>
        </View>
      ) : null}

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        className="border-b border-vf-b1"
      >
        <View className="flex-row">
          {files.map((file) => (
            <Pressable
              key={file.id}
              onPress={() => setActiveId(file.id)}
              accessibilityLabel={getFilename(file.path)}
              accessibilityRole="tab"
              className={cn(
                "px-3 py-2",
                activeId === file.id
                  ? "border-b-2 border-vf-cyan"
                  : "border-b-2 border-transparent"
              )}
            >
              <Text
                className={cn(
                  "text-xs",
                  activeId === file.id ? "text-vf-cyan" : "text-vf-dim"
                )}
                style={{ fontFamily: "monospace" }}
              >
                {getFilename(file.path)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View className="flex-row justify-end px-3 py-1.5 space-x-2 border-b border-vf-b1">
        <Pressable
          onPress={handleCopy}
          accessibilityLabel="Copy file"
          accessibilityRole="button"
          className="flex-row items-center px-2 py-1 rounded bg-vf-s2 mr-2"
        >
          {copied ? (
            <Check size={12} color={C.green} />
          ) : (
            <Copy size={12} color={C.mid} />
          )}
          <Text
            className="text-vf-mid text-xs ml-1"
            style={{ fontFamily: "monospace" }}
          >
            {copied ? "Copied" : "Copy"}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleCopyAll}
          accessibilityLabel="Copy all files"
          accessibilityRole="button"
          className="flex-row items-center px-2 py-1 rounded bg-vf-s2"
        >
          {copiedAll ? (
            <Check size={12} color={C.green} />
          ) : (
            <Copy size={12} color={C.mid} />
          )}
          <Text
            className="text-vf-mid text-xs ml-1"
            style={{ fontFamily: "monospace" }}
          >
            {copiedAll ? "All copied" : "Copy all"}
          </Text>
        </Pressable>
      </View>

      {/* Code content */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="p-3" style={{ backgroundColor: "#000000" }}>
          {lines.map((line, i) => (
            <View key={i} className="flex-row">
              <Text
                className="text-vf-dim text-xs w-8 text-right mr-3"
                style={{ fontFamily: "monospace" }}
              >
                {i + 1}
              </Text>
              <Text
                className="text-vf-text text-xs"
                style={{ fontFamily: "monospace" }}
              >
                {line || " "}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
