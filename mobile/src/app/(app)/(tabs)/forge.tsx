/**
 * Forge Screen — Combined Build + Engine cockpit
 * All engine calls via EngineClient only. No provider URLs in UI.
 */
import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Zap, Square, ChevronDown, ChevronUp, Cpu, Brain, Activity } from "lucide-react-native";
import { engineClient } from "@/engine";
import type {
  EnginePhase,
  RouteDecision,
  EngineDelta,
  EngineFinal,
  EngineError,
  EngineCallbacks,
  EngineOptions,
} from "@/engine";
import { useEngineStore } from "@/lib/state/engine-store";
import { api } from "@/lib/api/api";
import { AIToolsModal } from "@/components/forge/AIToolsModal";
import { ActivityModal } from "@/components/forge/ActivityModal";

// ============ Theme ============
const COLORS = {
  bg: "#020203",
  surface: "#0B0C10",
  surfaceHigh: "#12141A",
  cyan: "#95CBDE",
  magenta: "#A75FBB",
  violet: "#413672",
  lilac: "#C3A6FF",
  amber: "#FFB74D",
  mint: "#88EECC",
  text: "#E8EDF2",
  dim: "#4A5568",
  dimmer: "#2D3748",
  error: "#FF6B6B",
  success: "#68D391",
  warn: "#FFB74D",
};

const ROLE_COLORS: Record<string, string> = {
  BUILDER: COLORS.cyan,
  ARCHITECT: COLORS.lilac,
  CRITIC: COLORS.amber,
  REASONER: COLORS.magenta,
  VISIONARY: COLORS.mint,
};

const PRESET_COLORS: Record<string, string> = {
  FAST: COLORS.success,
  SMART: COLORS.cyan,
  DEEP: COLORS.magenta,
};

// ============ Types ============
interface TerminalLine {
  id: string;
  role?: string;
  text: string;
  isFinal?: boolean;
  isError?: boolean;
  isSystem?: boolean;
}

interface Project {
  id: string;
  name: string;
}

interface ModelOption {
  provider: string;
  modelId: string;
  displayName: string;
  tier: string;
  recommended: boolean;
  hiddenByDefault: boolean;
}

// ============ Sub-components (outside render to avoid remount) ============
function PresetButton({
  value,
  preset,
  onPress,
}: {
  value: "FAST" | "SMART" | "DEEP";
  preset: string;
  onPress: (v: "FAST" | "SMART" | "DEEP") => void;
}) {
  const isSelected = preset === value;
  const color = PRESET_COLORS[value];
  return (
    <TouchableOpacity
      onPress={() => onPress(value)}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: isSelected ? color : COLORS.dimmer,
        backgroundColor: isSelected ? color + "22" : "transparent",
        marginRight: 6,
      }}
    >
      <Text style={{ color: isSelected ? color : COLORS.dim, fontSize: 11, fontFamily: "monospace", fontWeight: "700", letterSpacing: 0.8 }}>
        {value}
      </Text>
    </TouchableOpacity>
  );
}

