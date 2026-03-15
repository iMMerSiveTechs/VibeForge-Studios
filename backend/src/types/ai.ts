/**
 * AI API Types
 * Type definitions for AI endpoints (chat, image generation, vision, TTS, transcription)
 */

// Chat endpoint types
export interface ChatRequest {
  prompt: string;
  stream?: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  text: string;
}

// Image generation types
export interface ImageGenerateRequest {
  prompt: string;
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
  n?: number;
  quality?: "low" | "medium" | "high" | "auto";
}

export interface ImageGenerateResponse {
  url: string;
  images: string[];
}

// Image analysis (vision) types
export interface ImageAnalyzeRequest {
  image: string; // data URL or base64
  prompt: string;
  model?: string;
  maxTokens?: number;
}

export interface ImageAnalyzeResponse {
  text: string;
}

// Audio transcription types
export interface AudioTranscribeResponse {
  text: string;
}

// Text-to-speech types
export interface AudioSpeechRequest {
  text: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  model?: "tts-1" | "tts-1-hd";
  speed?: number;
  format?: "mp3" | "opus" | "aac" | "flac";
}

// Error response type
export interface AIErrorResponse {
  error: {
    message: string;
    code: string;
  };
}
