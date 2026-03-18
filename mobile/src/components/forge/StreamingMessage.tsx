/**
 * StreamingMessage — renders streaming VCE text with a role badge and blinking cursor.
 */
import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const ROLE_COLORS: Record<string, string> = {
  BUILDER: "#95CBDE",
  ARCHITECT: "#FFB74D",
  CRITIC: "#A75FBB",
  REASONER: "#C3A6FF",
  VISIONARY: "#88EECC",
};

const COLORS = {
  surfaceHigh: "#12141A",
  dimmer: "#2D3748",
  text: "#E8EDF2",
  dim: "#4A5568",
};

interface StreamingMessageProps {
  role: string;
  text: string;
  isStreaming: boolean;
}

export function StreamingMessage({ role, text, isStreaming }: StreamingMessageProps) {
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    if (isStreaming) {
      cursorOpacity.value = withRepeat(
        withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      cursorOpacity.value = 0;
    }
  }, [isStreaming, cursorOpacity]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const roleColor = ROLE_COLORS[role] ?? COLORS.dim;

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 6,
        alignItems: "flex-start",
      }}
    >
      <View
        style={{
          maxWidth: "85%",
          backgroundColor: COLORS.surfaceHigh,
          borderRadius: 12,
          borderTopLeftRadius: 4,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: COLORS.dimmer,
        }}
      >
        {/* Role badge */}
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: roleColor + "20",
            borderRadius: 4,
            paddingHorizontal: 6,
            paddingVertical: 2,
            marginBottom: 6,
            borderWidth: 1,
            borderColor: roleColor + "40",
          }}
        >
          <Text
            style={{
              color: roleColor,
              fontSize: 9,
              fontFamily: "monospace",
              fontWeight: "700",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {role}
          </Text>
        </View>

        {/* Streaming text + cursor */}
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <Text
            style={{
              color: COLORS.text,
              fontSize: 13,
              fontFamily: "monospace",
              lineHeight: 19,
            }}
          >
            {text}
          </Text>
          {isStreaming ? (
            <Animated.View
              style={[
                {
                  width: 7,
                  height: 15,
                  backgroundColor: roleColor,
                  borderRadius: 1,
                  marginLeft: 1,
                  alignSelf: "flex-end",
                  marginBottom: 2,
                },
                cursorStyle,
              ]}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}
