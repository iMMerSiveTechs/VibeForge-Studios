import React from "react";
import { View, Text } from "react-native";

interface TagProps {
  label: string;
  color?: string;
}

export function Tag({ label, color = "#00FFFF" }: TagProps) {
  return (
    <View
      style={{
        borderColor: color,
        borderWidth: 1,
        backgroundColor: color + "15",
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          fontFamily: "monospace",
          fontSize: 10,
          color: color,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
