import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { analyzeImage } from "@/lib/ai";
import { C } from "@/theme/colors";

export function ImageAnalyzeSection() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("What's in this image?");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri || !prompt.trim() || loading) return;

    setLoading(true);
    try {
      const response = await analyzeImage(imageUri, prompt.trim());
      setResult(response.text);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 16, color: C.text, fontWeight: "600" }}>
          Analyze Image
        </Text>

        <Pressable
          onPress={pickImage}
          style={{
            backgroundColor: C.s2,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: C.b1,
            overflow: "hidden",
            aspectRatio: imageUri ? undefined : 16 / 9,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: "100%", aspectRatio: 1 }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ alignItems: "center", gap: 12 }}>
              <Camera size={48} color={C.dim} />
              <Text style={{ fontSize: 15, color: C.dim }}>Tap to select image</Text>
            </View>
          )}
        </Pressable>

        {imageUri ? (
          <>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              placeholder="What do you want to know about this image?"
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
              }}
            />

            <Pressable
              onPress={handleAnalyze}
              disabled={loading || !prompt.trim()}
              style={{
                backgroundColor: prompt.trim() && !loading ? C.cy : C.s2,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: prompt.trim() && !loading ? C.cy : C.b1,
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color={C.cy} />
              ) : (
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: prompt.trim() ? C.bg : C.dim,
                  }}
                >
                  ANALYZE
                </Text>
              )}
            </Pressable>

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
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}