function ModelChips({
  role,
  roleKey,
  roleModels,
  selected,
  onSelect,
}: {
  role: string;
  roleKey: string;
  roleModels: ModelOption[];
  selected: string | undefined;
  onSelect: (roleKey: string, modelId: string | null) => void;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: COLORS.dim, fontSize: 10, fontFamily: "monospace", marginBottom: 4, letterSpacing: 0.5 }}>
        {role.toUpperCase()} MODEL
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          onPress={() => onSelect(roleKey, null)}
          style={{
            paddingHorizontal: 9,
            paddingVertical: 4,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: !selected ? COLORS.cyan : COLORS.dimmer,
            backgroundColor: !selected ? COLORS.cyan + "18" : "transparent",
            marginRight: 5,
          }}
        >
          <Text style={{ color: !selected ? COLORS.cyan : COLORS.dim, fontSize: 10, fontFamily: "monospace" }}>Auto</Text>
        </TouchableOpacity>
        {roleModels.map((m) => (
          <TouchableOpacity
            key={m.modelId}
            onPress={() => onSelect(roleKey, m.modelId)}
            style={{
              paddingHorizontal: 9,
              paddingVertical: 4,
              borderRadius: 5,
              borderWidth: 1,
              borderColor: selected === m.modelId ? (ROLE_COLORS[role.toUpperCase()] ?? COLORS.cyan) : COLORS.dimmer,
              backgroundColor: selected === m.modelId ? (ROLE_COLORS[role.toUpperCase()] ?? COLORS.cyan) + "18" : "transparent",
              marginRight: 5,
            }}
          >
            <Text style={{ color: selected === m.modelId ? (ROLE_COLORS[role.toUpperCase()] ?? COLORS.cyan) : COLORS.dim, fontSize: 10, fontFamily: "monospace" }}>
              {m.displayName.replace("Claude ", "").replace("Gemini ", "")}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ============ Main Component ============
export default function ForgeScreen() {
  const [inputText, setInputText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [preset, setPreset] = useState<"FAST" | "SMART" | "DEEP">("SMART");
  const [overrides, setOverrides] = useState<{ builder?: string; critic?: string; reasoner?: string }>({});
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteDecision | null>(null);
  const [finalMetrics, setFinalMetrics] = useState<EngineFinal["metrics"] | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [clientMode, setClientMode] = useState<"mock" | "remote">("remote");
  const [showAITools, setShowAITools] = useState<boolean>(false);
  const [showActivity, setShowActivity] = useState<boolean>(false);

  const turnIdRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const lineIdCounter = useRef<number>(0);

  // Engine store (for external consumers)
  useEngineStore((s) => s.phase);

  // Load projects
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => api.get<Project[]>("/api/projects"),
  });

  // Load model catalog
  const { data: modelsData } = useQuery<{ models: ModelOption[]; presetDefaults: Record<string, unknown> }>({
    queryKey: ["models"],
    queryFn: () => api.get<{ models: ModelOption[]; presetDefaults: Record<string, unknown> }>("/api/models"),
  });

  const models = modelsData?.models ?? [];

  function getModelsForRole(): ModelOption[] {
    const tierForPreset: Record<string, string> = { FAST: "fast", SMART: "smart", DEEP: "max" };
    const tier = tierForPreset[preset] ?? "smart";
    return [...models].sort((a, b) => {
      const aMatch = a.tier === tier ? 0 : 1;
      const bMatch = b.tier === tier ? 0 : 1;
      const aRec = a.recommended ? 0 : 1;
      const bRec = b.recommended ? 0 : 1;
      return aMatch - bMatch || aRec - bRec;
    });
  }

  const addLine = useCallback((line: Omit<TerminalLine, "id">) => {
    setLines((prev) => [...prev, { ...line, id: `l${++lineIdCounter.current}` }]);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: false }));
  }, []);

  const appendToDelta = useCallback((role: string, delta: string) => {
    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && !last.isFinal && !last.isError) {
        return [...prev.slice(0, -1), { ...last, text: last.text + delta }];
      }
      return [...prev, { id: `l${++lineIdCounter.current}`, role, text: delta }];
    });
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: false }));
  }, []);

  const handleToggleMode = () => {
    const next = clientMode === "mock" ? "remote" : "mock";
    setClientMode(next);
    engineClient.setMode(next);
  };

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;

    // Interrupt any running stream first
    if (isStreaming && turnIdRef.current) {
      await engineClient.interrupt(turnIdRef.current);
    }

    setInputText("");
    setIsStreaming(true);
    setRouteInfo(null);
    setFinalMetrics(null);
    setLines([]);
    setHistory((h) => [text, ...h.slice(0, 9)]);

    addLine({ isSystem: true, text: `> ${text}` });

    const options: EngineOptions = {
      preset,
      ...(Object.keys(overrides).length > 0 ? { overrides } : {}),
    };

    const callbacks: EngineCallbacks = {
      onRoute: (decision: RouteDecision) => {
        setRouteInfo(decision);
        turnIdRef.current = decision.turnId;
        addLine({
          isSystem: true,
          text: `// Route: ${decision.mode.toUpperCase()} · ${decision.intent} · [${decision.roles.join(", ")}]`,
        });
      },
      onPhase: (p: EnginePhase, _activeRole?: string) => {
        if (p === "fusing") {
          addLine({ isSystem: true, text: "// Fusing outputs..." });
        } else if (p === "interrupted") {
          addLine({ isSystem: true, text: "// Interrupted." });
          setIsStreaming(false);
        } else if (p === "done") {
          setIsStreaming(false);
        }
      },
      onDelta: (delta: EngineDelta) => {
        appendToDelta(delta.role, delta.delta);
      },
      onFinal: (result: EngineFinal) => {
        setFinalMetrics(result.metrics);
        addLine({
          isSystem: true,
          isFinal: true,
          text: `// Done · $${result.metrics.estimatedCostUSD.toFixed(4)} · ${result.metrics.durationMs}ms · AI-generated output — verify before use.`,
        });
        setIsStreaming(false);
      },
      onError: (error: EngineError) => {
        addLine({ isError: true, text: `// Error: ${error.message}` });
        setIsStreaming(false);
      },
    };

    await engineClient.generate(text, callbacks, options);
  }, [inputText, isStreaming, preset, overrides, addLine, appendToDelta]);

  const handleStop = useCallback(async () => {
    if (turnIdRef.current) {
      await engineClient.interrupt(turnIdRef.current);
    }
    setIsStreaming(false);
  }, []);

  const handleModelSelect = useCallback((roleKey: string, modelId: string | null) => {
    setOverrides((o) => {
      if (modelId === null) {
        const n = { ...o };
        delete n[roleKey as keyof typeof o];
        return n;
      }
      return { ...o, [roleKey]: modelId };
    });
  }, []);

  const sortedModels = getModelsForRole();

  const selectedProject = projects?.find((p) => p.id === selectedProjectId) ?? projects?.[0] ?? null;

  // Cost display
  const costStr = finalMetrics ? `$${finalMetrics.estimatedCostUSD.toFixed(4)}` : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top"]}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* HEADER */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.violet + "50",
          backgroundColor: COLORS.surface,
        }}
      >
        {/* Title */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Zap size={14} color={COLORS.cyan} />
          <Text style={{ color: COLORS.cyan, fontSize: 14, fontFamily: "monospace", fontWeight: "800", letterSpacing: 2 }}>
            FORGE
          </Text>
        </View>

        {/* Project chip strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1, marginHorizontal: 12, flexGrow: 0, maxWidth: 200 }}
          contentContainerStyle={{ gap: 6 }}
        >
          {(projects ?? []).map((p) => {
            const isSelected = selectedProjectId ? selectedProjectId === p.id : selectedProject?.id === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedProjectId(p.id)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: isSelected ? COLORS.violet : COLORS.dimmer,
                  backgroundColor: isSelected ? COLORS.violet + "30" : "transparent",
                }}
              >
                <Text style={{ color: isSelected ? COLORS.lilac : COLORS.dim, fontSize: 11, fontFamily: "monospace" }} numberOfLines={1}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Mode toggle + preset badge + new buttons */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            onPress={() => setShowAITools(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: COLORS.dim,
              backgroundColor: "transparent",
            }}
          >
            <Brain size={16} color={COLORS.cyan} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowActivity(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: COLORS.dim,
              backgroundColor: "transparent",
            }}
          >
            <Activity size={16} color={COLORS.mint} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleMode}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 5,
              borderWidth: 1,
              borderColor: clientMode === "mock" ? COLORS.amber : COLORS.success,
              backgroundColor: clientMode === "mock" ? COLORS.amber + "18" : COLORS.success + "18",
            }}
          >
            <Text style={{ color: clientMode === "mock" ? COLORS.amber : COLORS.success, fontSize: 10, fontFamily: "monospace", fontWeight: "700" }}>
              {clientMode === "mock" ? "MOCK" : "LIVE"}
            </Text>
          </TouchableOpacity>

          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 5,
              borderWidth: 1,
              borderColor: PRESET_COLORS[preset],
              backgroundColor: PRESET_COLORS[preset] + "18",
            }}
          >
            <Text style={{ color: PRESET_COLORS[preset], fontSize: 10, fontFamily: "monospace", fontWeight: "700" }}>
              {preset}
            </Text>
          </View>
        </View>
      </View>

      {/* HISTORY STRIP */}
      {history.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 36, borderBottomWidth: 1, borderBottomColor: COLORS.dimmer, flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 6, gap: 6 }}
        >
          {history.map((h, i) => (
            <TouchableOpacity
              key={`${i}-${h.slice(0, 20)}`}
              onPress={() => setInputText(h)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: COLORS.dimmer,
                backgroundColor: COLORS.surface,
              }}
            >
              <Text style={{ color: COLORS.dim, fontSize: 10, fontFamily: "monospace" }} numberOfLines={1}>
                {h.length > 30 ? h.slice(0, 30) + "\u2026" : h}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {/* STREAMING TERMINAL */}
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        {/* Terminal top bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.dimmer,
            backgroundColor: COLORS.surface,
          }}
        >
          {/* macOS dots */}
          <View style={{ flexDirection: "row", gap: 5, marginRight: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF5F57" }} />
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#FEBC2E" }} />
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#28C840" }} />
          </View>
          <Text style={{ color: COLORS.dim, fontSize: 10, fontFamily: "monospace", flex: 1 }}>
            vce://cognitive-engine
          </Text>
          {routeInfo ? (
            <Text style={{ color: COLORS.magenta, fontSize: 9, fontFamily: "monospace", fontWeight: "600", letterSpacing: 0.4 }}>
              AI · {routeInfo.mode} · {routeInfo.intent}
            </Text>
          ) : null}
          {isStreaming ? (
            <ActivityIndicator size="small" color={COLORS.cyan} style={{ marginLeft: 8 }} />
          ) : null}
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, padding: 12 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {lines.length === 0 && !isStreaming ? (
            <Text style={{ color: COLORS.dimmer, fontFamily: "monospace", fontSize: 12 }}>
              {"// FORGE v2.0 ready.\n// Enter a request to engage the cognitive engine."}
            </Text>
          ) : null}

          {lines.map((line) => {
            const roleColor = line.role ? (ROLE_COLORS[line.role] ?? COLORS.text) : undefined;
            const textColor = line.isError
              ? COLORS.error
              : line.isFinal
              ? COLORS.success
              : line.isSystem
              ? COLORS.dim
              : roleColor ?? COLORS.text;

            return (
              <View key={line.id} style={{ marginBottom: 2 }}>
                {line.role && !line.isSystem ? (
                  <Text style={{ color: roleColor, fontSize: 9, fontFamily: "monospace", fontWeight: "700", marginBottom: 1, letterSpacing: 1 }}>
                    [{line.role}]
                  </Text>
                ) : null}
                <Text style={{ color: textColor, fontSize: 12, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", lineHeight: 18 }}>
                  {line.text}
                </Text>
              </View>
            );
          })}

          {isStreaming ? (
            <Text style={{ color: COLORS.cyan, fontFamily: "monospace", fontSize: 12 }}>{"\u258B"}</Text>
          ) : null}

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>

      {/* ENGINE DRAWER TOGGLE */}
      <TouchableOpacity
        onPress={() => setDrawerOpen((o) => !o)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: COLORS.violet + "50",
          backgroundColor: COLORS.surface,
          gap: 8,
        }}
      >
        <Cpu size={12} color={COLORS.violet} />
        <Text style={{ color: COLORS.dim, fontSize: 11, fontFamily: "monospace", fontWeight: "700", letterSpacing: 1, flex: 1 }}>
          ENGINE
        </Text>
        {routeInfo ? (
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <Text style={{ color: COLORS.dim, fontSize: 10, fontFamily: "monospace" }}>
              {routeInfo.intent} · {routeInfo.mode}
            </Text>
            {costStr ? (
              <Text style={{ color: COLORS.success, fontSize: 10, fontFamily: "monospace" }}>{costStr}</Text>
            ) : null}
            <View style={{ flexDirection: "row", gap: 3 }}>
              {routeInfo.roles.map((r) => (
                <View
                  key={r}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: ROLE_COLORS[r] ?? COLORS.dim,
                  }}
                />
              ))}
            </View>
          </View>
        ) : null}
        {drawerOpen ? (
          <ChevronDown size={14} color={COLORS.dim} />
        ) : (
          <ChevronUp size={14} color={COLORS.dim} />
        )}
      </TouchableOpacity>

      {/* ENGINE DRAWER */}
      {drawerOpen ? (
        <View
          style={{
            backgroundColor: COLORS.surfaceHigh,
            borderTopWidth: 1,
            borderTopColor: COLORS.dimmer,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          {/* Preset selector */}
          <Text style={{ color: COLORS.dim, fontSize: 10, fontFamily: "monospace", marginBottom: 8, letterSpacing: 0.5 }}>
            PRESET
          </Text>
          <View style={{ flexDirection: "row", marginBottom: 12 }}>
            <PresetButton value="FAST" preset={preset} onPress={setPreset} />
            <PresetButton value="SMART" preset={preset} onPress={setPreset} />
            <PresetButton value="DEEP" preset={preset} onPress={setPreset} />
          </View>

          {/* Scores if available */}
          {routeInfo ? (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {[
                { label: "COMPLEXITY", val: routeInfo.scores.complexity },
                { label: "RISK", val: routeInfo.scores.risk },
                { label: "UNCERTAINTY", val: routeInfo.scores.uncertainty },
              ].map(({ label, val }) => (
                <View key={label} style={{ flex: 1, alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 6, paddingVertical: 6 }}>
                  <Text style={{ color: val < 35 ? COLORS.success : val < 70 ? COLORS.warn : COLORS.error, fontSize: 14, fontFamily: "monospace", fontWeight: "700" }}>
                    {val}
                  </Text>
                  <Text style={{ color: COLORS.dim, fontSize: 8, fontFamily: "monospace", marginTop: 2, letterSpacing: 0.5 }}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Model overrides */}
          {models.length > 0 ? (
            <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
              <Text style={{ color: COLORS.dim, fontSize: 10, fontFamily: "monospace", letterSpacing: 0.5, marginBottom: 8 }}>
                MODEL OVERRIDES
              </Text>
              <ModelChips role="BUILDER" roleKey="builder" roleModels={sortedModels} selected={overrides.builder} onSelect={handleModelSelect} />
              <ModelChips role="CRITIC" roleKey="critic" roleModels={sortedModels} selected={overrides.critic} onSelect={handleModelSelect} />
              <ModelChips role="REASONER" roleKey="reasoner" roleModels={sortedModels} selected={overrides.reasoner} onSelect={handleModelSelect} />
            </ScrollView>
          ) : (
            <Text style={{ color: COLORS.dimmer, fontSize: 10, fontFamily: "monospace" }}>
              No models available. Add an API key in Settings.
            </Text>
          )}
        </View>
      ) : null}

      {/* COMPOSER */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          paddingHorizontal: 12,
          paddingVertical: 10,
          paddingBottom: 14,
          borderTopWidth: 1,
          borderTopColor: COLORS.dimmer,
          backgroundColor: COLORS.surface,
          gap: 8,
        }}
      >
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Enter request\u2026"
          placeholderTextColor={COLORS.dimmer}
          multiline
          style={{
            flex: 1,
            color: COLORS.text,
            fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
            fontSize: 13,
            backgroundColor: COLORS.bg,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: COLORS.dimmer,
            paddingHorizontal: 12,
            paddingVertical: 10,
            maxHeight: 100,
            minHeight: 42,
          }}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
        />

        {isStreaming ? (
          <TouchableOpacity
            onPress={handleStop}
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: COLORS.error,
              backgroundColor: COLORS.error + "18",
            }}
          >
            <Square size={16} color={COLORS.error} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim()}
            style={{
              paddingHorizontal: 16,
              height: 42,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: inputText.trim() ? COLORS.cyan : COLORS.dimmer,
              backgroundColor: inputText.trim() ? COLORS.cyan + "22" : "transparent",
              flexDirection: "row",
              gap: 6,
            }}
          >
            <Zap size={14} color={inputText.trim() ? COLORS.cyan : COLORS.dim} />
            <Text style={{ color: inputText.trim() ? COLORS.cyan : COLORS.dim, fontSize: 12, fontFamily: "monospace", fontWeight: "700", letterSpacing: 1 }}>
              FORGE
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* AI Tools Modal */}
      <AIToolsModal isOpen={showAITools} onClose={() => setShowAITools(false)} />

      {/* Activity Modal */}
      <ActivityModal isOpen={showActivity} onClose={() => setShowActivity(false)} />
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
