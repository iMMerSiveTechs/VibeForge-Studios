/**
 * Forge Screen — Chat-based code generation.
 * User selects a project, types prompts, gets code generated with conversation memory.
 */
import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Zap,
  Send,
  Eye,
  ChevronDown,
  Cpu,
  Brain,
  Activity,
} from "lucide-react-native";
import { api } from "@/lib/api/api";
import { useFeatureFlags } from "@/lib/feature-flags";
import { useProjectStore } from "@/lib/state/project-store";
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
};

// ============ Types ============
interface Project {
  id: string;
  name: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  fileCount?: number;
  explanation?: string;
  timestamp: number;
}

interface HistoryMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface CodegenResult {
  changedFiles: string[];
  explanation: string;
  allFiles: string[];
  created: number;
  updated: number;
  deleted: number;
}

// ============ Main Component ============
export default function ForgeScreen() {
  const [inputText, setInputText] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showAITools, setShowAITools] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const showAdvanced = useFeatureFlags((s) => s.SHOW_ADVANCED_FORGE);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);

  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Load projects
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => api.get<Project[]>("/api/projects"),
  });

  const selectedProject = projects?.find((p) => p.id === activeProjectId) ?? null;

  // Load conversation history when project changes
  const { data: historyData } = useQuery<HistoryMessage[]>({
    queryKey: ["codegen-history", activeProjectId],
    queryFn: () =>
      api.get<HistoryMessage[]>(`/api/codegen/${activeProjectId}/history`),
    enabled: !!activeProjectId,
  });

  // Sync history into messages when it loads
  React.useEffect(() => {
    if (!historyData) return;
    const restored: ChatMessage[] = historyData.map((m) => {
      let explanation: string | undefined;
      let fileCount: number | undefined;
      if (m.role === "assistant") {
        try {
          const parsed = JSON.parse(m.content);
          explanation = parsed.explanation;
          fileCount = parsed.files?.length;
        } catch {
          explanation = m.content.substring(0, 200);
        }
      }
      return {
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.role === "user" ? m.content : (explanation ?? m.content.substring(0, 200)),
        explanation,
        fileCount,
        timestamp: new Date(m.createdAt).getTime(),
      };
    });
    setMessages(restored);
  }, [historyData]);

  const addMessage = useCallback(
    (msg: Omit<ChatMessage, "id" | "timestamp">) => {
      const newMsg: ChatMessage = {
        ...msg,
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, newMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      return newMsg;
    },
    []
  );

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;

    if (!selectedProject) {
      addMessage({ role: "system", content: "Select a project first using the dropdown above." });
      return;
    }

    setInputText("");
    addMessage({ role: "user", content: text });

    // Show typing indicator
    const typingId = `typing-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: typingId, role: "system", content: "Generating...", timestamp: Date.now() },
    ]);
    setIsGenerating(true);

    try {
      const result = await api.post<CodegenResult>(
        `/api/codegen/${selectedProject.id}`,
        { prompt: text }
      );

      // Remove typing indicator
      setMessages((prev) => prev.filter((m) => m.id !== typingId));

      addMessage({
        role: "assistant",
        content: result.explanation,
        explanation: result.explanation,
        fileCount: result.changedFiles.length,
      });

      // Invalidate project query so preview picks up new files
      queryClient.invalidateQueries({ queryKey: ["project", selectedProject.id] });
    } catch (err) {
      // Remove typing indicator
      setMessages((prev) => prev.filter((m) => m.id !== typingId));

      const errorMsg = err instanceof Error ? err.message : "Generation failed";
      addMessage({ role: "system", content: `Error: ${errorMsg}` });
    } finally {
      setIsGenerating(false);
    }
  }, [inputText, selectedProject, addMessage, queryClient]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.role === "user";
      const isSystem = item.role === "system";
      const isAssistant = item.role === "assistant";

      if (isSystem) {
        return (
          <View style={{ paddingHorizontal: 16, paddingVertical: 4, alignItems: "center" }}>
            <Text
              style={{
                color: item.content.startsWith("Error") ? COLORS.error : COLORS.dim,
                fontSize: 11,
                fontFamily: "monospace",
              }}
            >
              {item.content}
            </Text>
          </View>
        );
      }

      return (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 6,
            alignItems: isUser ? "flex-end" : "flex-start",
          }}
        >
          <View
            style={{
              maxWidth: "85%",
              backgroundColor: isUser
                ? COLORS.violet + "60"
                : COLORS.surfaceHigh,
              borderRadius: 12,
              borderTopRightRadius: isUser ? 4 : 12,
              borderTopLeftRadius: isUser ? 12 : 4,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: isUser ? COLORS.violet : COLORS.dimmer,
            }}
          >
            <Text
              style={{
                color: isUser ? COLORS.lilac : COLORS.text,
                fontSize: 13,
                fontFamily: "monospace",
                lineHeight: 19,
              }}
            >
              {item.content}
            </Text>

            {/* File count badge + Preview button for assistant messages */}
            {isAssistant && item.fileCount ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 8,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    backgroundColor: COLORS.cyan + "18",
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderWidth: 1,
                    borderColor: COLORS.cyan + "30",
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.cyan,
                      fontSize: 10,
                      fontFamily: "monospace",
                      fontWeight: "700",
                    }}
                  >
                    {item.fileCount} files
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push("/(app)/(tabs)/preview")}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: COLORS.success + "18",
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderWidth: 1,
                    borderColor: COLORS.success + "30",
                  }}
                >
                  <Eye size={10} color={COLORS.success} />
                  <Text
                    style={{
                      color: COLORS.success,
                      fontSize: 10,
                      fontFamily: "monospace",
                      fontWeight: "700",
                    }}
                  >
                    Preview
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      );
    },
    [router]
  );

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
            <Text
              style={{
                color: COLORS.cyan,
                fontSize: 14,
                fontFamily: "monospace",
                fontWeight: "800",
                letterSpacing: 2,
              }}
            >
              FORGE
            </Text>
          </View>

          {/* Project Picker */}
          <TouchableOpacity
            onPress={() => setShowProjectPicker((v) => !v)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              marginHorizontal: 12,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: selectedProject ? COLORS.violet : COLORS.dimmer,
              backgroundColor: selectedProject
                ? COLORS.violet + "20"
                : "transparent",
              gap: 6,
            }}
          >
            <Text
              style={{
                color: selectedProject ? COLORS.lilac : COLORS.dim,
                fontSize: 11,
                fontFamily: "monospace",
                flex: 1,
              }}
              numberOfLines={1}
            >
              {selectedProject?.name ?? "Select project..."}
            </Text>
            <ChevronDown size={12} color={COLORS.dim} />
          </TouchableOpacity>

          {/* Advanced controls (behind flag) */}
          {showAdvanced ? (
            <View style={{ flexDirection: "row", gap: 6 }}>
              <TouchableOpacity
                onPress={() => setShowAITools(true)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: COLORS.dim,
                }}
              >
                <Brain size={14} color={COLORS.cyan} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowActivity(true)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: COLORS.dim,
                }}
              >
                <Activity size={14} color={COLORS.mint} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* PROJECT PICKER DROPDOWN */}
        {showProjectPicker ? (
          <View
            style={{
              backgroundColor: COLORS.surfaceHigh,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.dimmer,
              maxHeight: 200,
            }}
          >
            {(projects ?? []).map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => {
                  setActiveProjectId(p.id);
                  setShowProjectPicker(false);
                  setMessages([]);
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.dimmer,
                  backgroundColor:
                    p.id === activeProjectId
                      ? COLORS.violet + "20"
                      : "transparent",
                }}
              >
                <Text
                  style={{
                    color:
                      p.id === activeProjectId ? COLORS.lilac : COLORS.text,
                    fontSize: 13,
                    fontFamily: "monospace",
                  }}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
            {(projects ?? []).length === 0 ? (
              <View style={{ padding: 16 }}>
                <Text
                  style={{
                    color: COLORS.dim,
                    fontSize: 12,
                    fontFamily: "monospace",
                    textAlign: "center",
                  }}
                >
                  No projects. Create one in Projects tab.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* CHAT MESSAGES */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 12 }}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
              <Cpu size={32} color={COLORS.dimmer} />
              <Text
                style={{
                  color: COLORS.dimmer,
                  fontFamily: "monospace",
                  fontSize: 12,
                  marginTop: 12,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                {selectedProject
                  ? `Ready to build ${selectedProject.name}.\nDescribe what you want to create.`
                  : "Select a project above to start building."}
              </Text>
            </View>
          }
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
        />

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
            placeholder={
              selectedProject
                ? "Describe what to build..."
                : "Select a project first"
            }
            placeholderTextColor={COLORS.dimmer}
            multiline
            editable={!isGenerating}
            style={{
              flex: 1,
              color: COLORS.text,
              fontFamily:
                Platform.OS === "ios" ? "Menlo" : "monospace",
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

          {isGenerating ? (
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: COLORS.cyan + "40",
                backgroundColor: COLORS.cyan + "10",
              }}
            >
              <ActivityIndicator size="small" color={COLORS.cyan} />
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || !selectedProject}
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor:
                  inputText.trim() && selectedProject
                    ? COLORS.cyan
                    : COLORS.dimmer,
                backgroundColor:
                  inputText.trim() && selectedProject
                    ? COLORS.cyan + "22"
                    : "transparent",
              }}
            >
              <Send
                size={16}
                color={
                  inputText.trim() && selectedProject
                    ? COLORS.cyan
                    : COLORS.dim
                }
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Advanced Modals (behind flag) */}
        {showAdvanced ? (
          <>
            <AIToolsModal
              isOpen={showAITools}
              onClose={() => setShowAITools(false)}
            />
            <ActivityModal
              isOpen={showActivity}
              onClose={() => setShowActivity(false)}
            />
          </>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
