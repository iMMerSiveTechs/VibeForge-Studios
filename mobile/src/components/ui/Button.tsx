import React from "react";
import { Pressable, Text, View, ActivityIndicator } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: React.ReactNode;
  small?: boolean;
  loading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-vf-green",
  secondary: "bg-vf-cyan",
  accent: "bg-vf-magenta",
  ghost: "bg-transparent border border-vf-b2",
  danger: "bg-vf-red",
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: "text-black",
  secondary: "text-black",
  accent: "text-black",
  ghost: "text-vf-text",
  danger: "text-white",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  icon,
  small = false,
  loading = false,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={animatedStyle}
      className={cn(
        "flex-row items-center justify-center rounded-lg",
        small ? "px-3 py-1.5" : "px-5 py-3",
        variantClasses[variant],
        disabled && "opacity-40"
      )}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "ghost" ? "#F0F0F0" : "#000000"}
        />
      ) : (
        <View className="flex-row items-center space-x-2">
          {icon ? <View className="mr-2">{icon}</View> : null}
          <Text
            className={cn(
              "font-semibold",
              small ? "text-xs" : "text-sm",
              variantTextClasses[variant]
            )}
            style={{ fontFamily: "monospace" }}
          >
            {label}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}
