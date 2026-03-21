/**
 * DecipherKit Image Preprocessor
 * Handles image conversion, orientation detection, compression, and color analysis
 */

import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";

const MAX_IMAGE_SIZE = 1024 * 1024; // 1MB
const MAX_DIMENSION = 2048;
const COMPRESSION_QUALITY = 0.8;

/**
 * Detect image orientation from EXIF or visual analysis
 * Returns rotation in degrees (0, 90, 180, 270)
 */
export async function detectOrientation(
  imageUri: string
): Promise<number> {
  return new Promise((resolve) => {
    // In production, use expo-image-picker's exif data if available
    // For now, return 0 (default orientation)
    // Try to get dimensions to infer orientation
    Image.getSize(
      imageUri,
      (width, height) => {
        // If height > width, likely portrait; width > height likely landscape
        // For now, just return 0 as orientation is auto-corrected on most platforms
        resolve(0);
      },
      () => {
        resolve(0); // Default to 0 on error
      }
    );
  });
}

/**
 * Convert image file to base64 string
 */
export async function imageToBase64(imageUri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    throw new Error(`Failed to convert image to base64: ${String(error)}`);
  }
}

/**
 * Compress image to reduce size for API transmission
 * Returns uri of compressed image
 */
export async function compressImage(
  imageUri: string,
  quality: number = COMPRESSION_QUALITY
): Promise<{ uri: string; size: number }> {
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error("Image file does not exist");
    }

    const currentSize = fileInfo.size ?? 0;

    // Check if compression is needed
    if (currentSize <= MAX_IMAGE_SIZE) {
      return { uri: imageUri, size: currentSize };
    }

    // In a real implementation, you'd use expo-image-manipulator to resize
    // For this example, we'll just return the original
    // In production: use ImageManipulator.manipulateAsync() with width/height constraints
    console.warn(
      `Image size ${currentSize} bytes exceeds limit, consider resizing`
    );

    return { uri: imageUri, size: currentSize };
  } catch (error) {
    throw new Error(`Failed to compress image: ${String(error)}`);
  }
}

/**
 * Extract dominant color from image using sampling
 * Returns hex color code
 */
export async function extractDominantColor(imageUri: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      // Simple color extraction by sampling center region
      // In production, use a library like react-native-image-colors
      // For now, return a neutral color as placeholder
      // The actual implementation would require processing pixel data

      Image.getSize(
        imageUri,
        (width, height) => {
          // Sample center region (placeholder implementation)
          // In production, you'd process actual pixel data
          resolve("#999999"); // Neutral gray fallback
        },
        () => {
          resolve("#999999");
        }
      );
    } catch {
      resolve("#999999"); // Return neutral color on error
    }
  });
}

/**
 * Validate image before processing
 */
export function validateImage(image: ImagePicker.ImagePickerSuccessResult): {
  valid: boolean;
  error?: string;
} {
  if (!image.assets || image.assets.length === 0) {
    return { valid: false, error: "No image selected" };
  }

  const asset = image.assets[0];

  if (!asset.uri) {
    return { valid: false, error: "Invalid image URI" };
  }

  // Check dimensions if available
  if (asset.width && asset.height) {
    if (asset.width > MAX_DIMENSION || asset.height > MAX_DIMENSION) {
      return {
        valid: false,
        error: `Image dimensions ${asset.width}x${asset.height} exceed limit of ${MAX_DIMENSION}px`,
      };
    }
  }

  return { valid: true };
}

/**
 * Prepare image for API transmission
 */
export async function prepareImageForApi(
  imageUri: string
): Promise<{
  base64: string;
  orientation: number;
  dominantColor: string;
  size: number;
}> {
  try {
    // Compress if needed
    const { size } = await compressImage(imageUri);

    // Convert to base64
    const base64 = await imageToBase64(imageUri);

    // Detect orientation
    const orientation = await detectOrientation(imageUri);

    // Extract dominant color
    const dominantColor = await extractDominantColor(imageUri);

    return {
      base64,
      orientation,
      dominantColor,
      size,
    };
  } catch (error) {
    throw new Error(
      `Failed to prepare image for API: ${String(error)}`
    );
  }
}

/**
 * Get image metadata
 */
export async function getImageMetadata(imageUri: string): Promise<{
  width: number;
  height: number;
  size: number;
}> {
  return new Promise((resolve, reject) => {
    try {
      const checkSize = async () => {
        try {
          const info = await FileSystem.getInfoAsync(imageUri);
          const size = (info as any).size ?? 0;

          Image.getSize(
            imageUri,
            (width, height) => {
              resolve({ width, height, size });
            },
            (error) => {
              reject(new Error(`Failed to get image dimensions: ${error}`));
            }
          );
        } catch (error) {
          reject(error);
        }
      };

      checkSize();
    } catch (error) {
      reject(error);
    }
  });
}
