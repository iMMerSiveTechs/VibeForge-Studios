/**
 * DecipherKit Main Screen Component
 * Complete interface for handwriting transcription and correction
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Share2, Download, RotateCcw } from "lucide-react-native";
import { C } from "@/theme/colors";
import { useToastStore } from "@/lib/state/toast-store";
import { CameraImage, CameraCapture } from "./CameraCapture";
import { TranscriptionView } from "./TranscriptionView";
import { CorrectionSheet } from "./CorrectionSheet";
import { useGlyphMapStore } from "./glyph-map-store";
import {
  transcribeImages,
  DEFAULT_DECIPHER_CONFIG,
} from "./decipher-engine";
import {
  TranscriptionResult,
  Surface,
  CorrectionEntry,
} from "./types";

export function DecipherScreen() {
  const [images, setImages] = useState<CameraImage[]>([]);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedSurface, setSelectedSurface] = useState<Surface | null>(null);
  const [correctionSheetVisible, setCorrectionSheetVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const showToast = useToastStore((s) => s.show);
  const { glyphMap, initializeGlyphMap, addCorrection, correctionStats } =
    useGlyphMapStore();

  // Initialize glyph map on mount
  useEffect(() => {
    initializeGlyphMap("demo-user");
  }, []);

  const handleImagesSelected = (selected: CameraImage[]) => {
    setImages(selected);
    // Reset result when new images are selected
    if (selected.length === 0) {
      setResult(null);
      setProgress(0);
    }
  };

  const handleTranscribe = async () => {
    if (images.length === 0) {
      showToast("Select at least one image");
      return;
    }

    setIsTranscribing(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 85));
      }, 300);

      const imageUris = images.map((img) => img.uri);
      const transcriptionResult = await transcribeImages(
        imageUris,
        glyphMap,
        DEFAULT_DECIPHER_CONFIG
      );

      clearInterval(progressInterval);
      setProgress(100);
      setResult(transcriptionResult);
      showToast(
        `Transcribed ${transcriptionResult.surfaces.length} surface(s)`
      );

      // Reset progress after brief delay
      setTimeout(() => setProgress(0), 500);
    } catch (error) {
      showToast(
        `Transcription failed: ${error instanceof Error ? error.message : String(error)}`
      );
      console.error("Transcription error:", error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCorrectionSave = (correction: CorrectionEntry) => {
    addCorrection(correction);
    // Update result with correction applied
    if (result) {
      const updatedSurfaces = result.surfaces.map((surface) =>
        surface.id === selectedSurface?.id
          ? {
              ...surface,
              transcribedText: correction.correctedText,
            }
          : surface
      );
      setResult({ ...result, surfaces: updatedSurfaces });
    }
  };

  const handleSurfaceTap = (surface: Surface) => {
    setSelectedSurface(surface);
    setCorrectionSheetVisible(true);
  };

  const handleExportResults = async () => {
    if (!result) {
      showToast("No results to export");
      return;
    }

    try {
      const exportData = {
        transcriptionId: result.id,
        timestamp: new Date().toISOString(),
        totalSurfaces: result.surfaces.length,
        surfaces: result.surfaces.map((s) => ({
          text: s.transcribedText,
          confidence: s.confidence,
          tokens: s.tokens?.map((t) => ({
            text: t.text,
            confidence: t.confidence,
          })),
        })),
        corrections: correctionStats.totalCorrections,
      };

      // In production, share to device clipboard or files
      const jsonString = JSON.stringify(exportData, null, 2);
      console.log("[Export] Results:", jsonString);
      showToast("Results copied (check logs)");
    } catch (error) {
      showToast("Failed to export results");
    }
  };

  const handleExportGlyphMap = async () => {
    if (!glyphMap) {
      showToast("No glyph map to export");
      return;
    }

    try {
      Alert.alert(
        "Export Glyph Map",
        "This will copy your glyph map JSON to logs. Share it safely.",
        [
          { text: "Cancel" },
          {
            text: "Export",
            onPress: async () => {
              const glyphMapStore = useGlyphMapStore.getState();
              const json = await glyphMapStore.exportGlyphMap();
              console.log("[GlyphMapExport]", json);
              showToast("Glyph map exported (check logs)");
            },
          },
        ]
      );
    } catch (error) {
      showToast("Failed to export glyph map");
    }
  };

  const handleReset = () => {
    Alert.alert("Reset Transcription", "Clear all results and images?", [
      { text: "Cancel" },
      {
        text: "Reset",
        onPress: () => {
          setImages([]);
          setResult(null);
          setSelectedSurface(null);
          setProgress(0);
          showToast("Reset complete");
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: C.b1,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: C.cy + "20",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 16 }}>📄</Text>
          </View>
          <View>
            <Text
              style={{
                color: C.text,
                fontSize: 18,
                fontFamily: "monospace",
                fontWeight: "bold",
                letterSpacing: 3,
              }}
            >
              DECIPHER
            </Text>
            <Text
              style={{
                color: C.dim,
                fontSize: 10,
                fontFamily: "monospace",
                letterSpacing: 1,
              }}
            >
              Handwriting Transcription
            </Text>
          </View>
        </View>
      </View>

      {/* Main content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        scrollEnabled={result ? true : false}
      >
        {/* Camera capture section */}
        {images.length > 0 || !result ? (
          <CameraCapture
            onImagesSelected={handleImagesSelected}
            maxImages={4}
            disabled={isTranscribing}
          />
        ) : null}

        {/* Progress bar */}
        {isTranscribing && progress > 0 && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: C.s1,
              borderBottomWidth: 1,
              borderBottomColor: C.b1,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  color: C.cy,
                  fontSize: 11,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              >
                TRANSCRIBING...
              </Text>
              <Text
                style={{
                  color: C.dim,
                  fontSize: 10,
                  fontFamily: "monospace",
                }}
              >
                {progress}%
              </Text>
            </View>
            <View
              style={{
                height: 3,
                backgroundColor: C.b2,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  backgroundColor: C.cy,
                  borderRadius: 2,
                }}
              />
            </View>
          </View>
        )}

        {/* Transcription results */}
        {result && !isTranscribing ? (
          <View style={{ flex: 1 }}>
            <TranscriptionView
              surfaces={result.surfaces}
              onSurfaceTap={handleSurfaceTap}
            />
          </View>
        ) : isTranscribing ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator size="large" color={C.cy} />
            <Text
              style={{
                color: C.dim,
                fontSize: 12,
                fontFamily: "monospace",
                marginTop: 12,
              }}
            >
              Processing images...
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom action bar */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: C.b1,
          backgroundColor: C.s1,
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 8,
        }}
      >
        {/* Stats row */}
        {result && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: C.b1,
            }}
          >
            <View style={{ alignItems: "center", gap: 2 }}>
              <Text
                style={{
                  color: C.cy,
                  fontSize: 12,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              >
                {result.surfaces.length}
              </Text>
              <Text
                style={{
                  color: C.dim,
                  fontSize: 9,
                  fontFamily: "monospace",
                }}
              >
                SURFACES
              </Text>
            </View>

            <View style={{ alignItems: "center", gap: 2 }}>
              <Text
                style={{
                  color: C.cy,
                  fontSize: 12,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              >
                {result.metadata.totalTokens}
              </Text>
              <Text
                style={{
                  color: C.dim,
                  fontSize: 9,
                  fontFamily: "monospace",
                }}
              >
                TOKENS
              </Text>
            </View>

            <View style={{ alignItems: "center", gap: 2 }}>
              <Text
                style={{
                  color: C.cy,
                  fontSize: 12,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              >
                {correctionStats.totalCorrections}
              </Text>
              <Text
                style={{
                  color: C.dim,
                  fontSize: 9,
                  fontFamily: "monospace",
                }}
              >
                CORRECTIONS
              </Text>
            </View>

            <View style={{ alignItems: "center", gap: 2 }}>
              <Text
                style={{
                  color: C.cy,
                  fontSize: 12,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              >
                {result.metadata.elapsedMs}ms
              </Text>
              <Text
                style={{
                  color: C.dim,
                  fontSize: 9,
                  fontFamily: "monospace",
                }}
              >
                TIME
              </Text>
            </View>
          </View>
        )}

        {/* Primary action buttons */}
        {images.length > 0 && !result ? (
          <Pressable
            onPress={handleTranscribe}
            disabled={isTranscribing}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 13,
              borderRadius: 8,
              backgroundColor: pressed ? C.cy + "30" : C.cy + "20",
              borderWidth: 1,
              borderColor: C.cy + "60",
              gap: 8,
              opacity: isTranscribing ? 0.6 : 1,
            })}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color={C.cy} />
            ) : (
              <Text style={{ fontSize: 14 }}>✨</Text>
            )}
            <Text
              style={{
                color: C.cy,
                fontSize: 13,
                fontFamily: "monospace",
                fontWeight: "700",
                letterSpacing: 2,
              }}
            >
              TRANSCRIBE
            </Text>
          </Pressable>
        ) : result ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={handleExportResults}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 11,
                borderRadius: 8,
                backgroundColor: pressed ? C.cy + "25" : C.cy + "15",
                borderWidth: 1,
                borderColor: C.cy + "50",
                gap: 6,
              })}
            >
              <Download size={14} color={C.cy} />
              <Text
                style={{
                  color: C.cy,
                  fontSize: 11,
                  fontFamily: "monospace",
                  fontWeight: "600",
                  letterSpacing: 1,
                }}
              >
                EXPORT
              </Text>
            </Pressable>

            <Pressable
              onPress={handleExportGlyphMap}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 11,
                borderRadius: 8,
                backgroundColor: pressed ? C.warn + "25" : C.warn + "15",
                borderWidth: 1,
                borderColor: C.warn + "50",
                gap: 6,
              })}
            >
              <Share2 size={14} color={C.warn} />
              <Text
                style={{
                  color: C.warn,
                  fontSize: 11,
                  fontFamily: "monospace",
                  fontWeight: "600",
                  letterSpacing: 1,
                }}
              >
                SHARE MAP
              </Text>
            </Pressable>

            <Pressable
              onPress={handleReset}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 11,
                borderRadius: 8,
                backgroundColor: pressed ? C.red + "25" : C.red + "15",
                borderWidth: 1,
                borderColor: C.red + "50",
                gap: 6,
              })}
            >
              <RotateCcw size={14} color={C.red} />
              <Text
                style={{
                  color: C.red,
                  fontSize: 11,
                  fontFamily: "monospace",
                  fontWeight: "600",
                  letterSpacing: 1,
                }}
              >
                RESET
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* Correction sheet */}
      <CorrectionSheet
        surface={selectedSurface}
        isVisible={correctionSheetVisible}
        onClose={() => setCorrectionSheetVisible(false)}
        onSave={handleCorrectionSave}
      />
    </SafeAreaView>
  );
}
