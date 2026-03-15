/**
 * Example usage of file picker and upload utilities
 *
 * This file demonstrates how to use the file-picker and upload utilities together.
 * Import these functions in your components as needed.
 */

import { pickImage, pickDocument, takePhoto, pickVideo } from "./file-picker";
import { uploadFile } from "./upload";

/**
 * Example: Pick an image and upload it
 */
export async function pickAndUploadImage() {
  try {
    // Pick an image from library
    const image = await pickImage({ allowsEditing: true });

    if (!image) {
      console.log("Image picking cancelled");
      return null;
    }

    // Upload the image with progress tracking
    const uploadedFile = await uploadFile(image, {
      onProgress: (progress) => {
        console.log(`Upload progress: ${progress}%`);
      },
    });

    console.log("Image uploaded successfully:", uploadedFile.url);
    return uploadedFile;
  } catch (error) {
    console.error("Error picking/uploading image:", error);
    throw error;
  }
}

/**
 * Example: Take a photo and upload it
 */
export async function takePhotoAndUpload() {
  try {
    // Take a photo with camera
    const photo = await takePhoto({ allowsEditing: false });

    if (!photo) {
      console.log("Photo capture cancelled");
      return null;
    }

    // Upload the photo
    const uploadedFile = await uploadFile(photo);

    console.log("Photo uploaded successfully:", uploadedFile.url);
    return uploadedFile;
  } catch (error) {
    console.error("Error capturing/uploading photo:", error);
    throw error;
  }
}

/**
 * Example: Pick a document and upload it
 */
export async function pickAndUploadDocument() {
  try {
    // Pick a PDF document
    const document = await pickDocument({
      type: "application/pdf"
    });

    if (!document) {
      console.log("Document picking cancelled");
      return null;
    }

    // Upload the document
    const uploadedFile = await uploadFile(document);

    console.log("Document uploaded successfully:", uploadedFile.url);
    return uploadedFile;
  } catch (error) {
    console.error("Error picking/uploading document:", error);
    throw error;
  }
}

/**
 * Example: Pick a video and upload it
 */
export async function pickAndUploadVideo() {
  try {
    // Pick a video from library
    const video = await pickVideo();

    if (!video) {
      console.log("Video picking cancelled");
      return null;
    }

    // Upload the video with progress tracking
    const uploadedFile = await uploadFile(video, {
      onProgress: (progress) => {
        console.log(`Video upload progress: ${progress}%`);
      },
    });

    console.log("Video uploaded successfully:", uploadedFile.url);
    return uploadedFile;
  } catch (error) {
    console.error("Error picking/uploading video:", error);
    throw error;
  }
}
