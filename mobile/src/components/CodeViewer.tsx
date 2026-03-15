import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Copy, Check } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { C } from "@/theme/colors";

interface CodeViewerProps {
  code: string;
  filename?: string;
  language?: string;
}

export function CodeViewer({ code, filename, language }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="rounded-xl border border-vf-b1 overflow-hidden bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 py-2 bg-vf-s1 border-b border-vf-b1">
        <View className="flex-row items-center space-x-2">
          {filename ? (
            <Text
              className="text-vf-cyan text-xs"
              style={{ fontFamily: "monospace" }}
            >
              {filename}
            </Text>
          ) : null}
          {language ? (
            <Text
              className="text-vf-dim text-xs ml-2"
              style={{ fontFamily: "monospace" }}
            >
              {language}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={handleCopy}
          className="w-7 h-7 items-center justify-center rounded-md bg-vf-s2"
          hitSlop={8}
        >
          {copied ? (
            <Check size={14} color={C.green} />
          ) : (
            <Copy size={14} color={C.mid} />
          )}
        </Pressable>
      </View>

      {/* Code area */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="p-3">
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
