/**
 * DecipherKit Correction Sheet Component
 * Bottom sheet for correcting transcription text
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import BottomSheet, {
  BottomSheetScrollView,
  useBottomSheetInternal,
} from "@gorhom/bottom-sheet";
import { CheckCircle, X, Edit2, Flag } from "lucide-react-native";
import { C } from "@/theme/colors";
import { Surface, CorrectionEntry, ConfidenceLevel } from "./types";
import { useGlyphMapStore } from "./glyph-map-store";
import { useToastStore } from "@/lib/state/toast-store";

interface CorrectionSheetProps {
  surface: Surface | null;
  isVisible: boolean;
  onClose: () => void;
  onSave?: (correction: CorrectionEntry) => void;
}

export function CorrectionSheet({
  surface,
  isVisible,
  onClose,
  onSave,
}: CorrectionSheetProps) {
  const [correctedText, setCorrectedText] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const { addCorrection } = useGlyphMapStore();
  const showToast = useToastStore((s) => s.show);

  // Sync correctedText with surface when it changes
  React.useEffect(() => {
    if (surface) {
      setCorrectedText(surface.transcribedText);
    }
  }, [surface?.id, surface?.transcribedText]);

  const snapPoints = useMemo(() => [0.5, 0.9], []);

  const handleAccept = async () => {
    if (!surface) return;

    setIsSaving(true);
    try {
      const correction: CorrectionEntry = {
        id: `corr_${Date.now()}`,
        originalText: surface.transcribedText,
        correctedText: correctedText.trim() || surface.transcribedText,
        glyphIds: surface.tokens?.map((t) => t.glyphIds).flat() || [],
        timestamp: new Date(),
        confidence: surface.confidence,
        surfaceId: surface.id,
      };

      addCorrection(correction);
      onSave?.(correction);
      showToast("Correction saved to glyph map");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleFlag = () => {
    if (!surface) return;

    const correction: CorrectionEntry = {
      id: `corr_${Date.now()}`,
      originalText: surface.transcribedText,
      correctedText: "[FLAGGED FOR REVIEW]",
      glyphIds: surface.tokens?.map((t) => t.glyphIds).flat() || [],
      timestamp: new Date(),
      confidence: ConfidenceLevel.FLAG,
      surfaceId: surface.id,
    };

    addCorrection(correction);
    onSave?.(correction);
    showToast("Surface flagged for review");
    onClose();
  };

  if (!surface || !isVisible) {
    return null;
  }

  return (
    <BottomSheet
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
      enableDynamicSizing={false}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 32,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: C.cy + "20",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Edit2 size={16} color={C.cy} />
              </View>
              <Text
                style={{
                  color: C.text,
                  fontSize: 16,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  letterSpacing: 2,
                }}
              >
                CORRECT
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <X size={18} color={C.dim} />
            </Pressable>
          </View>

          {/* Original text */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                color: C.dim,
                fontSize: 10,
                fontFamily: "monospace",
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              ORIGINAL
            </Text>
            <View
              style={{
                backgroundColor: C.bg,
                borderWidth: 1,
                borderColor: C.b2,
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text
                style={{
                  color: C.mid,
                  fontSize: 11,
                  fontFamily: "monospace",
                  lineHeight: 18,
                }}
              >
                {surface.transcribedText}
              </Text>
            </View>
          </View>

          {/* Corrected text input */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                color: C.dim,
                fontSize: 10,
                fontFamily: "monospace",
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              CORRECTION
            </Text>
            <TextInput
              value={correctedText}
              onChangeText={setCorrectedText}
              multiline
              numberOfLines={4}
              placeholder="Type your correction here..."
              placeholderTextColor={C.dim}
              style={{
                backgroundColor: C.bg,
                borderWidth: 1,
                borderColor: C.cy + "50",
                borderRadius: 8,
                padding: 12,
                color: C.text,
                fontFamily: "monospace",
                fontSize: 11,
                lineHeight: 18,
                textAlignVertical: "top",
              }}
            />
          </View>

          {/* Metadata */}
          <View
            style={{
              backgroundColor: C.s1,
              borderWidth: 1,
              borderColor: C.b1,
              borderRadius: 8,
              padding: 10,
              marginBottom: 16,
              gap: 6,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  color: C.dim,
                  fontSize: 9,
                  fontFamily: "monospace",
                }}
              >
                Confidence:
              </Text>
              <Text
                style={{
                  color: C.cy,
                  fontSize: 9,
                  fontFamily: "monospace",
                  fontWeight: "600",
                }}
              >
                {surface.confidence.toUpperCase()}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  color: C.dim,
                  fontSize: 9,
                  fontFamily: "monospace",
                }}
              >
                Tokens:
              </Text>
              <Text
                style={{
                  color: C.cy,
                  fontSize: 9,
                  fontFamily: "monospace",
                  fontWeight: "600",
                }}
              >
                {surface.tokens?.length || 0}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  color: C.dim,
                  fontSize: 9,
                  fontFamily: "monospace",
                }}
              >
                Issues:
              </Text>
              <Text
                style={{
                  color: C.warn,
                  fontSize: 9,
                  fontFamily: "monospace",
                  fontWeight: "600",
                }}
              >
                {(surface.problemZones?.length || 0) + (surface.failureModes?.length || 0)}
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={{ gap: 8 }}>
            {/* Accept button */}
            <Pressable
              onPress={handleAccept}
              disabled={isSaving || correctedText === surface.transcribedText}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 13,
                borderRadius: 8,
                backgroundColor: pressed
                  ? C.cy + "30"
                  : correctedText === surface.transcribedText
                  ? C.b2
                  : C.cy + "20",
                borderWidth: 1,
                borderColor: C.cy + "50",
                gap: 8,
                opacity:
                  isSaving || correctedText === surface.transcribedText
                    ? 0.6
                    : 1,
              })}
            >
              <CheckCircle
                size={16}
                color={
                  correctedText === surface.transcribedText ? C.dim : C.cy
                }
              />
              <Text
                style={{
                  color:
                    correctedText === surface.transcribedText ? C.dim : C.cy,
                  fontSize: 13,
                  fontFamily: "monospace",
                  fontWeight: "700",
                  letterSpacing: 1,
                }}
              >
                SAVE CORRECTION
              </Text>
            </Pressable>

            {/* Flag button */}
            <Pressable
              onPress={handleFlag}
              disabled={isSaving}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 13,
                borderRadius: 8,
                backgroundColor: pressed ? C.warn + "25" : C.warn + "15",
                borderWidth: 1,
                borderColor: C.warn + "50",
                gap: 8,
                opacity: isSaving ? 0.6 : 1,
              })}
            >
              <Flag size={16} color={C.warn} />
              <Text
                style={{
                  color: C.warn,
                  fontSize: 13,
                  fontFamily: "monospace",
                  fontWeight: "700",
                  letterSpacing: 1,
                }}
              >
                FLAG FOR REVIEW
              </Text>
            </Pressable>

            {/* Cancel button */}
            <Pressable
              onPress={onClose}
              disabled={isSaving}
              style={({ pressed }) => ({
                paddingVertical: 11,
                borderRadius: 8,
                backgroundColor: pressed ? C.b2 : "transparent",
                borderWidth: 1,
                borderColor: C.b1,
                opacity: isSaving ? 0.6 : 1,
              })}
            >
              <Text
                style={{
                  color: C.dim,
                  fontSize: 13,
                  fontFamily: "monospace",
                  fontWeight: "600",
                  letterSpacing: 1,
                  textAlign: "center",
                }}
              >
                DISMISS
              </Text>
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}
