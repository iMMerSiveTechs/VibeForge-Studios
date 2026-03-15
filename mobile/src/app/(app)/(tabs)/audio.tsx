import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
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
} from "lucide-react-native";
import { C } from "@/theme/colors";
import { useToastStore } from "@/lib/state/toast-store";
import { Box } from "@/components/ui/Box";

interface AudioClip {
  id: string;
  uri: string;
  name: string;
  duration?: number;
  addedAt: Date;
}

interface PlaybackState {
  clipId: string | null;
  isPlaying: boolean;
  sound: Audio.Sound | null;
}

function formatDuration(ms?: number): string {
  if (!ms) return "--:--";
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioTab() {
  const [clips, setClips] = useState<AudioClip[]>([]);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>({
    clipId: null,
    isPlaying: false,
    sound: null,
  });
  const showToast = useToastStore((s) => s.show);

  const handlePickAudio = async () => {
    setIsPickerLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newClips: AudioClip[] = result.assets.map((asset) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          uri: asset.uri,
          name: asset.name ?? `audio-${Date.now()}`,
          addedAt: new Date(),
        }));
        setClips((prev) => [...newClips, ...prev]);
        showToast(`${newClips.length} audio file${newClips.length > 1 ? "s" : ""} added`);
      }
    } catch {
      showToast("Failed to pick audio file");
    } finally {
      setIsPickerLoading(false);
    }
  };

  const handlePlay = async (clip: AudioClip) => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      // If same clip is playing, pause it
      if (playback.clipId === clip.id && playback.isPlaying) {
        await playback.sound?.pauseAsync();
        setPlayback((prev) => ({ ...prev, isPlaying: false }));
        return;
      }

      // If same clip is paused, resume
      if (playback.clipId === clip.id && !playback.isPlaying && playback.sound) {
        await playback.sound.playAsync();
        setPlayback((prev) => ({ ...prev, isPlaying: true }));
        return;
      }

      // Stop existing playback
      if (playback.sound) {
        await playback.sound.stopAsync();
        await playback.sound.unloadAsync();
      }

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: clip.uri },
        { shouldPlay: true },
        (s) => {
          if (s.isLoaded && s.didJustFinish) {
            setPlayback({ clipId: null, isPlaying: false, sound: null });
          }
        }
      );

      // Update clip duration if available
      if (status.isLoaded && status.durationMillis) {
        setClips((prev) =>
          prev.map((c) =>
            c.id === clip.id ? { ...c, duration: status.durationMillis ?? undefined } : c
          )
        );
      }

      setPlayback({ clipId: clip.id, isPlaying: true, sound });
    } catch {
      showToast("Failed to play audio");
    }
  };

  const handleStop = async () => {
    if (playback.sound) {
      await playback.sound.stopAsync();
      await playback.sound.unloadAsync();
    }
    setPlayback({ clipId: null, isPlaying: false, sound: null });
  };

  const handleDelete = async (id: string) => {
    if (playback.clipId === id) {
      await handleStop();
    }
    setClips((prev) => prev.filter((c) => c.id !== id));
    showToast("Audio removed");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
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
            <Text style={{ color: C.dim, fontSize: 11, fontFamily: "monospace", letterSpacing: 1 }}>
              {clips.length} clip{clips.length !== 1 ? "s" : ""} loaded
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

      {/* Upload Button */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <Pressable
          onPress={handlePickAudio}
          disabled={isPickerLoading}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            paddingVertical: 13,
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
            <Upload size={16} color={C.cy} />
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
            UPLOAD AUDIO
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {clips.length === 0 ? (
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
            Upload MP3, WAV, M4A, or other audio files to use in your app
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
              Supports MP3, WAV, M4A, AAC, OGG and other common audio formats.
            </Text>
          </Box>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
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

          {clips.map((clip) => {
            const isActive = playback.clipId === clip.id;
            const isPlaying = isActive && playback.isPlaying;

            return (
              <View
                key={clip.id}
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
                  onPress={() => handlePlay(clip)}
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
                    {clip.name}
                  </Text>
                  <Text
                    style={{
                      color: C.dim,
                      fontSize: 10,
                      fontFamily: "monospace",
                    }}
                  >
                    {formatDuration(clip.duration)}
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
                  onPress={() => handleDelete(clip.id)}
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
