/**
 * Glyph Map Store
 * AsyncStorage-backed CRUD for handwriting correction mappings.
 *
 * [EXTRACTABLE] — This module can become a standalone OpenClaw tool
 * for managing user-specific handwriting correction dictionaries.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlyphMap, GlyphMapEntry } from '../types';

const STORAGE_KEY = '@decipherkit/glyph_map';

/**
 * Load the full glyph map from storage.
 */
export async function getGlyphMap(): Promise<GlyphMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GlyphMap) : {};
  } catch {
    console.warn('[GlyphMapStore] Failed to load glyph map, returning empty');
    return {};
  }
}

/**
 * Persist the full glyph map.
 */
async function saveGlyphMap(map: GlyphMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/**
 * Add or update a correction entry.
 * If the original already exists, update corrected text and bump frequency.
 */
export async function addCorrection(
  original: string,
  corrected: string,
): Promise<GlyphMapEntry> {
  const map = await getGlyphMap();
  const key = original.toLowerCase().trim();
  const now = new Date().toISOString();

  const existing = map[key];
  const entry: GlyphMapEntry = existing
    ? {
        ...existing,
        corrected,
        frequency: existing.frequency + 1,
        lastUsedAt: now,
      }
    : {
        original: key,
        corrected,
        frequency: 1,
        createdAt: now,
        lastUsedAt: now,
      };

  map[key] = entry;
  await saveGlyphMap(map);
  return entry;
}

/**
 * Remove a correction by its original key.
 */
export async function removeCorrection(original: string): Promise<boolean> {
  const map = await getGlyphMap();
  const key = original.toLowerCase().trim();
  if (!(key in map)) return false;
  delete map[key];
  await saveGlyphMap(map);
  return true;
}

/**
 * Export the entire glyph map as a JSON string (for sharing / backup).
 */
export async function exportGlyphMap(): Promise<string> {
  const map = await getGlyphMap();
  return JSON.stringify(map, null, 2);
}

/**
 * Import a glyph map from a JSON string, merging with existing entries.
 * Imported entries take precedence on conflict.
 */
export async function importGlyphMap(json: string): Promise<number> {
  const incoming = JSON.parse(json) as GlyphMap;
  const current = await getGlyphMap();
  let count = 0;

  for (const [key, entry] of Object.entries(incoming)) {
    current[key] = entry;
    count++;
  }

  await saveGlyphMap(current);
  return count;
}

/**
 * Clear the entire glyph map.
 */
export async function clearGlyphMap(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/**
 * Get the number of entries in the glyph map.
 */
export async function getGlyphMapSize(): Promise<number> {
  const map = await getGlyphMap();
  return Object.keys(map).length;
}
