import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastStore } from "@/lib/state/toast-store";

export function Toast() {
  const message = useToastStore((s) => s.message);
  const visible = useToastStore((s) => s.visible);
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 250 });
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(100, { duration: 250 });
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!message) return null;

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          bottom: insets.bottom + 16,
          left: 16,
          right: 16,
          zIndex: 9999,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <View
        className="bg-vf-s1 border border-vf-green rounded-lg px-4 py-3"
      >
        <Text
          className="text-vf-green text-sm text-center"
          style={{ fontFamily: "monospace" }}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
