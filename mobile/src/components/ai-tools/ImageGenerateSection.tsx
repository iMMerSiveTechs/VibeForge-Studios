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
import { generateImage } from "@/lib/ai";
import { C } from "@/theme/colors";

export function ImageGenerateSection() {
  const [prompt, setPrompt] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    try {
      const response = await generateImage(prompt.trim(), {
        size: "1024x1024",
        quality: "auto",
      });
      setImageUrl(response.url);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ gap: 16 }}>
        <Text style={{ fontSize: 16, color: C.text, fontWeight: "600" }}>
          Generate Image
        </Text>

        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Describe the image you want to create..."
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
            minHeight: 100,
            textAlignVertical: "top",
          }}
          multiline
          maxLength={1000}
        />

        <Pressable
          onPress={handleGenerate}
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
              GENERATE
            </Text>
          )}
        </Pressable>

        {imageUrl ? (
          <View
            style={{
              backgroundColor: C.s2,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: C.b1,
              overflow: "hidden",
              marginTop: 8,
            }}
          >
            <Image
              source={{ uri: imageUrl }}
              style={{ width: "100%", aspectRatio: 1 }}
              resizeMode="cover"
            />
            <View style={{ padding: 12 }}>
              <Text style={{ fontSize: 13, color: C.dim }}>Generated Image</Text>
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
