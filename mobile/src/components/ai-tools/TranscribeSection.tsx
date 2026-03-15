import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Mic } from "lucide-react-native";
import { Audio } from "expo-av";
import { transcribeAudio } from "@/lib/ai";
import { C } from "@/theme/colors";

export function TranscribeSection() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Error", "Microphone permission is required");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setResult(null);
    } catch (error) {
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);

    if (uri) {
      setAudioUri(uri);
    }
  };

  const handleTranscribe = async () => {
    if (!audioUri || loading) return;

    setLoading(true);
    try {
      const response = await transcribeAudio(audioUri);
      setResult(response.text);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to transcribe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 16, color: C.text, fontWeight: "600" }}>
          Transcribe Audio
        </Text>

        <View
          style={{
            backgroundColor: C.s2,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: C.b1,
            padding: 40,
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: isRecording ? C.red : C.s1,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: isRecording ? C.red : C.b1,
            }}
          >
            <Mic size={32} color={isRecording ? C.text : C.dim} />
          </View>

          <Pressable
            onPress={isRecording ? stopRecording : startRecording}
            style={{
              backgroundColor: isRecording ? C.red : C.cy,
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
              {isRecording ? "STOP RECORDING" : "START RECORDING"}
            </Text>
          </Pressable>

          {audioUri && !isRecording ? (
            <Text style={{ fontSize: 13, color: C.dim, marginTop: 8 }}>
              Recording ready to transcribe
            </Text>
          ) : null}
        </View>

        {audioUri && !isRecording ? (
          <Pressable
            onPress={handleTranscribe}
            disabled={loading}
            style={{
              backgroundColor: !loading ? C.cy : C.s2,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: !loading ? C.cy : C.b1,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={C.cy} />
            ) : (
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: C.bg,
                }}
              >
                TRANSCRIBE
              </Text>
            )}
          </Pressable>
        ) : null}

        {result ? (
          <View
            style={{
              backgroundColor: C.s2,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.b1,
            }}
          >
            <Text style={{ fontSize: 14, color: C.text, lineHeight: 22 }}>
              {result}
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
