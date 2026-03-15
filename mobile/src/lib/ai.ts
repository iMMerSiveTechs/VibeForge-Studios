import * as FileSystem from 'expo-file-system';

const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;

/**
 * AI API client utilities for OpenAI endpoints
 */

// Types
export interface ChatOptions {
  stream?: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ImageGenerateOptions {
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
  n?: number;
  quality?: "low" | "medium" | "high" | "auto";
}

export interface ImageAnalyzeOptions {
  model?: string;
  maxTokens?: number;
}

export interface TextToSpeechOptions {
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  model?: "tts-1" | "tts-1-hd";
  speed?: number;
  format?: "mp3" | "opus" | "aac" | "flac";
}

export interface ChatResponse {
  text: string;
}

export interface ImageGenerateResponse {
  url: string;
  images: string[];
}

export interface ImageAnalyzeResponse {
  text: string;
}

export interface TranscribeResponse {
  text: string;
}

/**
 * Chat with AI (text generation)
 * @param prompt - The text prompt to send
 * @param options - Optional configuration
 * @returns Promise<ChatResponse> or streaming handler
 */
export async function chatWithAI(
  prompt: string,
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const response = await fetch(`${baseUrl}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      stream: false,
      ...options,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to generate text");
  }

  const json = await response.json();
  return json.data;
}

/**
 * Chat with AI using streaming
 * @param prompt - The text prompt to send
 * @param onChunk - Callback for each text chunk
 * @param onDone - Callback when streaming is complete
 * @param onError - Callback for errors
 * @param options - Optional configuration
 */
export async function chatWithAIStream(
  prompt: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  options: ChatOptions = {}
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      stream: true,
      ...options,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to generate text");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              onChunk(parsed.text);
            } else if (parsed.done) {
              onDone();
            } else if (parsed.error) {
              onError(parsed.error);
            }
          } catch (e) {
            // Ignore parse errors for non-JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Generate an image from a text prompt
 * @param prompt - The image description
 * @param options - Optional configuration
 * @returns Promise<ImageGenerateResponse>
 */
export async function generateImage(
  prompt: string,
  options: ImageGenerateOptions = {}
): Promise<ImageGenerateResponse> {
  const response = await fetch(`${baseUrl}/api/ai/image/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      ...options,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to generate image");
  }

  const json = await response.json();
  return json.data;
}

/**
 * Analyze an image with AI vision
 * @param imageUri - Local file URI or data URL
 * @param prompt - What to ask about the image
 * @param options - Optional configuration
 * @returns Promise<ImageAnalyzeResponse>
 */
export async function analyzeImage(
  imageUri: string,
  prompt: string,
  options: ImageAnalyzeOptions = {}
): Promise<ImageAnalyzeResponse> {
  // Convert local URI to data URL if needed
  let imageData = imageUri;
  if (imageUri.startsWith("file://")) {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    imageData = `data:image/jpeg;base64,${base64}`;
  }

  const response = await fetch(`${baseUrl}/api/ai/image/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageData,
      prompt,
      ...options,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to analyze image");
  }

  const json = await response.json();
  return json.data;
}

/**
 * Transcribe audio to text
 * @param audioUri - Local file URI to audio file
 * @returns Promise<TranscribeResponse>
 */
export async function transcribeAudio(audioUri: string): Promise<TranscribeResponse> {
  // Get file info to determine mime type
  const fileInfo = await FileSystem.getInfoAsync(audioUri);
  if (!fileInfo.exists) {
    throw new Error("Audio file not found");
  }

  // Determine mime type from file extension
  const ext = audioUri.split(".").pop()?.toLowerCase();
  let mimeType = "audio/mpeg";
  if (ext === "wav") mimeType = "audio/wav";
  else if (ext === "m4a") mimeType = "audio/m4a";
  else if (ext === "webm") mimeType = "audio/webm";

  // Create form data
  const formData = new FormData();
  formData.append("file", {
    uri: audioUri,
    type: mimeType,
    name: `audio.${ext || "mp3"}`,
  } as any);

  const response = await fetch(`${baseUrl}/api/ai/audio/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to transcribe audio");
  }

  const json = await response.json();
  return json.data;
}

/**
 * Convert text to speech
 * @param text - The text to speak
 * @param options - Optional configuration
 * @returns Promise<string> - Local file URI to generated audio
 */
export async function textToSpeech(
  text: string,
  options: TextToSpeechOptions = {}
): Promise<string> {
  const response = await fetch(`${baseUrl}/api/ai/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      ...options,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to generate speech");
  }

  // Download audio to local file
  const arrayBuffer = await response.arrayBuffer();
  const format = options.format || "mp3";
  const fileUri = `${FileSystem.cacheDirectory}speech_${Date.now()}.${format}`;

  // Convert ArrayBuffer to base64
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  );

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
}
