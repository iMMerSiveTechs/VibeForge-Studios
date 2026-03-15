import React from "react";
import { Pressable, View } from "react-native";
import { cn } from "@/lib/cn";

interface BoxProps {
  children: React.ReactNode;
  accentColor?: string;
  onPress?: () => void;
  className?: string;
}

export function Box({ children, accentColor, onPress, className }: BoxProps) {
  const content = (
    <View
      className={cn(
        "rounded-xl bg-vf-s1 border border-vf-b1 p-4 overflow-hidden",
        className
      )}
      style={
        accentColor
          ? { borderLeftWidth: 3, borderLeftColor: accentColor }
          : undefined
      }
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-80">
        {content}
      </Pressable>
    );
  }

  return content;
}
