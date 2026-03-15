import React from "react";
import { Pressable, Text } from "react-native";
import { C } from "@/theme/colors";

export function SectionButton({
  icon: Icon,
  label,
  active,
  onPress,
}: {
  icon: any;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: active ? C.s2 : "transparent",
        borderWidth: 1,
        borderColor: active ? C.cy : C.b1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Icon size={16} color={active ? C.cy : C.dim} />
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: active ? C.cy : C.dim,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
