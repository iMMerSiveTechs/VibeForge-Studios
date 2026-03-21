/**
 * DecipherKit Glyph Map Store
 * Zustand store for persisting and managing user's handwriting glyph mappings
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GlyphMap,
  GlyphEntry,
  CorrectionEntry,
  ConfidenceLevel,
} from "./types";

const GLYPH_MAP_STORAGE_KEY = "@decipher_glyph_map";
const CORRECTIONS_STORAGE_KEY = "@decipher_corrections";

/**
 * v0.3 seed data — extracted from decipher-kit/core/glyph-map-jaytee-v0.3.json
 * Provides known vocabulary, problem zones, and confidence gate settings
 * so the mobile client can do local post-processing on first launch.
 *
 * The full glyph map is loaded SERVER-SIDE for Claude Vision prompts.
 * This seed only captures what the mobile client needs for local corrections.
 */
const V03_SEED_VOCABULARY: string[] = [
  "OpenClaw", "VibeForge Studios", "Forge Command Center", "Claude Code",
  "Claude Cowork", "Procurement OS", "Estimate OS", "Transplant Tracker",
  "DecipherKit", "VCE", "ChurnWise", "CerebraSpark",
  "Rep Plan", "Tracks", "Token Usage", "Mobile Control",
  "Siri", "iPad", "Executive Branches", "agents", "F500",
  "Mapping", "Structure", "Audit", "Phase",
  "A Full Siri Record APP",
];

const V03_RELIABLE_CAPITALS = ["C", "F", "V", "S", "T", "A", "M", "O", "P", "N", "H"];

const V03_ALWAYS_CLEAN_WORDS = [
  "Claude", "Forge", "Vibe", "OpenClaw", "Command",
  "Center", "Code", "Cowork", "Build", "Local", "Connect", "Move",
];

/** Confidence gate threshold from v0.3 — corrections only apply below this */
const V03_CONFIDENCE_GATE = 0.70;

interface GlyphMapStore {
  glyphMap: GlyphMap | null;
  corrections: CorrectionEntry[];
  isLoading: boolean;
  correctionStats: {
    totalCorrections: number;
    correctionsByConfidence: Record<ConfidenceLevel, number>;
    lastCorrectionTime: Date | null;
  };

  // Core operations
  initializeGlyphMap: (userId: string) => Promise<void>;
  loadGlyphMap: () => Promise<void>;
  saveGlyphMap: () => Promise<void>;

  // Glyph operations
  addGlyph: (
    character: string,
    glyphImageBase64: string,
    confidence: ConfidenceLevel
  ) => void;
  updateGlyph: (glyphId: string, updates: Partial<GlyphEntry>) => void;
  removeGlyph: (glyphId: string) => void;
  getGlyph: (glyphId: string) => GlyphEntry | undefined;
  getGlyphsByCharacter: (character: string) => GlyphEntry[];

  // Correction operations
  addCorrection: (entry: CorrectionEntry) => void;
  loadCorrections: () => Promise<void>;
  saveCorrections: () => Promise<void>;
  clearCorrections: () => void;

  // Vocabulary update
  updateKnownVocabulary: (words: string[]) => void;

  // Import/export
  exportGlyphMap: () => Promise<string>;
  importGlyphMap: (jsonData: string) => Promise<void>;

  // Statistics
  refreshCorrectionStats: () => void;
  getCorrectionStats: () => GlyphMapStore["correctionStats"];
}

