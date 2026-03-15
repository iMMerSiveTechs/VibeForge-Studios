import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { ImageIcon, Upload, Sparkles, X, Grid2x2 } from "lucide-react-native";
import { C } from "@/theme/colors";
import { useToastStore } from "@/lib/state/toast-store";
import { Button } from "@/components/ui/Button";
import { Box } from "@/components/ui/Box";

const SCREEN_WIDTH = Dimensions.get("window").width;
const NUM_COLS = 3;
const CELL_SIZE = (SCREEN_WIDTH - 40 - (NUM_COLS - 1) * 6) / NUM_COLS;

interface UploadedImage {
  id: string;
  uri: string;
  name: string;
  addedAt: Date;
}

export default function ImageTab() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const showToast = useToastStore((s) => s.show);

  const handlePickImage = async () => {
    setIsPickerLoading(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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
        const newImages: UploadedImage[] = result.assets.map((asset) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          uri: asset.uri,
          name: asset.fileName ?? `image-${Date.now()}.jpg`,
          addedAt: new Date(),
        }));
        setImages((prev) => [...newImages, ...prev]);
        showToast(`${newImages.length} image${newImages.length > 1 ? "s" : ""} added`);
      }
    } catch {
      showToast("Failed to pick image");
    } finally {
      setIsPickerLoading(false);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    showToast("Image removed");
  };

  const handleGenerateImage = () => {
    showToast("AI image generation coming soon");
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
            <Text style={{ color: C.dim, fontSize: 11, fontFamily: "monospace", letterSpacing: 1 }}>
              {images.length} asset{images.length !== 1 ? "s" : ""} stored
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
          marginBottom: 16,
        }}
      >
        <Pressable
          onPress={handlePickImage}
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
          onPress={handleGenerateImage}
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
          })}
        >
          <Sparkles size={15} color={C.mg} />
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

      {/* Content */}
      {images.length === 0 ? (
        <ScrollView contentContainerStyle={{ flex: 1 }}>
          {/* Empty State */}
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
                Tip: Tap GENERATE to create AI images, or UPLOAD to add images from your photo library.
              </Text>
            </Box>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={images}
          numColumns={NUM_COLS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          columnWrapperStyle={{ gap: 6, marginBottom: 6 }}
          renderItem={({ item }) => (
            <View
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderRadius: 8,
                overflow: "hidden",
                backgroundColor: C.s1,
                borderWidth: 1,
                borderColor: C.b1,
              }}
            >
              <Image
                source={{ uri: item.uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              <Pressable
                onPress={() => handleRemoveImage(item.id)}
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
          )}
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
    </SafeAreaView>
  );
}
