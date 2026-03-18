import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { C } from "@/theme/colors";
import { tokenize, TOKEN_COLORS } from "@/lib/syntax-highlight";
import { EditorToolbar } from "./EditorToolbar";

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

interface HighlightedLineProps {
  lineText: string;
  language: string;
}

const HighlightedLine = React.memo(function HighlightedLine({
  lineText,
  language,
}: HighlightedLineProps) {
  const tokens = useMemo(() => tokenize(lineText, language), [lineText, language]);

  return (
    <Text style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 20 }}>
      {tokens.map((token, i) => (
        <Text key={i} style={{ color: TOKEN_COLORS[token.type] }}>
          {token.text}
        </Text>
      ))}
      {"\n"}
    </Text>
  );
});

export function CodeEditor({
  filePath,
  content,
  onSave,
  isSaving = false,
  readOnly = false,
}: CodeEditorProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const hasChanges = editedContent !== content;
  const language = getLanguage(filePath);
  const filename = getFilename(filePath);

  // Reset when file changes
  useEffect(() => {
    setEditedContent(content);
    setIsEditing(false);
  }, [content, filePath]);

  const handleSave = useCallback(() => {
    onSave(editedContent);
  }, [onSave, editedContent]);

  const handleToggleEdit = useCallback(() => {
    if (readOnly) return;
    setIsEditing((prev) => !prev);
  }, [readOnly]);

  const lines = useMemo(() => editedContent.split("\n"), [editedContent]);
  const lineCount = lines.length;

  // Gutter width adapts to line count
  const gutterWidth = Math.max(32, String(lineCount).length * 10 + 12);

  return (
    <View className="flex-1 bg-black">
      {/* Toolbar */}
      <EditorToolbar
        filename={filename}
        isEditing={isEditing}
        onToggleEdit={handleToggleEdit}
        onSave={handleSave}
        hasChanges={hasChanges}
      />

      {/* Editor area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {isEditing && !readOnly ? (
          /* Edit mode: plain TextInput */
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="always"
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
            >
              <View className="flex-row p-2" style={{ minWidth: "100%" }}>
                {/* Line numbers gutter */}
                <View className="items-end mr-2" style={{ width: gutterWidth }}>
                  {lines.map((_line, i) => (
                    <Text
                      key={i}
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        lineHeight: 20,
                        color: C.dim,
                        textAlign: "right",
                      }}
                    >
                      {i + 1}
                    </Text>
                  ))}
                </View>

                {/* Separator */}
                <View className="bg-vf-b1 mr-2" style={{ width: 1 }} />

                {/* Code input */}
                <TextInput
                  ref={inputRef}
                  value={editedContent}
                  onChangeText={setEditedContent}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  scrollEnabled={false}
                  textAlignVertical="top"
                  autoFocus
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
        ) : (
          /* Read mode: syntax highlighted */
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <View className="flex-row p-2" style={{ minWidth: "100%" }}>
                {/* Line numbers gutter */}
                <View className="items-end mr-2" style={{ width: gutterWidth }}>
                  {lines.map((_line, i) => (
                    <Text
                      key={i}
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        lineHeight: 20,
                        color: C.dim,
                        textAlign: "right",
                      }}
                    >
                      {i + 1}
                    </Text>
                  ))}
                </View>

                {/* Separator */}
                <View className="bg-vf-b1 mr-2" style={{ width: 1 }} />

                {/* Highlighted code */}
                <View style={{ minWidth: 300 }}>
                  {lines.map((line, i) => (
                    <HighlightedLine
                      key={i}
                      lineText={line}
                      language={language}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>
          </ScrollView>
        )}

        {/* Bottom status bar */}
        <View className="flex-row items-center justify-between px-3 py-1.5 bg-vf-s1 border-t border-vf-b1">
          <Text
            className="text-vf-dim text-xs"
            style={{ fontFamily: "monospace" }}
          >
            {lineCount} lines · {language}
          </Text>
          <Text
            className="text-vf-dim text-xs"
            style={{ fontFamily: "monospace" }}
          >
            {isSaving
              ? "Saving..."
              : hasChanges
                ? "Modified"
                : isEditing
                  ? "Editing"
                  : "Saved"}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
