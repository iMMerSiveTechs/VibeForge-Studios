/**
 * Preview Screen — Loads generated preview.html from project files.
 * Dead simple: find preview.html in project files → WebView.
 */
import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import {
  Eye,
  RefreshCw,
  Terminal,
  Smartphone,
  ChevronDown,
} from "lucide-react-native";
import { WebView } from "react-native-webview";
import { api } from "@/lib/api/api";
import { C } from "@/theme/colors";
import { useProjectStore } from "@/lib/state/project-store";

interface ProjectListItem {
  id: string;
  name: string;
}

interface ProjectFile {
  path: string;
  content: string;
}

interface Project {
  id: string;
  name: string;
  files: string;
}

export default function PreviewScreen() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);

  const [showConsole, setShowConsole] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ level: string; message: string }>>([]);
  const [showDeviceFrame, setShowDeviceFrame] = useState(true);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const [webViewKey, setWebViewKey] = useState(0);

  // Load projects list for picker
  const { data: projects } = useQuery<ProjectListItem[]>({
    queryKey: ["projects"],
    queryFn: () => api.get<ProjectListItem[]>("/api/projects"),
  });

  const selectedProject = projects?.find((p) => p.id === activeProjectId) ?? null;

  const {
    data: project,
    error: projectError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["project", activeProjectId],
    queryFn: () => api.get<Project>(`/api/projects/${activeProjectId}`),
    enabled: !!activeProjectId,
    retry: false,
  });

  // Refetch on focus
  useFocusEffect(
    useCallback(() => {
      if (activeProjectId) refetch();
    }, [activeProjectId, refetch])
  );

  // Clear stale project ID if project doesn't exist
  React.useEffect(() => {
    if (projectError && activeProjectId) {
      setActiveProjectId(null);
    }
  }, [projectError, activeProjectId, setActiveProjectId]);

  // Find preview.html from project files
  const previewHTML = useMemo(() => {
    if (!project?.files) return null;
    try {
      const files: ProjectFile[] | Record<string, string> =
        typeof project.files === "string" ? JSON.parse(project.files) : project.files;

      // Handle both array format [{path, content}] and object format {path: content}
      if (Array.isArray(files)) {
        const previewFile = files.find(
          (f) => f.path === "preview.html" || f.path === "/preview.html"
        );
        return previewFile?.content ?? null;
      } else if (files && typeof files === "object") {
        return files["preview.html"] ?? null;
      }
      return null;
    } catch {
      return null;
    }
  }, [project?.files]);

  const handleWebViewMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as {
          type: string;
          level: string;
          message: string;
        };
        if (msg.type === "console") {
          setConsoleLogs((prev) => [
            ...prev.slice(-99),
            { level: msg.level, message: msg.message },
          ]);
        }
      } catch {
        /* ignore */
      }
    },
    []
  );

  // --- Empty states ---

  if (!activeProjectId) {
    return (
      <SafeAreaView className="flex-1 bg-vf-bg" edges={["top"]}>
        {/* Header with project picker */}
        <View className="px-4 pt-3 pb-2">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Eye size={18} color={C.cy} />
              <Text
                className="text-vf-cyan text-lg ml-2 uppercase tracking-widest"
                style={{ fontFamily: "monospace" }}
              >
                Preview
              </Text>
            </View>
            {/* Project Picker */}
            <Pressable
              onPress={() => setShowProjectPicker((v) => !v)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: C.dim + "60",
                backgroundColor: "transparent",
                gap: 6,
              }}
            >
              <Text
                style={{
                  color: C.dim,
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
                numberOfLines={1}
              >
                Select project...
              </Text>
              <ChevronDown size={12} color={C.dim} />
            </Pressable>
          </View>
          <View className="h-px" style={{ backgroundColor: C.b1 }} />
        </View>

        {/* Project picker dropdown */}
        {showProjectPicker ? (
          <View
            style={{
              backgroundColor: C.s2,
              borderBottomWidth: 1,
              borderBottomColor: C.b1,
              maxHeight: 200,
            }}
          >
            {(projects ?? []).map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  setActiveProjectId(p.id);
                  setShowProjectPicker(false);
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: C.b1,
                }}
              >
                <Text
                  style={{
                    color: C.text,
                    fontSize: 13,
                    fontFamily: "monospace",
                  }}
                >
                  {p.name}
                </Text>
              </Pressable>
            ))}
            {(projects ?? []).length === 0 ? (
              <View style={{ padding: 16 }}>
                <Text
                  style={{
                    color: C.dim,
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

        <View className="flex-1 items-center justify-center px-8">
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: C.dim + "15" }}
          >
            <Eye size={28} color={C.dim} />
          </View>
          <Text
            className="text-vf-dim text-sm text-center mb-2"
            style={{ fontFamily: "monospace" }}
          >
            Select a project
          </Text>
          <Text
            className="text-vf-dim text-xs text-center"
            style={{ fontFamily: "monospace" }}
          >
            Use the dropdown above to pick a project to preview.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-vf-bg items-center justify-center"
        edges={["top"]}
      >
        <ActivityIndicator size="large" color={C.cy} />
        <Text
          className="text-vf-dim text-xs mt-3"
          style={{ fontFamily: "monospace" }}
        >
          Loading project...
        </Text>
      </SafeAreaView>
    );
  }

  if (!previewHTML) {
    return (
      <SafeAreaView className="flex-1 bg-vf-bg" edges={["top"]}>
        {/* Header */}
        <View className="px-4 pt-3 pb-2">
          <View className="flex-row items-center mb-2">
            <Eye size={18} color={C.cy} />
            <Text
              className="text-vf-cyan text-lg ml-2 uppercase tracking-widest"
              style={{ fontFamily: "monospace" }}
            >
              Preview
            </Text>
          </View>
          <View className="h-px" style={{ backgroundColor: C.b1 }} />
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: C.dim + "15" }}
          >
            <Eye size={28} color={C.dim} />
          </View>
          <Text
            className="text-vf-text text-sm text-center mb-2"
            style={{ fontFamily: "monospace", fontWeight: "bold" }}
          >
            No Preview Available
          </Text>
          <Text
            className="text-vf-dim text-xs text-center"
            style={{ fontFamily: "monospace", lineHeight: 18 }}
          >
            Generate your app in Forge first.{"\n"}A preview will appear here
            after code generation.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Main preview render ---
  return (
    <SafeAreaView className="flex-1 bg-vf-bg" edges={["top"]}>
      {/* Header */}
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Eye size={18} color={C.cy} />
            <Text
              className="text-vf-cyan text-lg ml-2 uppercase tracking-widest"
              style={{ fontFamily: "monospace" }}
            >
              Preview
            </Text>
            <View
              style={{
                marginLeft: 8,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
                backgroundColor: C.green + "20",
                borderWidth: 1,
                borderColor: C.green + "40",
              }}
            >
              <Text
                style={{
                  color: C.green,
                  fontSize: 9,
                  fontFamily: "monospace",
                  fontWeight: "700",
                }}
              >
                T3
              </Text>
            </View>
          </View>
          {/* Project Picker + Toolbar */}
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <Pressable
              onPress={() => setShowProjectPicker((v) => !v)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: selectedProject ? C.mg : C.dim + "60",
                backgroundColor: selectedProject ? C.mg + "20" : "transparent",
                gap: 4,
                maxWidth: 120,
              }}
            >
              <Text
                style={{
                  color: selectedProject ? C.cy : C.dim,
                  fontSize: 10,
                  fontFamily: "monospace",
                }}
                numberOfLines={1}
              >
                {selectedProject?.name ?? "Select..."}
              </Text>
              <ChevronDown size={10} color={C.dim} />
            </Pressable>
            <Pressable
              onPress={() => {
                setWebViewKey((k) => k + 1);
                setConsoleLogs([]);
              }}
              hitSlop={8}
            >
              <RefreshCw size={16} color={C.cy} />
            </Pressable>
            <Pressable
              onPress={() => setShowConsole((v) => !v)}
              hitSlop={8}
            >
              <Terminal size={16} color={showConsole ? C.green : C.dim} />
            </Pressable>
            <Pressable
              onPress={() => setShowDeviceFrame((v) => !v)}
              hitSlop={8}
            >
              <Smartphone size={16} color={showDeviceFrame ? C.mg : C.dim} />
            </Pressable>
          </View>
        </View>
        <View className="h-px" style={{ backgroundColor: C.b1 }} />
      </View>

      {/* Project picker dropdown */}
      {showProjectPicker ? (
        <View
          style={{
            backgroundColor: C.s2,
            borderBottomWidth: 1,
            borderBottomColor: C.b1,
            maxHeight: 200,
          }}
        >
          {(projects ?? []).map((p) => (
            <Pressable
              key={p.id}
              onPress={() => {
                setActiveProjectId(p.id);
                setShowProjectPicker(false);
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: C.b1,
                backgroundColor:
                  p.id === activeProjectId ? C.mg + "20" : "transparent",
              }}
            >
              <Text
                style={{
                  color: p.id === activeProjectId ? C.cy : C.text,
                  fontSize: 13,
                  fontFamily: "monospace",
                }}
              >
                {p.name}
              </Text>
            </Pressable>
          ))}
          {(projects ?? []).length === 0 ? (
            <View style={{ padding: 16 }}>
              <Text
                style={{
                  color: C.dim,
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

      {/* WebView */}
      <View
        className="flex-1"
        style={showDeviceFrame ? { padding: 8 } : undefined}
      >
        {showDeviceFrame ? (
          <View
            style={{
              flex: 1,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: C.b2,
              overflow: "hidden",
              backgroundColor: "#020203",
            }}
          >
            {/* Notch */}
            <View
              style={{
                alignSelf: "center",
                width: 120,
                height: 24,
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
                backgroundColor: "#020203",
                zIndex: 10,
              }}
            />
            <WebView
              key={webViewKey}
              ref={webViewRef}
              source={{ html: previewHTML }}
              style={{ flex: 1, backgroundColor: "#020203" }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled
              originWhitelist={["*"]}
            />
          </View>
        ) : (
          <WebView
            key={webViewKey}
            ref={webViewRef}
            source={{ html: previewHTML }}
            style={{ flex: 1, backgroundColor: "#020203" }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            originWhitelist={["*"]}
          />
        )}
      </View>

      {/* Console panel */}
      {showConsole ? (
        <View
          style={{
            maxHeight: 160,
            backgroundColor: "#0a0a0a",
            borderTopWidth: 1,
            borderTopColor: C.b1,
          }}
        >
          <View className="flex-row items-center justify-between px-3 py-1.5">
            <Text
              style={{
                color: C.dim,
                fontSize: 10,
                fontFamily: "monospace",
              }}
            >
              CONSOLE ({consoleLogs.length})
            </Text>
            <Pressable onPress={() => setConsoleLogs([])} hitSlop={8}>
              <Text
                style={{
                  color: C.dim,
                  fontSize: 10,
                  fontFamily: "monospace",
                }}
              >
                CLEAR
              </Text>
            </Pressable>
          </View>
          <ScrollView style={{ paddingHorizontal: 12 }}>
            {consoleLogs.map((log, i) => (
              <Text
                key={i}
                style={{
                  color:
                    log.level === "error"
                      ? C.red
                      : log.level === "warn"
                      ? C.warn
                      : C.cy,
                  fontSize: 10,
                  fontFamily: "monospace",
                  marginBottom: 1,
                }}
              >
                {log.message}
              </Text>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
