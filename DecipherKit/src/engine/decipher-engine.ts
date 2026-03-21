/**
 * Decipher Engine
 * Core transcription logic: sends a base64 image to Claude Vision API,
 * applies glyph map corrections, and persists history.
 *
 * [EXTRACTABLE] — This module can become a standalone OpenClaw tool
 * for handwriting-to-text transcription with learned corrections.
 */

import { ANTHROPIC_API_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GlyphMap,
  TranscriptionHistory,
  TranscriptionResult,
} from '../types';
import { getGlyphMap } from '../store/glyph-map-store';

const HISTORY_KEY = '@decipherkit/history';
const API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Generate a short random ID.
 */
function generateId(): string {
  return `dk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Call the Claude Vision API to transcribe handwritten text from an image.
 */
async function callClaudeVision(imageBase64: string): Promise<string> {
  if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === 'your-key-here') {
    throw new Error(
      'ANTHROPIC_API_KEY is not configured. Add your key to the .env file.',
    );
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `You are a precise handwriting transcription engine. Transcribe ALL handwritten text visible in this image.

Rules:
1. Preserve the original formatting as closely as possible (line breaks, indentation, lists).
2. If a character or word is uncertain, mark it with [?] immediately after (e.g., "hel[?]o").
3. Do not add any commentary, headers, or metadata — output ONLY the transcribed text.
4. If the image contains no handwritten text, respond with: [NO HANDWRITTEN TEXT DETECTED]
5. Maintain paragraph structure. Use blank lines between paragraphs.
6. For numbered or bulleted lists, preserve the numbering/bullet style.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Claude API error (${response.status}): ${errorBody}`,
    );
  }

  const data = await response.json();
  const textBlock = data.content?.find(
    (block: { type: string }) => block.type === 'text',
  );
  return textBlock?.text ?? '[TRANSCRIPTION FAILED]';
}

/**
 * Apply glyph map corrections to raw transcribed text.
 * Replaces known misrecognized patterns with their corrections.
 */
function applyCorrections(
  rawText: string,
  glyphMap: GlyphMap,
): { correctedText: string; correctionsApplied: number } {
  let correctedText = rawText;
  let correctionsApplied = 0;

  // Sort by length descending so longer patterns match first
  const entries = Object.values(glyphMap).sort(
    (a, b) => b.original.length - a.original.length,
  );

  for (const entry of entries) {
    const regex = new RegExp(escapeRegex(entry.original), 'gi');
    const before = correctedText;
    correctedText = correctedText.replace(regex, entry.corrected);
    if (correctedText !== before) {
      correctionsApplied++;
    }
  }

  return { correctedText, correctionsApplied };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Load transcription history from AsyncStorage.
 */
export async function getHistory(): Promise<TranscriptionHistory> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as TranscriptionHistory) : { entries: [] };
  } catch {
    return { entries: [] };
  }
}

/**
 * Save a transcription result to history.
 */
async function saveToHistory(result: TranscriptionResult): Promise<void> {
  const history = await getHistory();
  history.entries.unshift(result);
  // Keep last 100 entries
  if (history.entries.length > 100) {
    history.entries = history.entries.slice(0, 100);
  }
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * Get the total number of transcriptions performed.
 */
export async function getTranscriptionCount(): Promise<number> {
  const history = await getHistory();
  return history.entries.length;
}

/**
 * Main entry point: transcribe an image and return the result.
 *
 * 1. Sends the base64 image to Claude Vision API
 * 2. Loads the glyph map and applies corrections
 * 3. Saves the result to history
 * 4. Returns the full TranscriptionResult
 */
export async function transcribeImage(
  imageBase64: string,
): Promise<TranscriptionResult> {
  // Step 1: Get raw transcription from Claude
  const rawText = await callClaudeVision(imageBase64);

  // Step 2: Apply glyph map corrections
  const glyphMap = await getGlyphMap();
  const { correctedText, correctionsApplied } = applyCorrections(
    rawText,
    glyphMap,
  );

  // Step 3: Build result
  const result: TranscriptionResult = {
    id: generateId(),
    rawText,
    correctedText,
    imageBase64,
    timestamp: new Date().toISOString(),
    correctionsApplied,
  };

  // Step 4: Persist to history
  await saveToHistory(result);

  return result;
}

/**
 * Clear all transcription history.
 */
export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
