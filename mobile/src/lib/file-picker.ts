import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

export interface PickedFile {
  uri: string;
  filename: string;
  mimeType: string;
  size?: number;
}

/**
 * Pick an image from the device's photo library
 *
 * @param options - Optional image picker options
 * @returns The picked image file, or null if cancelled
 *
 * @example
 * const image = await pickImage({ allowsEditing: true });
 * if (image) {
 *   console.log('Picked image:', image.uri);
 * }
 */
export async function pickImage(
  options?: ImagePicker.ImagePickerOptions
): Promise<PickedFile | null> {
  // Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Media library permission not granted");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
    ...options,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) {
    return null;
  }

  return {
    uri: asset.uri,
    filename: asset.fileName || `image_${Date.now()}.jpg`,
    mimeType: asset.mimeType || "image/jpeg",
    size: asset.fileSize,
  };
}

/**
 * Pick a video from the device's photo library
 *
 * @param options - Optional image picker options
 * @returns The picked video file, or null if cancelled
 *
 * @example
 * const video = await pickVideo();
 * if (video) {
 *   console.log('Picked video:', video.uri);
 * }
 */
export async function pickVideo(
  options?: ImagePicker.ImagePickerOptions
): Promise<PickedFile | null> {
  // Request permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Media library permission not granted");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["videos"],
    allowsEditing: false,
    quality: 1,
    ...options,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) {
    return null;
  }

  return {
    uri: asset.uri,
    filename: asset.fileName || `video_${Date.now()}.mp4`,
    mimeType: asset.mimeType || "video/mp4",
    size: asset.fileSize,
  };
}

/**
 * Take a photo using the device's camera
 *
 * @param options - Optional camera options
 * @returns The captured photo file, or null if cancelled
 *
 * @example
 * const photo = await takePhoto({ allowsEditing: true });
 * if (photo) {
 *   console.log('Captured photo:', photo.uri);
 * }
 */
export async function takePhoto(
  options?: ImagePicker.ImagePickerOptions
): Promise<PickedFile | null> {
  // Request permission
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Camera permission not granted");
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
    ...options,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) {
    return null;
  }

  return {
    uri: asset.uri,
    filename: asset.fileName || `photo_${Date.now()}.jpg`,
    mimeType: asset.mimeType || "image/jpeg",
    size: asset.fileSize,
  };
}

/**
 * Record a video using the device's camera
 *
 * @param options - Optional camera options
 * @returns The recorded video file, or null if cancelled
 *
 * @example
 * const video = await recordVideo();
 * if (video) {
 *   console.log('Recorded video:', video.uri);
 * }
 */
export async function recordVideo(
  options?: ImagePicker.ImagePickerOptions
): Promise<PickedFile | null> {
  // Request permission
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Camera permission not granted");
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["videos"],
    allowsEditing: false,
    quality: 1,
    ...options,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) {
    return null;
  }

  return {
    uri: asset.uri,
    filename: asset.fileName || `video_${Date.now()}.mp4`,
    mimeType: asset.mimeType || "video/mp4",
    size: asset.fileSize,
  };
}

/**
 * Pick a document from the device's file system
 *
 * @param options - Optional document picker options
 * @returns The picked document file, or null if cancelled
 *
 * @example
 * const doc = await pickDocument({ type: 'application/pdf' });
 * if (doc) {
 *   console.log('Picked document:', doc.uri);
 * }
 */
export async function pickDocument(
  options?: DocumentPicker.DocumentPickerOptions
): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
    ...options,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) {
    return null;
  }

  return {
    uri: asset.uri,
    filename: asset.name,
    mimeType: asset.mimeType || "application/octet-stream",
    size: asset.size,
  };
}

/**
 * Pick multiple documents from the device's file system
 *
 * @param options - Optional document picker options
 * @returns Array of picked document files, or empty array if cancelled
 *
 * @example
 * const docs = await pickMultipleDocuments({ type: ['image/*', 'application/pdf'] });
 * console.log(`Picked ${docs.length} files`);
 */
export async function pickMultipleDocuments(
  options?: DocumentPicker.DocumentPickerOptions
): Promise<PickedFile[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
    multiple: true,
    ...options,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.map((asset) => ({
    uri: asset.uri,
    filename: asset.name,
    mimeType: asset.mimeType || "application/octet-stream",
    size: asset.size,
  }));
}
