/**
 * DecipherKit Camera Capture Component
 * Multi-image capture and gallery selection
 */

import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Image as RNImage,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, X, RefreshCw } from "lucide-react-native";
import { C } from "@/theme/colors";
import { validateImage } from "./image-preprocessor";

export interface CameraImage {
  id: string;
  uri: string;
  width: number;
  height: number;
  timestamp: Date;
}

interface CameraCaptureProps {
  onImagesSelected: (images: CameraImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function CameraCapture({
  onImagesSelected,
  maxImages = 4,
  disabled = false,
}: CameraCaptureProps) {
  const [images, setImages] = useState<CameraImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameraType, setCameraType] = useState<"front" | "back">("back");

  const canAddMore = images.length < maxImages;

  const handleCameraCapture = async () => {
    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        exif: true,
      });

      if (!result.canceled) {
        const validation = validateImage(result);
        if (!validation.valid) {
          throw new Error(validation.error || "Invalid image");
        }

        const asset = result.assets[0];
        const newImage: CameraImage = {
          id: `cam_${Date.now()}`,
          uri: asset.uri,
          width: asset.width ?? 0,
          height: asset.height ?? 0,
          timestamp: new Date(),
        };

        const updatedImages = [...images, newImage];
        setImages(updatedImages);
        onImagesSelected(updatedImages);
      }
    } catch (error) {
      console.error("Camera capture error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGallerySelect = async () => {
    setIsLoading(true);
    try {
      const remaining = maxImages - images.length;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        selectionLimit: remaining,
        exif: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets.map((asset, idx) => ({
          id: `gal_${Date.now()}_${idx}`,
          uri: asset.uri,
          width: asset.width ?? 0,
          height: asset.height ?? 0,
          timestamp: new Date(),
        }));

        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);
        onImagesSelected(updatedImages);
      }
    } catch (error) {
      console.error("Gallery selection error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = (id: string) => {
    const updatedImages = images.filter((img) => img.id !== id);
    setImages(updatedImages);
    onImagesSelected(updatedImages);
  };

  const handleClearAll = () => {
    setImages([]);
    onImagesSelected([]);
  };

  return (
    <View
      style={{
        backgroundColor: C.s1,
        borderBottomWidth: 1,
        borderBottomColor: C.b1,
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: C.cy + "20",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Camera size={14} color={C.cy} />
          </View>
          <Text
            style={{
              color: C.text,
              fontSize: 14,
              fontFamily: "monospace",
              fontWeight: "bold",
              letterSpacing: 2,
            }}
          >
            CAPTURE
          </Text>
        </View>

        {images.length > 0 && (
          <Text style={{ color: C.dim, fontSize: 11, fontFamily: "monospace" }}>
            {images.length}/{maxImages}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <Pressable
          onPress={handleCameraCapture}
          disabled={!canAddMore || isLoading || disabled}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 11,
            borderRadius: 8,
            backgroundColor: pressed
              ? C.cy + "25"
              : !canAddMore || disabled
              ? C.b2
              : C.cy + "15",
            borderWidth: 1,
            borderColor: !canAddMore || disabled ? C.b1 : C.cy + "50",
            opacity: !canAddMore || disabled ? 0.5 : 1,
            gap: 6,
          })}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={C.cy} />
          ) : (
            <Camera size={14} color={!canAddMore || disabled ? C.dim : C.cy} />
          )}
          <Text
            style={{
              color: !canAddMore || disabled ? C.dim : C.cy,
              fontSize: 11,
              fontFamily: "monospace",
              fontWeight: "600",
              letterSpacing: 1,
            }}
          >
            CAMERA
          </Text>
        </Pressable>

        <Pressable
          onPress={handleGallerySelect}
          disabled={!canAddMore || isLoading || disabled}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 11,
            borderRadius: 8,
            backgroundColor: pressed
              ? C.cy + "25"
              : !canAddMore || disabled
              ? C.b2
              : C.cy + "15",
            borderWidth: 1,
            borderColor: !canAddMore || disabled ? C.b1 : C.cy + "50",
            opacity: !canAddMore || disabled ? 0.5 : 1,
            gap: 6,
          })}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={C.cy} />
          ) : (
            <RefreshCw
              size={14}
              color={!canAddMore || disabled ? C.dim : C.cy}
            />
          )}
          <Text
            style={{
              color: !canAddMore || disabled ? C.dim : C.cy,
              fontSize: 11,
              fontFamily: "monospace",
              fontWeight: "600",
              letterSpacing: 1,
            }}
          >
            GALLERY
          </Text>
        </Pressable>
      </View>

      {/* Image Thumbnails */}
      {images.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 8 }}
          >
            {images.map((img) => (
              <View
                key={img.id}
                style={{
                  position: "relative",
                  borderRadius: 8,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: C.cy + "40",
                }}
              >
                <RNImage
                  source={{ uri: img.uri }}
                  style={{ width: 80, height: 80 }}
                />

                {/* Remove button */}
                <Pressable
                  onPress={() => handleRemoveImage(img.id)}
                  style={({ pressed }) => ({
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: pressed ? C.red + "90" : C.red + "70",
                    alignItems: "center",
                    justifyContent: "center",
                  })}
                >
                  <X size={12} color="#FFF" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Clear Button */}
      {images.length > 0 && (
        <Pressable
          onPress={handleClearAll}
          style={({ pressed }) => ({
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 6,
            backgroundColor: pressed ? C.b2 : "transparent",
            borderWidth: 1,
            borderColor: C.red + "40",
          })}
        >
          <Text
            style={{
              color: C.red,
              fontSize: 10,
              fontFamily: "monospace",
              fontWeight: "600",
              letterSpacing: 1,
            }}
          >
            CLEAR ALL
          </Text>
        </Pressable>
      )}
    </View>
  );
}