export const useGlyphMapStore = create<GlyphMapStore>((set, get) => ({
  glyphMap: null,
  corrections: [],
  isLoading: false,
  correctionStats: {
    totalCorrections: 0,
    correctionsByConfidence: {
      [ConfidenceLevel.HIGH]: 0,
      [ConfidenceLevel.MEDIUM]: 0,
      [ConfidenceLevel.LOW]: 0,
      [ConfidenceLevel.FLAG]: 0,
    },
    lastCorrectionTime: null,
  },

  initializeGlyphMap: async (userId: string) => {
    set({ isLoading: true });
    try {
      const existing = await AsyncStorage.getItem(GLYPH_MAP_STORAGE_KEY);

      if (existing) {
        const parsed = JSON.parse(existing);
        set({ glyphMap: parsed });
      } else {
        // Seed with v0.3 glyph map data so first launch isn't blank.
        // The full glyph map (with problem zones, structural notation, etc.)
        // is loaded SERVER-SIDE for Claude Vision prompts. This seed provides
        // the reliable forms + known vocabulary so the mobile client can do
        // local post-processing (confidence boosting for known-good words).
        const seedGlyphs: Record<string, GlyphEntry> = {};

        // Pre-populate "always clean" words as HIGH confidence glyphs
        // so applyGlyphMapCorrections can boost confidence on these
        V03_ALWAYS_CLEAN_WORDS.forEach((word) => {
          const id = `seed_${word.toLowerCase().replace(/\s+/g, "_")}`;
          seedGlyphs[id] = {
            id,
            glyphImageBase64: "", // no image for seed entries
            character: word.toLowerCase(),
            variants: [word, word.toLowerCase(), word.toUpperCase()],
            confidence: ConfidenceLevel.HIGH,
            correctionCount: 0,
            lastCorrected: null,
          };
        });

        // Pre-populate reliable capital letters
        V03_RELIABLE_CAPITALS.forEach((letter) => {
          const id = `seed_cap_${letter.toLowerCase()}`;
          seedGlyphs[id] = {
            id,
            glyphImageBase64: "",
            character: letter,
            variants: [letter, letter.toLowerCase()],
            confidence: ConfidenceLevel.HIGH,
            correctionCount: 0,
            lastCorrected: null,
          };
        });

        const newGlyphMap: GlyphMap = {
          id: `glyph_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          userId,
          glyphs: seedGlyphs,
          version: 3, // v0.3
          lastUpdated: new Date(),
          totalCorrections: 0,
        };
        set({ glyphMap: newGlyphMap });
        await get().saveGlyphMap();
      }

      await get().loadCorrections();
      get().refreshCorrectionStats();
    } finally {
      set({ isLoading: false });
    }
  },

  loadGlyphMap: async () => {
    set({ isLoading: true });
    try {
      const data = await AsyncStorage.getItem(GLYPH_MAP_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Ensure dates are parsed
        if (parsed.lastUpdated) {
          parsed.lastUpdated = new Date(parsed.lastUpdated);
        }
        Object.values(parsed.glyphs).forEach((glyph: any) => {
          if (glyph.lastCorrected) {
            glyph.lastCorrected = new Date(glyph.lastCorrected);
          }
        });
        set({ glyphMap: parsed });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  saveGlyphMap: async () => {
    const { glyphMap } = get();
    if (glyphMap) {
      await AsyncStorage.setItem(
        GLYPH_MAP_STORAGE_KEY,
        JSON.stringify(glyphMap)
      );
    }
  },

  addGlyph: (character, glyphImageBase64, confidence) => {
    set((state) => {
      if (!state.glyphMap) return state;

      const glyphId = `glyph_${Date.now()}_${character}`;
      const newGlyph: GlyphEntry = {
        id: glyphId,
        glyphImageBase64,
        character,
        variants: [character],
        confidence,
        correctionCount: 0,
        lastCorrected: null,
      };

      return {
        glyphMap: {
          ...state.glyphMap,
          glyphs: {
            ...state.glyphMap.glyphs,
            [glyphId]: newGlyph,
          },
          lastUpdated: new Date(),
        },
      };
    });
    get().saveGlyphMap();
  },

  updateGlyph: (glyphId, updates) => {
    set((state) => {
      if (!state.glyphMap || !state.glyphMap.glyphs[glyphId]) return state;

      return {
        glyphMap: {
          ...state.glyphMap,
          glyphs: {
            ...state.glyphMap.glyphs,
            [glyphId]: {
              ...state.glyphMap.glyphs[glyphId],
              ...updates,
              lastCorrected: new Date(),
            },
          },
          lastUpdated: new Date(),
        },
      };
    });
    get().saveGlyphMap();
  },

  removeGlyph: (glyphId) => {
    set((state) => {
      if (!state.glyphMap) return state;

      const { [glyphId]: _, ...remaining } = state.glyphMap.glyphs;

      return {
        glyphMap: {
          ...state.glyphMap,
          glyphs: remaining,
          lastUpdated: new Date(),
        },
      };
    });
    get().saveGlyphMap();
  },

  getGlyph: (glyphId) => {
    const { glyphMap } = get();
    return glyphMap?.glyphs[glyphId];
  },

  getGlyphsByCharacter: (character) => {
    const { glyphMap } = get();
    if (!glyphMap) return [];
    return Object.values(glyphMap.glyphs).filter(
      (g) => g.character === character || g.variants.includes(character)
    );
  },

  addCorrection: (entry) => {
    set((state) => {
      const updated = [...state.corrections, entry];
      if (state.glyphMap) {
        state.glyphMap.totalCorrections += 1;
      }
      return { corrections: updated };
    });
    get().saveCorrections();
    get().refreshCorrectionStats();
  },

  loadCorrections: async () => {
    try {
      const data = await AsyncStorage.getItem(CORRECTIONS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Ensure dates are parsed
        const corrected = parsed.map((c: any) => ({
          ...c,
          timestamp: new Date(c.timestamp),
        }));
        set({ corrections: corrected });
      }
    } catch {
      // If parsing fails, start fresh
      set({ corrections: [] });
    }
  },

  saveCorrections: async () => {
    const { corrections } = get();
    await AsyncStorage.setItem(
      CORRECTIONS_STORAGE_KEY,
      JSON.stringify(corrections)
    );
  },

  clearCorrections: () => {
    set({ corrections: [] });
    AsyncStorage.removeItem(CORRECTIONS_STORAGE_KEY);
    get().refreshCorrectionStats();
  },

  updateKnownVocabulary: (words) => {
    set((state) => {
      if (!state.glyphMap) return state;

      // Track which words we've seen for future hint system
      // This is a simple placeholder — in production, you'd build a vocabulary index
      return state;
    });
  },

  exportGlyphMap: async () => {
    const { glyphMap } = get();
    if (!glyphMap) return "{}";

    // Create a safe export without huge base64 strings if needed
    const exportData = {
      ...glyphMap,
      // Optional: exclude large image data for JSON export
      // glyphs: Object.fromEntries(
      //   Object.entries(glyphMap.glyphs).map(([k, v]) => [
      //     k,
      //     { ...v, glyphImageBase64: "[binary data]" },
      //   ])
      // ),
    };

    return JSON.stringify(exportData, null, 2);
  },

  importGlyphMap: async (jsonData) => {
    try {
      const parsed = JSON.parse(jsonData) as GlyphMap;

      // Validate structure
      if (!parsed.glyphs || typeof parsed.glyphs !== "object") {
        throw new Error("Invalid glyph map structure");
      }

      // Ensure dates are parsed
      if (parsed.lastUpdated) {
        parsed.lastUpdated = new Date(parsed.lastUpdated);
      }
      Object.values(parsed.glyphs).forEach((glyph: any) => {
        if (glyph.lastCorrected) {
          glyph.lastCorrected = new Date(glyph.lastCorrected);
        }
      });

      // Increment version on import
      parsed.version += 1;
      parsed.lastUpdated = new Date();

      set({ glyphMap: parsed });
      await get().saveGlyphMap();
    } catch (error) {
      throw new Error(`Failed to import glyph map: ${String(error)}`);
    }
  },

  refreshCorrectionStats: () => {
    set((state) => {
      const stats = {
        totalCorrections: state.corrections.length,
        correctionsByConfidence: {
          [ConfidenceLevel.HIGH]: 0,
          [ConfidenceLevel.MEDIUM]: 0,
          [ConfidenceLevel.LOW]: 0,
          [ConfidenceLevel.FLAG]: 0,
        },
        lastCorrectionTime:
          state.corrections.length > 0
            ? state.corrections[state.corrections.length - 1].timestamp
            : null,
      };

      state.corrections.forEach((c) => {
        stats.correctionsByConfidence[c.confidence] += 1;
      });

      return { correctionStats: stats };
    });
  },

  getCorrectionStats: () => get().correctionStats,
}));
