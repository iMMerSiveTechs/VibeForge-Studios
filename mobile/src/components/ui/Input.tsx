import React from "react";
import { View, Text, TextInput } from "react-native";
import { cn } from "@/lib/cn";
import { C } from "@/theme/colors";

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  secureTextEntry?: boolean;
  showSavedIndicator?: boolean;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  rows = 4,
  secureTextEntry = false,
  showSavedIndicator = false,
}: InputProps) {
  const charCount = value?.length ?? 0;
  const hasSavedValue = showSavedIndicator && charCount > 0;

  return (
    <View className="space-y-1.5">
      {label ? (
        <Text
          className="text-vf-cyan text-xs uppercase tracking-widest mb-1.5"
          style={{ fontFamily: "monospace" }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.dim}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        className={cn(
          "bg-vf-s2 border border-vf-b1 rounded-lg px-3 py-2.5 text-vf-text text-sm"
        )}
        style={[
          { fontFamily: "monospace" },
          multiline ? { minHeight: rows * 24 } : undefined,
        ]}
      />
      {hasSavedValue ? (
        <Text
          className="text-xs mt-1"
          style={{ fontFamily: "monospace", color: C.green }}
        >
          ✓ Key saved ({charCount} chars)
        </Text>
      ) : null}
    </View>
  );
}
