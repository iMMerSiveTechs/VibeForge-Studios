/**
 * PhaseIndicator — horizontal bar showing VCE pipeline progress.
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
import type { EnginePhase } from "@/engine/types";

const PHASES: EnginePhase[] = ["routing", "thinking", "streaming", "fusing", "done"];

const COLORS = {
  cyan: "#95CBDE",
  dim: "#4A5568",
  dimmer: "#2D3748",
  text: "#E8EDF2",
};

interface PhaseIndicatorProps {
  phase: EnginePhase;
  activeRole?: string;
}

function PhaseDot({ isActive, isCompleted }: { isActive: boolean; isCompleted: boolean }) {
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      pulseOpacity.value = withRepeat(
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [isActive, pulseOpacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: isActive ? pulseOpacity.value : 1,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: isCompleted || isActive ? COLORS.cyan : COLORS.dimmer,
        },
        animStyle,
      ]}
    />
  );
}

export function PhaseIndicator({ phase, activeRole }: PhaseIndicatorProps) {
  if (phase === "idle" || phase === "error" || phase === "interrupted") {
    return null;
  }

  const currentIdx = PHASES.indexOf(phase);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 6,
        height: 28,
        gap: 4,
      }}
    >
      {PHASES.map((p, i) => {
        const isCompleted = currentIdx > i;
        const isActive = currentIdx === i;
        return (
          <React.Fragment key={p}>
            <PhaseDot isActive={isActive} isCompleted={isCompleted} />
            {i < PHASES.length - 1 ? (
              <View
                style={{
                  width: 12,
                  height: 1,
                  backgroundColor: isCompleted ? COLORS.cyan + "60" : COLORS.dimmer,
                }}
              />
            ) : null}
          </React.Fragment>
        );
      })}

      {/* Phase label */}
      <Text
        style={{
          color: COLORS.dim,
          fontSize: 9,
          fontFamily: "monospace",
          marginLeft: 8,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {phase}
        {activeRole && phase === "streaming" ? ` [${activeRole}]` : null}
      </Text>
    </View>
  );
}
