import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  FlatList,
  useWindowDimensions,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  ImageIcon,
  Upload,
  Sparkles,
  X,
  Grid2x2,
} from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { C } from "@/theme/colors";
import { useToastStore } from "@/lib/state/toast-store";
import { Box } from "@/components/ui/Box";
import { api } from "@/lib/api/api";

const NUM_COLS = 3;
const columnWrapperStyle = { gap: 6, marginBottom: 6 };
const keyExtractorById = (item: Asset) => item.id;

interface Asset {
  id: string;
  fileId: string;
  url: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

export default function ImageTab() {
  const { width: screenWidth } = useWindowDimensions();
  const cellSize = (screenWidth - 40 - (NUM_COLS - 1) * 6) / NUM_COLS;
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const showToast = useToastStore((s) => s.show);
  const queryClient = useQueryClient();

  // Fetch assets from backend
  const { data: assets, isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: () => api.get<Asset[]>("/api/files"),
  });

  const imageAssets = useMemo(
    () => (assets ?? []).filter((a) => a.contentType.startsWith("image/")),
    [assets]
  );

  // Delete asset
  const { mutate: deleteAsset } = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/files/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      showToast("Image deleted");
    },
    onError: () => showToast("Failed to delete image"),
  });

  // Upload images to backend
  const handlePickImage = useCallback(async () => {
    setIsPickerLoading(true);
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showToast("Permission to access photos is required");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 20,
      });

      if (!result.canceled && result.assets.length > 0) {
        let uploadedCount = 0;
        for (const asset of result.assets) {
          try {
            const formData = new FormData();
            formData.append("file", {
              uri: asset.uri,
              name: asset.fileName ?? `image-${Date.now()}.jpg`,
              type: asset.mimeType ?? "image/jpeg",
            } as unknown as Blob);

            await api.upload<Asset>("/api/upload", formData);
            uploadedCount++;
          } catch {
            // Continue with other images
          }
        }
        queryClient.invalidateQueries({ queryKey: ["assets"] });
        showToast(
          `${uploadedCount} image${uploadedCount !== 1 ? "s" : ""} uploaded`
        );
      }
    } catch {
      showToast("Failed to pick image");
    } finally {
      setIsPickerLoading(false);
    }
  }, [showToast, queryClient]);

  // AI image generation
  const handleGenerateImage = useCallback(async () => {
    if (!generatePrompt.trim()) {
      showToast("Enter a prompt to generate an image");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await api.post<{ url: string }>(
        "/api/ai/image/generate",
        {
          prompt: generatePrompt.trim(),
          size: "1024x1024",
        }
      );
      if (result?.url) {
        setPreviewUrl(result.url);
        setGeneratePrompt("");
        showToast("Image generated!");
        // Re-fetch assets in case it was stored
        queryClient.invalidateQueries({ queryKey: ["assets"] });
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Image generation failed";
      showToast(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [generatePrompt, showToast, queryClient]);

  const renderImageItem = useCallback(
    ({ item }: { item: Asset }) => (
      <View
        style={{
          width: cellSize,
          height: cellSize,
          borderRadius: 8,
          overflow: "hidden",
          backgroundColor: C.s1,
          borderWidth: 1,
          borderColor: C.b1,
        }}
      >
        <Pressable
          onPress={() => setPreviewUrl(item.url)}
          accessibilityLabel={`Preview ${item.filename}`}
          accessibilityRole="image"
          style={{ flex: 1 }}
        >
          <Image
            source={{ uri: item.url }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </Pressable>
        <Pressable
          onPress={() => deleteAsset(item.id)}
          accessibilityLabel="Delete image"
          accessibilityRole="button"
          style={({ pressed }) => ({
            position: "absolute",
            top: 4,
            right: 4,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: pressed ? C.red : C.bg + "CC",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: C.b2,
          })}
        >
          <X size={12} color={C.text} />
        </Pressable>
      </View>
    ),
    [cellSize, deleteAsset]
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
              backgroundColor: C.mg + "20",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <ImageIcon size={16} color={C.mg} />
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
              IMAGES
            </Text>
            <Text
              style={{
                color: C.dim,
                fontSize: 11,
                fontFamily: "monospace",
                letterSpacing: 1,
              }}
            >
              {imageAssets.length} asset
              {imageAssets.length !== 1 ? "s" : ""} stored
            </Text>
          </View>
        </View>
        <View
          style={{
            height: 1,
            backgroundColor: C.mg + "30",
            marginTop: 12,
            shadowColor: C.mg,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
          }}
        />
      </View>

      {/* Action Buttons */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          gap: 10,
          marginBottom: 12,
        }}
      >
        <Pressable
          onPress={handlePickImage}
          disabled={isPickerLoading}
          accessibilityLabel="Upload image"
          accessibilityRole="button"
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
          onPress={handleGenerateImage}
          disabled={isGenerating}
          accessibilityLabel="Generate image"
          accessibilityRole="button"
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
            opacity: isGenerating ? 0.5 : 1,
          })}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={C.mg} />
          ) : (
            <Sparkles size={15} color={C.mg} />
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
            GENERATE
          </Text>
        </Pressable>
      </View>

      {/* AI Prompt Input */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <TextInput
          value={generatePrompt}
          onChangeText={setGeneratePrompt}
          placeholder="Describe the image you want to create..."
          placeholderTextColor={C.dim}
          multiline
          accessibilityLabel="Image generation prompt"
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
          <ActivityIndicator size="large" color={C.mg} />
        </View>
      ) : imageAssets.length === 0 ? (
        <ScrollView contentContainerStyle={{ flex: 1 }}>
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
              <Grid2x2 size={32} color={C.dim} />
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
              NO IMAGES YET
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
              Upload images from your library or generate new ones with AI
            </Text>

            <Box accentColor={C.mg} className="mt-6 w-full">
              <Text
                style={{
                  color: C.dim,
                  fontSize: 11,
                  fontFamily: "monospace",
                  lineHeight: 18,
                }}
              >
                Tip: Enter a description above and tap GENERATE to create AI
                images, or UPLOAD to add images from your photo library.
              </Text>
            </Box>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={imageAssets}
          numColumns={NUM_COLS}
          keyExtractor={keyExtractorById}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
          }}
          columnWrapperStyle={columnWrapperStyle}
          initialNumToRender={12}
          maxToRenderPerBatch={9}
          windowSize={5}
          removeClippedSubviews
          renderItem={renderImageItem}
          ListHeaderComponent={
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
              Image Library
            </Text>
          }
        />
      )}

      {/* Image Preview Modal */}
      <Modal
        visible={previewUrl !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setPreviewUrl(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.95)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Pressable
            onPress={() => setPreviewUrl(null)}
            accessibilityLabel="Close preview"
            accessibilityRole="button"
            style={{
              position: "absolute",
              top: 60,
              right: 20,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: C.s2,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <X size={18} color={C.text} />
          </Pressable>
          {previewUrl ? (
            <Image
              source={{ uri: previewUrl }}
              style={{
                width: screenWidth - 40,
                height: screenWidth - 40,
                borderRadius: 12,
              }}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
