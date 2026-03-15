import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Volume2 } from "lucide-react-native";
import { Audio } from "expo-av";
import { textToSpeech } from "@/lib/ai";
import { C } from "@/theme/colors";

export function TTSSection() {
  const [text, setText] = useState<string>("");
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(false);

  const handleGenerate = async () => {
    if (!text.trim() || loading) return;

    setLoading(true);
    try {
      const uri = await textToSpeech(text.trim(), {
        voice: "nova",
        model: "tts-1",
        speed: 1.0,
      });
      setAudioUri(uri);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to generate speech");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (!audioUri) return;

    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.pauseAsync();
          setPlaying(false);
        } else {
          await sound.playAsync();
          setPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlaying(false);
          }
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to play audio");
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 16, color: C.text, fontWeight: "600" }}>
          Text to Speech
        </Text>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Enter text to convert to speech..."
          placeholderTextColor={C.dim}
          style={{
            backgroundColor: C.s2,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: C.b1,
            color: C.text,
            fontSize: 15,
            minHeight: 120,
            textAlignVertical: "top",
          }}
          multiline
          maxLength={4000}
        />

        <Pressable
          onPress={handleGenerate}
          disabled={loading || !text.trim()}
          style={{
            backgroundColor: text.trim() && !loading ? C.cy : C.s2,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: text.trim() && !loading ? C.cy : C.b1,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={C.cy} />
          ) : (
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: text.trim() ? C.bg : C.dim,
              }}
            >
              GENERATE SPEECH
            </Text>
          )}
        </Pressable>

        {audioUri ? (
          <View
            style={{
              backgroundColor: C.s2,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: C.b1,
              padding: 24,
              alignItems: "center",
              gap: 16,
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: C.s1,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: C.b1,
              }}
            >
              <Volume2 size={28} color={C.cy} />
            </View>

            <Pressable
              onPress={handlePlayPause}
              style={{
                backgroundColor: C.cy,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: C.bg,
                }}
              >
                {playing ? "PAUSE" : "PLAY"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
