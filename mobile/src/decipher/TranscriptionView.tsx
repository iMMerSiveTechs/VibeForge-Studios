/**
 * DecipherKit Transcription View Component
 * Display transcription results with confidence badges and structural annotations
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image as RNImage,
} from "react-native";
import { AlertCircle, CheckCircle, AlertTriangle, Eye } from "lucide-react-native";
import { C } from "@/theme/colors";
import { Surface, ConfidenceLevel, StructuralNotation } from "./types";

const CONFIDENCE_COLORS = {
  [ConfidenceLevel.HIGH]: { bg: "#00C85330", text: "#00C853", label: "HIGH" },
  [ConfidenceLevel.MEDIUM]: {
    bg: "#FFD60A30",
    text: "#FFD60A",
    label: "MEDIUM",
  },
  [ConfidenceLevel.LOW]: { bg: "#FF3B3030", text: "#FF3B30", label: "LOW" },
  [ConfidenceLevel.FLAG]: {
    bg: "#A75FBB30",
    text: "#A75FBB",
    label: "FLAG",
  },
};

interface TranscriptionViewProps {
  surfaces: Surface[];
  onSurfaceTap?: (surface: Surface) => void;
}

function ConfidenceBadge({
  confidence,
}: {
  confidence: ConfidenceLevel;
}) {
  const colors = CONFIDENCE_COLORS[confidence];
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.text + "60",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
      }}
    >
      {confidence === ConfidenceLevel.HIGH ? (
        <CheckCircle size={12} color={colors.text} />
      ) : confidence === ConfidenceLevel.LOW ? (
        <AlertTriangle size={12} color={colors.text} />
      ) : confidence === ConfidenceLevel.FLAG ? (
        <AlertCircle size={12} color={colors.text} />
      ) : null}
      <Text
        style={{
          color: colors.text,
          fontSize: 9,
          fontFamily: "monospace",
          fontWeight: "bold",
          letterSpacing: 1,
        }}
      >
        {colors.label}
      </Text>
    </View>
  );
}

function StructuralNotationIcon({ notation }: { notation: StructuralNotation }) {
  const iconProps = {
    size: 14,
    color: notation.significance === "critical" ? C.red : C.warn,
  };

  switch (notation.type) {
    case "arrow":
      return <Text style={{ ...iconProps, color: C.warn }}>→</Text>;
    case "circle":
      return <Text style={{ ...iconProps }}>◯</Text>;
    case "underline":
      return <Text style={{ ...iconProps }}>_</Text>;
    case "bracket":
      return <Text style={{ ...iconProps }}>[ ]</Text>;
    case "box":
      return <Text style={{ ...iconProps }}>▢</Text>;
    default:
      return null;
  }
}

export function TranscriptionView({
  surfaces,
  onSurfaceTap,
}: TranscriptionViewProps) {
  const [expandedSurfaceId, setExpandedSurfaceId] = useState<string | null>(null);

  if (surfaces.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 40,
        }}
      >
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 14,
            backgroundColor: C.s1,
            borderWidth: 1,
            borderColor: C.b2,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <Eye size={28} color={C.dim} />
        </View>
        <Text
          style={{
            color: C.text,
            fontSize: 14,
            fontFamily: "monospace",
            fontWeight: "bold",
            letterSpacing: 1,
            marginBottom: 6,
            textAlign: "center",
          }}
        >
          NO TRANSCRIPTION YET
        </Text>
        <Text
          style={{
            color: C.dim,
            fontSize: 11,
            fontFamily: "monospace",
            textAlign: "center",
            lineHeight: 18,
          }}
        >
          Capture or select images to begin transcription
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      {surfaces.map((surface, surfaceIdx) => (
        <Pressable
          key={surface.id}
          onPress={() => {
            setExpandedSurfaceId(
              expandedSurfaceId === surface.id ? null : surface.id
            );
            onSurfaceTap?.(surface);
          }}
          style={({ pressed }) => ({
            backgroundColor: pressed ? C.s2 : C.s1,
            borderWidth: 1,
            borderColor:
              expandedSurfaceId === surface.id
                ? C.cy + "50"
                : C.b1,
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
          })}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: expandedSurfaceId === surface.id ? 12 : 0,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: C.text,
                  fontSize: 12,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                SURFACE {surfaceIdx + 1}
              </Text>
              <Text
                style={{
                  color: C.dim,
                  fontSize: 10,
                  fontFamily: "monospace",
                  marginBottom: 6,
                }}
              >
                {surface.metadata.imageSize.width}×{surface.metadata.imageSize.height}px
                {" • "}
                {surface.tokens?.length || 0} token
                {surface.tokens?.length !== 1 ? "s" : ""}
              </Text>

              {/* Preview of text */}
              {!expandedSurfaceId || expandedSurfaceId === surface.id ? (
                <Text
                  style={{
                    color: C.text,
                    fontSize: 11,
                    fontFamily: "monospace",
                    lineHeight: 18,
                    marginBottom: expandedSurfaceId === surface.id ? 0 : 6,
                  }}
                  numberOfLines={expandedSurfaceId === surface.id ? 0 : 2}
                >
                  {surface.transcribedText}
                </Text>
              ) : null}
            </View>

            <ConfidenceBadge confidence={surface.confidence} />
          </View>

          {/* Expanded content */}
          {expandedSurfaceId === surface.id && (
            <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: C.b1, paddingTop: 12 }}>
              {/* Full text */}
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    color: C.dim,
                    fontSize: 10,
                    fontFamily: "monospace",
                    letterSpacing: 1,
                    marginBottom: 6,
                  }}
                >
                  FULL TEXT
                </Text>
                <Text
                  style={{
                    color: C.text,
                    fontSize: 11,
                    fontFamily: "monospace",
                    lineHeight: 20,
                    backgroundColor: C.bg,
                    padding: 8,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: C.b2,
                  }}
                >
                  {surface.transcribedText}
                </Text>
              </View>

              {/* Structural notations */}
              {surface.structuralNotations && surface.structuralNotations.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      color: C.dim,
                      fontSize: 10,
                      fontFamily: "monospace",
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    NOTATIONS ({surface.structuralNotations.length})
                  </Text>
                  <View style={{ gap: 6 }}>
                    {surface.structuralNotations.map((notation) => (
                      <View
                        key={notation.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: C.bg,
                          padding: 8,
                          borderRadius: 6,
                          borderLeftWidth: 3,
                          borderLeftColor:
                            notation.significance === "critical"
                              ? C.red
                              : C.warn,
                          gap: 8,
                        }}
                      >
                        <StructuralNotationIcon notation={notation} />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: C.text,
                              fontSize: 10,
                              fontFamily: "monospace",
                              fontWeight: "600",
                            }}
                          >
                            {notation.type.toUpperCase()}
                          </Text>
                          <Text
                            style={{
                              color: C.dim,
                              fontSize: 9,
                              fontFamily: "monospace",
                            }}
                          >
                            {notation.content}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Problem zones */}
              {surface.problemZones && surface.problemZones.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      color: C.dim,
                      fontSize: 10,
                      fontFamily: "monospace",
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    PROBLEM ZONES ({surface.problemZones.length})
                  </Text>
                  <View style={{ gap: 6 }}>
                    {surface.problemZones.map((zone) => (
                      <View
                        key={zone.id}
                        style={{
                          backgroundColor: C.red + "10",
                          padding: 8,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: C.red + "40",
                        }}
                      >
                        <Text
                          style={{
                            color: C.red,
                            fontSize: 10,
                            fontFamily: "monospace",
                            fontWeight: "600",
                            marginBottom: 2,
                          }}
                        >
                          {zone.reason}
                        </Text>
                        <Text
                          style={{
                            color: C.dim,
                            fontSize: 9,
                            fontFamily: "monospace",
                          }}
                        >
                          [{zone.boundingBox.x}, {zone.boundingBox.y}] - {zone.boundingBox.width}×{zone.boundingBox.height}px
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Tokens */}
              {surface.tokens && surface.tokens.length > 0 && (
                <View>
                  <Text
                    style={{
                      color: C.dim,
                      fontSize: 10,
                      fontFamily: "monospace",
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    TOKENS ({surface.tokens.length})
                  </Text>
                  <View style={{ gap: 4 }}>
                    {surface.tokens.map((token) => (
                      <View
                        key={token.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor: C.bg,
                          padding: 8,
                          borderRadius: 6,
                          gap: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: C.text,
                            fontSize: 10,
                            fontFamily: "monospace",
                            fontWeight: "600",
                            flex: 1,
                          }}
                        >
                          {token.text}
                        </Text>
                        <ConfidenceBadge confidence={token.confidence} />
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}
