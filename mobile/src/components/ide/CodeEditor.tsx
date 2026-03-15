import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Save,
  Copy,
  Check,
  Undo2,
  FileText,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { C } from "@/theme/colors";
import { cn } from "@/lib/cn";

interface CodeEditorProps {
  filePath: string;
  content: string;
  onSave: (content: string) => void;
  isSaving?: boolean;
  readOnly?: boolean;
}

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return "TypeScript";
    case "js":
    case "jsx":
      return "JavaScript";
    case "json":
      return "JSON";
    case "css":
      return "CSS";
    case "html":
      return "HTML";
    case "md":
      return "Markdown";
    case "prisma":
      return "Prisma";
    case "env":
      return "Env";
    case "yaml":
    case "yml":
      return "YAML";
    default:
      return ext?.toUpperCase() ?? "Text";
  }
}

function getFilename(path: string): string {
  return path.split("/").pop() ?? path;
}

export function CodeEditor({
  filePath,
  content,
  onSave,
  isSaving = false,
  readOnly = false,
}: CodeEditorProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const hasChanges = editedContent !== content;

  // Reset when file changes
  React.useEffect(() => {
    setEditedContent(content);
  }, [content, filePath]);

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(editedContent);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleUndo = () => {
    setEditedContent(content);
  };

  const handleSave = () => {
    onSave(editedContent);
  };

  const lines = editedContent.split("\n");
  const lineCount = lines.length;

  return (
    <View className="flex-1 bg-black">
      {/* Header bar */}
      <View className="flex-row items-center justify-between px-3 py-2 bg-vf-s1 border-b border-vf-b1">
        <View className="flex-row items-center flex-1 mr-2">
          <FileText size={13} color={C.cy} />
          <Text
            className="text-vf-cyan text-xs ml-1.5"
            style={{ fontFamily: "monospace" }}
            numberOfLines={1}
          >
            {getFilename(filePath)}
          </Text>
          <Text
            className="text-vf-dim text-xs ml-2"
            style={{ fontFamily: "monospace" }}
          >
            {getLanguage(filePath)}
          </Text>
          {hasChanges ? (
            <View className="ml-2 w-2 h-2 rounded-full bg-vf-warn" />
          ) : null}
        </View>

        <View className="flex-row items-center" style={{ gap: 4 }}>
          {/* Undo */}
          {hasChanges && !readOnly ? (
            <Pressable
              onPress={handleUndo}
              className="w-7 h-7 items-center justify-center rounded-md bg-vf-s2"
              hitSlop={4}
            >
              <Undo2 size={13} color={C.mid} />
            </Pressable>
          ) : null}

          {/* Copy */}
          <Pressable
            onPress={handleCopy}
            className="w-7 h-7 items-center justify-center rounded-md bg-vf-s2"
            hitSlop={4}
          >
            {copied ? (
              <Check size={13} color={C.green} />
            ) : (
              <Copy size={13} color={C.mid} />
            )}
          </Pressable>

          {/* Save */}
          {!readOnly ? (
            <Pressable
              onPress={handleSave}
              disabled={!hasChanges || isSaving}
              className={cn(
                "w-7 h-7 items-center justify-center rounded-md",
                hasChanges ? "bg-vf-cyan" : "bg-vf-s2"
              )}
              hitSlop={4}
            >
              <Save size={13} color={hasChanges ? "#000" : C.dim} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Editor area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="always"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            <View className="flex-row p-2" style={{ minWidth: "100%" }}>
              {/* Line numbers gutter */}
              <View className="mr-2 items-end" style={{ minWidth: 32 }}>
                {lines.map((_line, i) => (
                  <Text
                    key={i}
                    className="text-vf-dim"
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      lineHeight: 20,
                    }}
                  >
                    {i + 1}
                  </Text>
                ))}
              </View>

              {/* Separator */}
              <View
                className="bg-vf-b1 mr-2"
                style={{ width: 1 }}
              />

              {/* Code input */}
              <TextInput
                ref={inputRef}
                value={editedContent}
                onChangeText={readOnly ? undefined : setEditedContent}
                editable={!readOnly}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                scrollEnabled={false}
                textAlignVertical="top"
                className="flex-1 text-vf-text"
                style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  lineHeight: 20,
                  minWidth: 300,
                  padding: 0,
                }}
                placeholderTextColor={C.dim}
              />
            </View>
          </ScrollView>
        </ScrollView>

        {/* Bottom status bar */}
        <View className="flex-row items-center justify-between px-3 py-1.5 bg-vf-s1 border-t border-vf-b1">
          <Text
            className="text-vf-dim text-xs"
            style={{ fontFamily: "monospace" }}
          >
            {lineCount} lines
          </Text>
          <Text
            className="text-vf-dim text-xs"
            style={{ fontFamily: "monospace" }}
          >
            {isSaving ? "Saving..." : hasChanges ? "Modified" : "Saved"}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
