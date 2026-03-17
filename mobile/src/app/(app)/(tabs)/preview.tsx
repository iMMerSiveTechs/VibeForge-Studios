import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Switch,
  Pressable,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  ChevronLeft,
  AlertTriangle,
  Smartphone,
  Camera as CameraIcon,
  Play,
  Pause,
  Code2,
  RefreshCw,
  Terminal,
} from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image as ExpoImage } from "expo-image";
import { Video, Audio, AVPlaybackStatus } from "expo-av";
import MapView, { Marker } from "react-native-maps";
import { CartesianChart, Bar, Line, Pie, PolarChart } from "victory-native";
import { WebView } from "react-native-webview";
import { api } from "@/lib/api/api";
import { cn } from "@/lib/cn";
import { C } from "@/theme/colors";
import { useToastStore } from "@/lib/state/toast-store";
import { useProjectStore } from "@/lib/state/project-store";
import { Button } from "@/components/ui/Button";
import { Box } from "@/components/ui/Box";
import { buildPreviewHTML } from "@/lib/preview-runtime";
import type {
  Project,
  VfAppSpec,
  VfNode,
  VfAction,
  FileItem,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Interpolation helper
// ---------------------------------------------------------------------------
function interpolate(
  template: string,
  state: Record<string, unknown>
): string {
  return template.replace(
    /\{\{state\.(\w+(?:\.\w+)*)\}\}/g,
    (_, path: string) => {
      const keys = path.split(".");
      let val: unknown = state;
      for (const k of keys) {
        if (val && typeof val === "object")
          val = (val as Record<string, unknown>)[k];
        else return "";
      }
      return String(val ?? "");
    }
  );
}

// ---------------------------------------------------------------------------
// Deep set helper (lodash-style path)
// ---------------------------------------------------------------------------
function deepSet(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const keys = path.split(".");
  if (keys.length === 1) {
    return { ...obj, [keys[0]]: value };
  }
  const [head, ...rest] = keys;
  const child = obj[head] && typeof obj[head] === "object"
    ? (Array.isArray(obj[head])
        ? [...(obj[head] as unknown[])]
        : { ...(obj[head] as Record<string, unknown>) })
    : {};
  return {
    ...obj,
    [head]: deepSet(child as Record<string, unknown>, rest.join("."), value),
  };
}

function deepGet(
  obj: Record<string, unknown>,
  path: string
): unknown {
  const keys = path.split(".");
  let val: unknown = obj;
  for (const k of keys) {
    if (val && typeof val === "object")
      val = (val as Record<string, unknown>)[k];
    else return undefined;
  }
  return val;
}

// ---------------------------------------------------------------------------
// Component for Camera node (with hooks)
// ---------------------------------------------------------------------------
function CameraNode({
  node,
  previewState,
  setPreviewState,
  showToast,
}: {
  node: Extract<VfNode, { type: "camera" }>;
  previewState: Record<string, unknown>;
  setPreviewState: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  showToast: (message: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const cameraRef = React.useRef<CameraView>(null);

  if (!permission) {
    return (
      <View className="mb-3">
        <Text className="text-vf-dim text-xs" style={{ fontFamily: "monospace" }}>
          Loading camera permissions...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="mb-3">
        {node.label ? (
          <Text
            className="text-vf-cyan text-xs uppercase tracking-widest mb-1.5"
            style={{ fontFamily: "monospace" }}
          >
            {node.label}
          </Text>
        ) : null}
        <Button
          label="Grant Camera Permission"
          onPress={requestPermission}
          variant="accent"
        />
      </View>
    );
  }

  if (!showCamera) {
    return (
      <View className="mb-3">
        {node.label ? (
          <Text
            className="text-vf-cyan text-xs uppercase tracking-widest mb-1.5"
            style={{ fontFamily: "monospace" }}
          >
            {node.label}
          </Text>
        ) : null}
        <Pressable
          onPress={() => setShowCamera(true)}
          className="bg-vf-s2 border border-vf-b1 rounded-lg p-6 items-center active:opacity-60"
        >
          <CameraIcon size={32} color={C.cy} />
          <Text
            className="text-vf-cyan text-sm mt-2"
            style={{ fontFamily: "monospace" }}
          >
            Open Camera
          </Text>
        </Pressable>
      </View>
    );
  }

  const capturePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        setPreviewState((prev) => ({ ...prev, [node.key]: photo.uri }));
        setShowCamera(false);
        showToast("Photo captured!");
      }
    }
  };

  return (
    <View className="mb-3">
      {node.label ? (
        <Text
          className="text-vf-cyan text-xs uppercase tracking-widest mb-1.5"
          style={{ fontFamily: "monospace" }}
        >
          {node.label}
        </Text>
      ) : null}
      <View className="relative rounded-lg overflow-hidden" style={{ height: 400 }}>
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
        >
          <View className="absolute bottom-0 left-0 right-0 p-4 flex-row justify-around">
            <Button
              label="Cancel"
              onPress={() => setShowCamera(false)}
              variant="secondary"
            />
            <Button
              label="Capture"
              onPress={capturePhoto}
              variant="accent"
            />
          </View>
        </CameraView>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component for Video node (with hooks)
// ---------------------------------------------------------------------------
function VideoNode({
  source,
  height,
}: {
  source: string;
  height?: number;
}) {
  const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null);
  const videoRef = React.useRef<Video>(null);

  const togglePlayback = async () => {
    if (videoRef.current) {
      if (videoStatus && "isPlaying" in videoStatus && videoStatus.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  const isPlaying = videoStatus && "isPlaying" in videoStatus && videoStatus.isPlaying;

  return (
    <View className="mb-3">
      <View className="rounded-lg overflow-hidden bg-vf-s2" style={{ height: height ?? 200 }}>
        <Video
          ref={videoRef}
          source={{ uri: source }}
          style={{ flex: 1 }}
          useNativeControls={false}
          onPlaybackStatusUpdate={setVideoStatus}
        />
        <Pressable
          onPress={togglePlayback}
          className="absolute inset-0 items-center justify-center"
        >
          <View className="bg-black/50 rounded-full p-4">
            {isPlaying ? (
              <Pause size={32} color={C.text} />
            ) : (
              <Play size={32} color={C.text} />
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component for Audio node (with hooks)
// ---------------------------------------------------------------------------
function AudioNode({
  source,
  label,
}: {
  source: string;
  label?: string;
}) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const loadAndPlayAudio = async () => {
    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else if (status.isLoaded) {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: source },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setPosition(status.positionMillis);
              setDuration(status.durationMillis ?? 0);
              setIsPlaying(status.isPlaying);
            }
          }
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch {
      // Audio loading failed
    }
  };

  React.useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <View className="mb-3">
      {label ? (
        <Text
          className="text-vf-cyan text-xs uppercase tracking-widest mb-1.5"
          style={{ fontFamily: "monospace" }}
        >
          {label}
        </Text>
      ) : null}
      <View className="bg-vf-s2 border border-vf-b1 rounded-lg p-4">
        <View className="flex-row items-center">
          <Pressable
            onPress={loadAndPlayAudio}
            className="w-12 h-12 bg-vf-cyan/20 rounded-full items-center justify-center mr-3"
          >
            {isPlaying ? (
              <Pause size={20} color={C.cy} />
            ) : (
              <Play size={20} color={C.cy} />
            )}
          </Pressable>
          <View className="flex-1">
            <View className="h-1 bg-vf-b2 rounded-full overflow-hidden">
              <View
                className="h-full bg-vf-cyan rounded-full"
                style={{
                  width: duration > 0 ? `${(position / duration) * 100}%` : "0%",
                }}
              />
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-vf-dim text-xs" style={{ fontFamily: "monospace" }}>
                {formatTime(position)}
              </Text>
              <Text className="text-vf-dim text-xs" style={{ fontFamily: "monospace" }}>
                {formatTime(duration)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Preview Screen
// ---------------------------------------------------------------------------
export default function PreviewScreen() {
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);
  const showToast = useToastStore((s) => s.show);

  const [previewMode, setPreviewMode] = useState<"spec" | "code">("spec");
  const [showConsole, setShowConsole] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ level: string; message: string }>>([]);
  const [showDeviceFrame, setShowDeviceFrame] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const [webViewKey, setWebViewKey] = useState(0);

  const { data: project, error: projectError, isLoading: isProjectLoading } = useQuery({
    queryKey: ["project", activeProjectId],
    queryFn: () => api.get<Project>(`/api/projects/${activeProjectId}`),
    enabled: !!activeProjectId,
    retry: false,
  });

  // Clear stale project ID if project doesn't exist (404)
  React.useEffect(() => {
    if (projectError && activeProjectId) {
      setActiveProjectId(null);
      showToast("Project not found - please select another");
    }
  }, [projectError, activeProjectId, setActiveProjectId, showToast]);

  const spec = useMemo<VfAppSpec | null>(() => {
    if (!project?.vfAppSpec) return null;
    try {
      return JSON.parse(project.vfAppSpec) as VfAppSpec;
    } catch {
      return null;
    }
  }, [project?.vfAppSpec]);

  // Parse files for code preview
  const parsedFiles = useMemo<FileItem[]>(() => {
    if (!project?.files) return [];
    try {
      return typeof project.files === "string" ? JSON.parse(project.files) : [];
    } catch {
      return [];
    }
  }, [project?.files]);

  // Build HTML for WebView
  const previewHTML = useMemo(() => {
    if (parsedFiles.length === 0) return null;
    return buildPreviewHTML(parsedFiles);
  }, [parsedFiles]);

  // Auto-select code mode when project has files but no spec
  React.useEffect(() => {
    if (parsedFiles.length > 0 && !spec) {
      setPreviewMode("code");
    } else if (spec) {
      setPreviewMode("spec");
    }
  }, [parsedFiles.length, spec]);

  const handleWebViewMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type: string; level: string; message: string };
      if (msg.type === "console") {
        setConsoleLogs(prev => [...prev.slice(-99), { level: msg.level, message: msg.message }]);
      }
    } catch { /* ignore */ }
  }, []);

  const [currentScreen, setCurrentScreen] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<Record<string, unknown>>({});
  const [navHistory, setNavHistory] = useState<string[]>([]);

  // Set the start screen when spec loads
  const activeScreenKey = currentScreen ?? spec?.start ?? null;
  const activeScreen = activeScreenKey ? spec?.screens?.[activeScreenKey] : null;
  const isStartScreen = activeScreenKey === spec?.start;

  // ---------------------------------------------------------------------------
  // Action handler
  // ---------------------------------------------------------------------------
  const handleAction = useCallback(
    (action: VfAction) => {
      switch (action.type) {
        case "nav":
          if (activeScreenKey) {
            setNavHistory((prev) => [...prev, activeScreenKey]);
          }
          setCurrentScreen(action.to);
          break;
        case "set":
          setPreviewState((prev) => deepSet(prev, action.path, action.value));
          break;
        case "append": {
          setPreviewState((prev) => {
            const existing = deepGet(prev, action.path);
            const arr = Array.isArray(existing) ? [...existing] : [];
            arr.push(action.value);
            return deepSet(prev, action.path, arr);
          });
          break;
        }
        case "remove": {
          setPreviewState((prev) => {
            const existing = deepGet(prev, action.path);
            if (!Array.isArray(existing)) return prev;
            const arr = [...existing];
            arr.splice(action.index, 1);
            return deepSet(prev, action.path, arr);
          });
          break;
        }
        case "toast":
          showToast(action.message);
          break;
      }
    },
    [activeScreenKey, showToast]
  );

  const handleBack = useCallback(() => {
    setNavHistory((prev) => {
      const copy = [...prev];
      const last = copy.pop();
      if (last) setCurrentScreen(last);
      return copy;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Node renderer
  // ---------------------------------------------------------------------------
  const renderNode = useCallback(
    (node: VfNode, index: number): React.ReactNode => {
      switch (node.type) {
        case "section":
          return (
            <View key={index} className="py-2">
              {node.children?.map((child, ci) => renderNode(child, ci)) ?? null}
            </View>
          );

        case "card":
          return (
            <Box key={index} className="mb-3">
              {node.children?.map((child, ci) => renderNode(child, ci)) ?? null}
            </Box>
          );

        case "row":
          return (
            <View key={index} className="flex-row items-center space-x-3 mb-2">
              {node.children?.map((child, ci) => (
                <View key={ci} className="flex-1">
                  {renderNode(child, ci)}
                </View>
              )) ?? null}
            </View>
          );

        case "divider":
          return (
            <View
              key={index}
              className="my-3"
              style={{ height: 1, backgroundColor: C.b1 }}
            />
          );

        case "spacer":
          return <View key={index} style={{ height: 16 }} />;

        case "text": {
          const content = interpolate(node.value ?? "", previewState);
          const variant = node.variant ?? "body";
          return (
            <Text
              key={index}
              className={cn(
                variant === "h1" && "text-2xl text-vf-text mb-2",
                variant === "h2" && "text-lg text-vf-text mb-1",
                variant === "body" && "text-base text-vf-text",
                variant === "caption" && "text-sm text-vf-dim"
              )}
              style={{
                fontFamily: "monospace",
                fontWeight:
                  variant === "h1" || variant === "h2" ? "bold" : "normal",
              }}
            >
              {content}
            </Text>
          );
        }

        case "metric": {
          const metricValue = interpolate(node.value ?? "", previewState);
          const metricLabel = interpolate(node.label ?? "", previewState);
          return (
            <View key={index} className="mb-2">
              <Text
                className="text-vf-dim text-sm mb-0.5"
                style={{ fontFamily: "monospace" }}
              >
                {metricLabel}
              </Text>
              <Text
                className="text-vf-green text-xl"
                style={{ fontFamily: "monospace", fontWeight: "bold" }}
              >
                {metricValue}
              </Text>
            </View>
          );
        }

        case "input": {
          const inputVal = String(
            (previewState[node.key] as string) ?? ""
          );
          return (
            <View key={index} className="mb-3">
              {node.label ? (
                <Text
                  className="text-vf-cyan text-xs uppercase tracking-widest mb-1.5"
                  style={{ fontFamily: "monospace" }}
                >
                  {node.label}
                </Text>
              ) : null}
              <TextInput
                value={inputVal}
                onChangeText={(text) =>
                  setPreviewState((prev) => ({ ...prev, [node.key]: text }))
                }
                placeholder={node.placeholder ?? ""}
                placeholderTextColor={C.dim}
                className="bg-vf-s2 border border-vf-b1 rounded-lg px-3 py-2.5 text-vf-text text-sm"
                style={{ fontFamily: "monospace" }}
              />
            </View>
          );
        }

        case "textarea": {
          const taVal = String(
            (previewState[node.key] as string) ?? ""
          );
          return (
            <View key={index} className="mb-3">
              {node.label ? (
                <Text
                  className="text-vf-cyan text-xs uppercase tracking-widest mb-1.5"
                  style={{ fontFamily: "monospace" }}
                >
                  {node.label}
                </Text>
              ) : null}
              <TextInput
                value={taVal}
                onChangeText={(text) =>
                  setPreviewState((prev) => ({ ...prev, [node.key]: text }))
                }
                placeholder={node.placeholder ?? ""}
                placeholderTextColor={C.dim}
                multiline
                textAlignVertical="top"
                className="bg-vf-s2 border border-vf-b1 rounded-lg px-3 py-2.5 text-vf-text text-sm"
                style={{ fontFamily: "monospace", minHeight: 96 }}
              />
            </View>
          );
        }

        case "toggle": {
          const toggleVal = Boolean(previewState[node.key]);
          return (
            <View
              key={index}
              className="flex-row items-center justify-between mb-3"
            >
              {node.label ? (
                <Text
                  className="text-vf-text text-sm"
                  style={{ fontFamily: "monospace" }}
                >
                  {node.label}
                </Text>
              ) : null}
              <Switch
                value={toggleVal}
                onValueChange={(val) =>
                  setPreviewState((prev) => ({ ...prev, [node.key]: val }))
                }
                trackColor={{ false: C.b2, true: C.green + "60" }}
                thumbColor={toggleVal ? C.green : C.mid}
              />
            </View>
          );
        }

        case "list": {
          const items = (previewState[node.key] ?? []) as Record<
            string,
            unknown
          >[];
          if (!Array.isArray(items)) return null;
          return (
            <View key={index} className="mb-3">
              {items.length === 0 ? (
                <Text
                  className="text-vf-dim text-xs text-center py-3"
                  style={{ fontFamily: "monospace" }}
                >
                  No items
                </Text>
              ) : (
                items.map((item, li) => (
                  <View
                    key={li}
                    className="bg-vf-s2 rounded-lg px-3 py-2.5 mb-1.5 border border-vf-b1"
                  >
                    <Text
                      className="text-vf-text text-sm"
                      style={{ fontFamily: "monospace" }}
                    >
                      {String(
                        node.titleKey ? item[node.titleKey] ?? "" : ""
                      )}
                    </Text>
                    {node.subtitleKey ? (
                      <Text
                        className="text-vf-dim text-xs mt-0.5"
                        style={{ fontFamily: "monospace" }}
                      >
                        {String(item[node.subtitleKey] ?? "")}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          );
        }

        case "camera":
          return (
            <CameraNode
              key={index}
              node={node}
              previewState={previewState}
              setPreviewState={setPreviewState}
              showToast={showToast}
            />
          );

        case "image": {
          const imageSource = interpolate(node.source ?? "", previewState);
          const aspectRatio = node.aspectRatio ?? 16 / 9;
          return (
            <View key={index} className="mb-3">
              <ExpoImage
                source={{ uri: imageSource }}
                style={{
                  width: node.width ?? Dimensions.get("window").width - 32,
                  height: node.height,
                  aspectRatio: node.height ? undefined : aspectRatio,
                  borderRadius: 12,
                  backgroundColor: C.s2,
                }}
                contentFit="cover"
              />
            </View>
          );
        }

        case "video": {
          const videoSource = interpolate(node.source ?? "", previewState);
          return (
            <VideoNode
              key={index}
              source={videoSource}
              height={node.height}
            />
          );
        }

        case "audio": {
          const audioSource = interpolate(node.source ?? "", previewState);
          return (
            <AudioNode
              key={index}
              source={audioSource}
              label={node.label}
            />
          );
        }

        case "map": {
          const markers = node.markers
            ? ((deepGet(previewState, node.markers) ?? []) as Array<{
                latitude: number;
                longitude: number;
                title?: string;
              }>)
            : [];

          return (
            <View key={index} className="mb-3 rounded-lg overflow-hidden" style={{ height: 300 }}>
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: node.latitude ?? 0,
                  longitude: node.longitude ?? 0,
                  latitudeDelta: node.latitudeDelta ?? 0.0922,
                  longitudeDelta: node.longitudeDelta ?? 0.0421,
                }}
              >
                {markers.map((marker, mi) => (
                  <Marker
                    key={mi}
                    coordinate={{
                      latitude: marker.latitude,
                      longitude: marker.longitude,
                    }}
                    title={marker.title}
                  />
                ))}
              </MapView>
            </View>
          );
        }

        case "chart": {
          const chartData = deepGet(previewState, node.data) as
            | Array<{ x: string | number; y: number; label?: string }>
            | undefined;

          if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
            return (
              <View key={index} className="mb-3">
                {node.label ? (
                  <Text
                    className="text-vf-cyan text-xs uppercase tracking-widest mb-1.5"
                    style={{ fontFamily: "monospace" }}
                  >
                    {node.label}
                  </Text>
                ) : null}
                <View className="bg-vf-s2 border border-vf-b1 rounded-lg p-4">
                  <Text className="text-vf-dim text-xs text-center" style={{ fontFamily: "monospace" }}>
                    No chart data available
                  </Text>
                </View>
              </View>
            );
          }

          const chartWidth = node.width ?? Dimensions.get("window").width - 32;
          const chartHeight = node.height ?? 200;

          return (
            <View key={index} className="mb-3">
              {node.label ? (
                <Text
                  className="text-vf-cyan text-xs uppercase tracking-widest mb-1.5"
                  style={{ fontFamily: "monospace" }}
                >
                  {node.label}
                </Text>
              ) : null}
              <View className="bg-vf-s2 border border-vf-b1 rounded-lg p-4">
                {node.chartType === "pie" ? (
                  <View style={{ width: chartWidth, height: chartHeight, alignItems: "center", justifyContent: "center" }}>
                    <PolarChart
                      data={chartData.map((d, i) => ({
                        value: d.y,
                        label: d.label ?? String(d.x),
                        color: [C.cy, C.green, C.mg, C.warn, C.red][i % 5],
                      }))}
                      colorKey="color"
                      valueKey="value"
                      labelKey="label"
                    >
                      <Pie.Chart innerRadius={40} />
                    </PolarChart>
                  </View>
                ) : (
                  <CartesianChart
                    data={chartData}
                    xKey="x"
                    yKeys={["y"]}
                    domainPadding={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  >
                    {({ points, chartBounds }) => {
                      if (node.chartType === "line") {
                        return (
                          <Line
                            points={points.y}
                            color={C.cy}
                            strokeWidth={2}
                            animate={{ type: "timing", duration: 300 }}
                          />
                        );
                      }
                      return (
                        <Bar
                          points={points.y}
                          chartBounds={chartBounds}
                          color={C.green}
                          roundedCorners={{ topLeft: 4, topRight: 4 }}
                          animate={{ type: "timing", duration: 300 }}
                        />
                      );
                    }}
                  </CartesianChart>
                )}
              </View>
            </View>
          );
        }

        case "gallery": {
          const images = (previewState[node.key] ?? []) as Array<{ uri: string; id?: string }>;
          const columns = node.columns ?? 3;
          const screenWidth = Dimensions.get("window").width;
          const padding = 32;
          const gap = 8;
          const imageSize = (screenWidth - padding - gap * (columns - 1)) / columns;

          if (!Array.isArray(images) || images.length === 0) {
            return (
              <View key={index} className="mb-3">
                <View className="bg-vf-s2 border border-vf-b1 rounded-lg p-4">
                  <Text className="text-vf-dim text-xs text-center" style={{ fontFamily: "monospace" }}>
                    No images in gallery
                  </Text>
                </View>
              </View>
            );
          }

          return (
            <View key={index} className="mb-3">
              <FlatList
                data={images}
                numColumns={columns}
                scrollEnabled={false}
                keyExtractor={(item, idx) => item.id ?? `img-${idx}`}
                columnWrapperStyle={{ gap }}
                contentContainerStyle={{ gap }}
                renderItem={({ item }) => (
                  <ExpoImage
                    source={{ uri: item.uri }}
                    style={{
                      width: imageSize,
                      height: imageSize,
                      borderRadius: 8,
                      backgroundColor: C.s2,
                    }}
                    contentFit="cover"
                  />
                )}
              />
            </View>
          );
        }

        case "button":
          return (
            <View key={index} className="mb-2">
              <Button
                label={node.label}
                onPress={() => handleAction(node.action)}
                variant={node.variant ?? "primary"}
              />
            </View>
          );

        default:
          return null;
      }
    },
    [previewState, handleAction, showToast]
  );

  // ---------------------------------------------------------------------------
  // Empty states
  // ---------------------------------------------------------------------------
  if (isProjectLoading && activeProjectId) {
    return (
      <SafeAreaView className="flex-1 bg-vf-bg items-center justify-center" edges={["top"]}>
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

  if (!activeProjectId) {
    return (
      <SafeAreaView className="flex-1 bg-vf-bg" edges={["top"]}>
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
            No project selected
          </Text>
          <Text
            className="text-vf-dim text-xs text-center"
            style={{ fontFamily: "monospace" }}
          >
            Select a project in the Projects tab first.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!spec) {
    return (
      <SafeAreaView className="flex-1 bg-vf-bg" edges={["top"]}>
        <View className="px-4 mt-4 mb-4">
          <View className="flex-row items-center">
            <Eye size={20} color={C.cy} />
            <Text
              className="text-vf-cyan text-lg ml-2 uppercase tracking-widest"
              style={{ fontFamily: "monospace" }}
            >
              Preview
            </Text>
          </View>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Box accentColor={C.warn}>
            <View className="flex-row items-center">
              <AlertTriangle size={16} color={C.warn} />
              <Text
                className="text-vf-warn text-xs ml-2"
                style={{ fontFamily: "monospace" }}
              >
                No VF_APP spec found. Generate one in the Generator tab.
              </Text>
            </View>
          </Box>
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  // Code Preview mode (WebView)
  if (previewMode === "code" && previewHTML && activeProjectId) {
    return (
      <SafeAreaView className="flex-1 bg-vf-bg" edges={["top"]}>
        {/* Header */}
        <View className="px-4 pt-3 pb-2">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Code2 size={18} color={C.cy} />
              <Text
                className="text-vf-cyan text-lg ml-2 uppercase tracking-widest"
                style={{ fontFamily: "monospace" }}
              >
                Code Preview
              </Text>
            </View>
            {/* Mode toggle + toolbar */}
            <View className="flex-row items-center" style={{ gap: 6 }}>
              {spec ? (
                <Pressable
                  onPress={() => setPreviewMode("spec")}
                  className="px-2 py-1 rounded border"
                  style={{ borderColor: C.dim }}
                >
                  <Text style={{ color: C.dim, fontSize: 10, fontFamily: "monospace" }}>SPEC</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => setWebViewKey(k => k + 1)} hitSlop={8}>
                <RefreshCw size={16} color={C.cy} />
              </Pressable>
              <Pressable onPress={() => setShowConsole(v => !v)} hitSlop={8}>
                <Terminal size={16} color={showConsole ? C.green : C.dim} />
              </Pressable>
              <Pressable onPress={() => setShowDeviceFrame(v => !v)} hitSlop={8}>
                <Smartphone size={16} color={showDeviceFrame ? C.mg : C.dim} />
              </Pressable>
            </View>
          </View>
          <View className="h-px" style={{ backgroundColor: C.b1 }} />
        </View>

        {/* WebView */}
        <View className="flex-1" style={showDeviceFrame ? { padding: 8 } : undefined}>
          {showDeviceFrame ? (
            <View style={{
              flex: 1, borderRadius: 20, borderWidth: 2, borderColor: C.b2,
              overflow: "hidden", backgroundColor: "#020203",
            }}>
              {/* Notch */}
              <View style={{
                alignSelf: "center", width: 120, height: 24, borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12, backgroundColor: "#020203", zIndex: 10,
              }} />
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
          <View style={{
            maxHeight: 160, backgroundColor: "#0a0a0a", borderTopWidth: 1, borderTopColor: C.b1,
          }}>
            <View className="flex-row items-center justify-between px-3 py-1.5">
              <Text style={{ color: C.dim, fontSize: 10, fontFamily: "monospace" }}>CONSOLE ({consoleLogs.length})</Text>
              <Pressable onPress={() => setConsoleLogs([])} hitSlop={8}>
                <Text style={{ color: C.dim, fontSize: 10, fontFamily: "monospace" }}>CLEAR</Text>
              </Pressable>
            </View>
            <ScrollView style={{ paddingHorizontal: 12 }}>
              {consoleLogs.map((log, i) => (
                <Text key={i} style={{
                  color: log.level === "error" ? C.red : log.level === "warn" ? C.warn : C.cy,
                  fontSize: 10, fontFamily: "monospace", marginBottom: 1,
                }}>
                  {log.message}
                </Text>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </SafeAreaView>
    );
  }

  // Spec Preview mode (original)
  return (
    <SafeAreaView className="flex-1 bg-vf-bg" edges={["top"]}>
      {/* Header */}
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Smartphone size={18} color={C.cy} />
            <Text
              className="text-vf-cyan text-lg ml-2 uppercase tracking-widest"
              style={{ fontFamily: "monospace" }}
            >
              Preview
            </Text>
          </View>
          {/* Mode toggle */}
          {parsedFiles.length > 0 ? (
            <Pressable
              onPress={() => setPreviewMode("code")}
              className="px-2 py-1 rounded border"
              style={{ borderColor: C.mg }}
            >
              <Text style={{ color: C.mg, fontSize: 10, fontFamily: "monospace" }}>CODE</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Breadcrumb / Navigation */}
        <View className="flex-row items-center">
          {!isStartScreen ? (
            <Pressable
              onPress={handleBack}
              className="flex-row items-center mr-3 active:opacity-60"
              hitSlop={8}
            >
              <ChevronLeft size={16} color={C.green} />
              <Text
                className="text-vf-green text-xs ml-0.5"
                style={{ fontFamily: "monospace" }}
              >
                Back
              </Text>
            </Pressable>
          ) : null}
          <View className="flex-row items-center flex-1">
            <Text
              className="text-vf-dim text-xs"
              style={{ fontFamily: "monospace" }}
            >
              {spec?.name ?? ""}
            </Text>
            <Text
              className="text-vf-dim text-xs mx-1"
              style={{ fontFamily: "monospace" }}
            >
              /
            </Text>
            <Text
              className="text-vf-text text-xs"
              style={{ fontFamily: "monospace" }}
            >
              {activeScreenKey}
            </Text>
          </View>
        </View>

        {/* Separator */}
        <View
          className="h-px mt-2"
          style={{ backgroundColor: C.b1 }}
        />
      </View>

      {/* Screen Title */}
      {activeScreen?.title ? (
        <View className="px-4 py-2">
          <Text
            className="text-vf-text text-xl"
            style={{ fontFamily: "monospace", fontWeight: "bold" }}
          >
            {activeScreen.title}
          </Text>
        </View>
      ) : null}

      {/* Screen Body */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        {activeScreen?.body?.map((node, i) => renderNode(node, i)) ?? null}
      </ScrollView>
    </SafeAreaView>
  );
}
