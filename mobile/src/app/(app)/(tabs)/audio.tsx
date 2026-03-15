import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import {
  Music,
  Upload,
  Play,
  Pause,
  Square,
  Trash2,
  Volume2,
  Mic,
} from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { C } from "@/theme/colors";
import { useToastStore } from "@/lib/state/toast-store";
import { Box } from "@/components/ui/Box";
import { api } from "@/lib/api/api";

interface Asset {
  id: string;
  fileId: string;
  url: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

interface PlaybackState {
  assetId: string | null;
  isPlaying: boolean;
  sound: Audio.Sound | null;
  duration?: number;
}

function formatDuration(ms?: number): string {
  if (!ms) return "--:--";
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function AudioTab() {
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>({
    assetId: null,
    isPlaying: false,
    sound: null,
  });
  const [ttsText, setTtsText] = useState("");
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();
  const soundRef = useRef<Audio.Sound | null>(null);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  // Fetch audio assets from backend
  const { data: assets, isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: () => api.get<Asset[]>("/api/files"),
  });

  const audioAssets = (assets ?? []).filter((a) =>
    a.contentType.startsWith("audio/")
  );

  // Delete asset
  const { mutate: deleteAsset } = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/files/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      showToast("Audio deleted");
    },
    onError: () => showToast("Failed to delete audio"),
  });

  // Upload audio to backend
  const handlePickAudio = useCallback(async () => {
    setIsPickerLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        let uploadedCount = 0;
        for (const asset of result.assets) {
          try {
            const formData = new FormData();
            formData.append("file", {
              uri: asset.uri,
              name: asset.name ?? `audio-${Date.now()}.mp3`,
              type: asset.mimeType ?? "audio/mpeg",
            } as unknown as Blob);

            await api.upload<Asset>("/api/upload", formData);
            uploadedCount++;
          } catch {
            // Continue with remaining files
          }
        }
        queryClient.invalidateQueries({ queryKey: ["assets"] });
        showToast(
          `${uploadedCount} audio file${uploadedCount !== 1 ? "s" : ""} uploaded`
        );
      }
    } catch {
      showToast("Failed to pick audio file");
    } finally {
      setIsPickerLoading(false);
    }
  }, [showToast, queryClient]);

  // Text-to-speech generation
  const handleTTS = useCallback(async () => {
    if (!ttsText.trim()) {
      showToast("Enter text to convert to speech");
      return;
    }
    setIsTtsLoading(true);
    try {
      const result = await api.post<{ url: string }>("/api/ai/audio/speech", {
        input: ttsText.trim(),
        voice: "alloy",
      });
      if (result?.url) {
        showToast("Speech generated!");
        setTtsText("");
        queryClient.invalidateQueries({ queryKey: ["assets"] });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "TTS generation failed";
      showToast(msg);
    } finally {
      setIsTtsLoading(false);
    }
  }, [ttsText, showToast, queryClient]);

  // Playback controls
  const handlePlay = useCallback(
    async (asset: Asset) => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        // Toggle pause/play
        if (playback.assetId === asset.id && playback.isPlaying) {
          await playback.sound?.pauseAsync();
          setPlayback((prev) => ({ ...prev, isPlaying: false }));
          return;
        }

        if (
          playback.assetId === asset.id &&
          !playback.isPlaying &&
          playback.sound
        ) {
          await playback.sound.playAsync();
          setPlayback((prev) => ({ ...prev, isPlaying: true }));
          return;
        }

        // Stop existing
        if (playback.sound) {
          await playback.sound.stopAsync();
          await playback.sound.unloadAsync();
        }

        const { sound, status } = await Audio.Sound.createAsync(
          { uri: asset.url },
          { shouldPlay: true },
          (s) => {
            if (s.isLoaded && s.didJustFinish) {
              soundRef.current = null;
              setPlayback({
                assetId: null,
                isPlaying: false,
                sound: null,
              });
            }
          }
        );

        soundRef.current = sound;
        const dur =
          status.isLoaded && status.durationMillis
            ? status.durationMillis
            : undefined;
        setPlayback({
          assetId: asset.id,
          isPlaying: true,
          sound,
          duration: dur,
        });
      } catch {
        showToast("Failed to play audio");
      }
    },
    [playback, showToast]
  );

  const handleStop = useCallback(async () => {
    if (playback.sound) {
      await playback.sound.stopAsync();
      await playback.sound.unloadAsync();
    }
    soundRef.current = null;
    setPlayback({ assetId: null, isPlaying: false, sound: null });
  }, [playback.sound]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (playback.assetId === id) {
        await handleStop();
      }
      deleteAsset(id);
    },
    [playback.assetId, handleStop, deleteAsset]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 4,
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
            <Music size={16} color={C.cy} />
          </View>
          <View>
            <Text
              style={{
                color: C.text,
                fontSize: 18,
                fontFamily: "monospace",
                fontWeight: "bold",
                letterSpacing: 4,
              }}
            >
              AUDIO
            </Text>
            <Text
              style={{
                color: C.dim,
                fontSize: 11,
                fontFamily: "monospace",
                letterSpacing: 1,
              }}
            >
              {audioAssets.length} clip
              {audioAssets.length !== 1 ? "s" : ""} stored
            </Text>
          </View>
        </View>
        <View
          style={{
            height: 1,
            backgroundColor: C.cy + "30",
            marginTop: 12,
            shadowColor: C.cy,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
          }}
        />
      </View>

      {/* Upload + TTS Buttons */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          gap: 10,
          marginBottom: 12,
        }}
      >
        <Pressable
          onPress={handlePickAudio}
          disabled={isPickerLoading}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: pressed ? C.cy + "30" : C.cy + "18",
            borderWidth: 1,
            borderColor: C.cy + "60",
            opacity: isPickerLoading ? 0.5 : 1,
          })}
        >
          {isPickerLoading ? (
            <ActivityIndicator size="small" color={C.cy} />
          ) : (
            <Upload size={15} color={C.cy} />
          )}
          <Text
            style={{
              color: C.cy,
              fontSize: 12,
              fontFamily: "monospace",
              fontWeight: "700",
              letterSpacing: 1,
            }}
          >
            UPLOAD
          </Text>
        </Pressable>

        <Pressable
          onPress={handleTTS}
          disabled={isTtsLoading}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: pressed ? C.mg + "30" : C.mg + "18",
            borderWidth: 1,
            borderColor: C.mg + "60",
            opacity: isTtsLoading ? 0.5 : 1,
          })}
        >
          {isTtsLoading ? (
            <ActivityIndicator size="small" color={C.mg} />
          ) : (
            <Mic size={15} color={C.mg} />
          )}
          <Text
            style={{
              color: C.mg,
              fontSize: 12,
              fontFamily: "monospace",
              fontWeight: "700",
              letterSpacing: 1,
            }}
          >
            TTS
          </Text>
        </Pressable>
      </View>

      {/* TTS Prompt */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <TextInput
          value={ttsText}
          onChangeText={setTtsText}
          placeholder="Text to convert to speech..."
          placeholderTextColor={C.dim}
          multiline
          style={{
            backgroundColor: C.s1,
            borderWidth: 1,
            borderColor: C.b1,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 10,
            color: C.text,
            fontSize: 12,
            fontFamily: "monospace",
            minHeight: 48,
            maxHeight: 80,
          }}
        />
      </View>

      {/* Content */}
      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={C.cy} />
        </View>
      ) : audioAssets.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
            paddingBottom: 80,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              backgroundColor: C.s1,
              borderWidth: 1,
              borderColor: C.b2,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Volume2 size={32} color={C.dim} />
          </View>
          <Text
            style={{
              color: C.text,
              fontSize: 15,
              fontFamily: "monospace",
              fontWeight: "bold",
              letterSpacing: 2,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            NO AUDIO YET
          </Text>
          <Text
            style={{
              color: C.dim,
              fontSize: 12,
              fontFamily: "monospace",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Upload audio files or generate speech with AI
          </Text>

          <Box accentColor={C.cy} className="mt-6 w-full">
            <Text
              style={{
                color: C.dim,
                fontSize: 11,
                fontFamily: "monospace",
                lineHeight: 18,
              }}
            >
              Supports MP3, WAV, M4A, AAC, OGG. Enter text above and tap TTS
              to generate speech.
            </Text>
          </Box>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
        >
          <Text
            style={{
              color: C.dim,
              fontSize: 10,
              fontFamily: "monospace",
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Audio Library
          </Text>

          {audioAssets.map((asset) => {
            const isActive = playback.assetId === asset.id;
            const isPlaying = isActive && playback.isPlaying;

            return (
              <View
                key={asset.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isActive ? C.cy + "10" : C.s1,
                  borderWidth: 1,
                  borderColor: isActive ? C.cy + "50" : C.b1,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 8,
                  gap: 12,
                }}
              >
                {/* Play/Pause button */}
                <Pressable
                  onPress={() => handlePlay(asset)}
                  style={({ pressed }) => ({
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: pressed
                      ? C.cy + "50"
                      : isActive
                        ? C.cy + "30"
                        : C.b2,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: isActive ? C.cy : C.b2,
                  })}
                >
                  {isPlaying ? (
                    <Pause size={16} color={isActive ? C.cy : C.mid} />
                  ) : (
                    <Play size={16} color={isActive ? C.cy : C.mid} />
                  )}
                </Pressable>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: isActive ? C.cy : C.text,
                      fontSize: 13,
                      fontFamily: "monospace",
                      fontWeight: "600",
                      marginBottom: 2,
                    }}
                    numberOfLines={1}
                  >
                    {asset.filename}
                  </Text>
                  <Text
                    style={{
                      color: C.dim,
                      fontSize: 10,
                      fontFamily: "monospace",
                    }}
                  >
                    {isActive
                      ? formatDuration(playback.duration)
                      : formatSize(asset.sizeBytes)}
                  </Text>
                </View>

                {/* Stop button (only when active) */}
                {isActive ? (
                  <Pressable
                    onPress={handleStop}
                    style={({ pressed }) => ({
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: pressed ? C.warn + "30" : C.b2,
                      alignItems: "center",
                      justifyContent: "center",
                    })}
                  >
                    <Square size={13} color={C.warn} />
                  </Pressable>
                ) : null}

                {/* Delete */}
                <Pressable
                  onPress={() => handleDelete(asset.id)}
                  style={({ pressed }) => ({
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: pressed ? C.red + "30" : C.b2,
                    alignItems: "center",
                    justifyContent: "center",
                  })}
                >
                  <Trash2 size={13} color={C.red} />
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
