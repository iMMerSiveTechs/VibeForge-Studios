import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  FileText,
  FileJson,
  FileCode2,
  Pencil,
  Check,
  Save,
  GitCompareArrows,
} from "lucide-react-native";
import { C } from "@/theme/colors";

interface EditorToolbarProps {
  filename: string;
  isEditing: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onViewDiff?: () => void;
  hasChanges?: boolean;
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "json":
      return FileJson;
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
      return FileCode2;
    default:
      return FileText;
  }
}

export function EditorToolbar({
  filename,
  isEditing,
  onToggleEdit,
  onSave,
  onViewDiff,
  hasChanges = false,
}: EditorToolbarProps) {
  const Icon = getFileIcon(filename);

  return (
    <View className="flex-row items-center justify-between px-3 py-2 bg-vf-s1 border-b border-vf-b1">
      {/* File info */}
      <View className="flex-row items-center flex-1 mr-2">
        <Icon size={13} color={C.cy} />
        <Text
          className="text-vf-cyan text-xs ml-1.5"
          style={{ fontFamily: "monospace" }}
          numberOfLines={1}
        >
          {filename}
        </Text>
        {hasChanges ? (
          <View className="ml-2 w-2 h-2 rounded-full bg-vf-warn" />
        ) : null}
      </View>

      {/* Actions */}
      <View className="flex-row items-center" style={{ gap: 4 }}>
        {/* Diff button */}
        {onViewDiff && hasChanges ? (
          <Pressable
            onPress={onViewDiff}
            className="h-7 flex-row items-center justify-center rounded-md bg-vf-s2 px-2"
            hitSlop={4}
          >
            <GitCompareArrows size={13} color={C.mid} />
            <Text
              className="text-vf-mid text-xs ml-1"
              style={{ fontFamily: "monospace" }}
            >
              Diff
            </Text>
          </Pressable>
        ) : null}

        {/* Edit/Done toggle */}
        <Pressable
          onPress={onToggleEdit}
          className={`h-7 flex-row items-center justify-center rounded-md px-2 ${
            isEditing ? "bg-vf-cyan" : "bg-vf-s2"
          }`}
          hitSlop={4}
        >
          {isEditing ? (
            <>
              <Check size={13} color="#000" />
              <Text
                className="text-xs ml-1"
                style={{ fontFamily: "monospace", color: "#000" }}
              >
                Done
              </Text>
            </>
          ) : (
            <>
              <Pencil size={13} color={C.mid} />
              <Text
                className="text-vf-mid text-xs ml-1"
                style={{ fontFamily: "monospace" }}
              >
                Edit
              </Text>
            </>
          )}
        </Pressable>

        {/* Save */}
        <Pressable
          onPress={onSave}
          disabled={!hasChanges}
          className={`w-7 h-7 items-center justify-center rounded-md ${
            hasChanges ? "bg-vf-cyan" : "bg-vf-s2"
          }`}
          hitSlop={4}
        >
          <Save size={13} color={hasChanges ? "#000" : C.dim} />
        </Pressable>
      </View>
    </View>
  );
}
