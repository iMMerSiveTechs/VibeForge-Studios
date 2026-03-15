import { api } from "./api/api";

export interface UploadedFile {
  id: string;
  userId: string;
  fileId: string;
  url: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface UploadOptions {
  onProgress?: (progress: number) => void;
}

/**
 * Upload a file to the backend storage
 *
 * @param file - Object with uri, filename, and mimeType
 * @param options - Optional upload options including progress callback
 * @returns The uploaded file data from the backend
 *
 * @example
 * const result = await uploadFile(
 *   { uri: 'file://...', filename: 'photo.jpg', mimeType: 'image/jpeg' },
 *   { onProgress: (progress) => console.log(progress) }
 * );
 */
export async function uploadFile(
  file: { uri: string; filename: string; mimeType: string },
  options?: UploadOptions
): Promise<UploadedFile> {
  const formData = new FormData();

  // Create a file object compatible with FormData
  // @ts-ignore - React Native FormData accepts objects with uri property
  formData.append("file", {
    uri: file.uri,
    name: file.filename,
    type: file.mimeType,
  });

  // Note: Progress tracking is not directly supported with the current api.upload
  // For full progress support, you'd need to use XMLHttpRequest or a library like axios
  if (options?.onProgress) {
    options.onProgress(0);
  }

  try {
    const result = await api.upload<UploadedFile>("/api/upload", formData);

    if (options?.onProgress) {
      options.onProgress(100);
    }

    return result;
  } catch (error) {
    if (options?.onProgress) {
      options.onProgress(0);
    }
    throw error;
  }
}
