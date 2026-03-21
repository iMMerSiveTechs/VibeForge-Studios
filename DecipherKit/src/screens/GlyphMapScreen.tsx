import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GlyphMapEntry } from '../types';
import {
  getGlyphMap,
  removeCorrection,
  exportGlyphMap,
  importGlyphMap,
  clearGlyphMap,
} from '../store/glyph-map-store';

export default function GlyphMapScreen() {
  const [entries, setEntries] = useState<GlyphMapEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const map = await getGlyphMap();
    const sorted = Object.values(map).sort(
      (a, b) => b.frequency - a.frequency,
    );
    setEntries(sorted);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries]),
  );

  const handleDelete = (entry: GlyphMapEntry) => {
    Alert.alert(
      'Remove Correction',
      `Remove "${entry.original}" → "${entry.corrected}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeCorrection(entry.original);
            await loadEntries();
          },
        },
      ],
    );
  };

  const handleExport = async () => {
    try {
      const json = await exportGlyphMap();
      await Share.share({
        message: json,
        title: 'DecipherKit Glyph Map',
      });
    } catch (err) {
      Alert.alert('Export Error', 'Failed to export glyph map.');
      console.error(err);
    }
  };

  const handleImport = () => {
    // In a production app, we'd use a file picker or clipboard.
    // For now, prompt user to paste JSON.
    Alert.prompt?.(
      'Import Glyph Map',
      'Paste the JSON glyph map data:',
      async (text: string) => {
        if (!text) return;
        try {
          const count = await importGlyphMap(text);
          Alert.alert('Imported', `${count} entries imported.`);
          await loadEntries();
        } catch {
          Alert.alert('Error', 'Invalid JSON format.');
        }
      },
    );
  };

  const handleClear = () => {
    Alert.alert(
      'Clear All Corrections',
      'This will remove all learned corrections. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearGlyphMap();
            await loadEntries();
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: GlyphMapEntry }) => (
    <TouchableOpacity
      style={styles.entryCard}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.7}
    >
      <View style={styles.entryContent}>
        <View style={styles.entryMapping}>
          <Text style={styles.originalText}>{item.original}</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.correctedText}>{item.corrected}</Text>
        </View>
        <Text style={styles.frequency}>
          Used {item.frequency}×
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolButton} onPress={handleExport}>
          <Text style={styles.toolButtonText}>📤 Export</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={handleImport}>
          <Text style={styles.toolButtonText}>📥 Import</Text>
        </TouchableOpacity>
        {entries.length > 0 && (
          <TouchableOpacity
            style={[styles.toolButton, styles.dangerButton]}
            onPress={handleClear}
          >
            <Text style={styles.toolButtonText}>🗑 Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {entries.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔤</Text>
          <Text style={styles.emptyText}>No corrections yet</Text>
          <Text style={styles.emptyHint}>
            Transcribe some handwriting and correct any mistakes to build your
            personal glyph map.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.original}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <Text style={styles.hint}>Long-press an entry to remove it</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  toolbar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  toolButton: {
    backgroundColor: '#16213e',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  dangerButton: {
    backgroundColor: '#4a1525',
  },
  toolButtonText: {
    color: '#e0e0ff',
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    padding: 12,
    gap: 8,
  },
  entryCard: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  entryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryMapping: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  originalText: {
    color: '#ff6b6b',
    fontSize: 15,
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  arrow: {
    color: '#666690',
    fontSize: 14,
  },
  correctedText: {
    color: '#a8e6cf',
    fontSize: 15,
    fontWeight: '600',
  },
  frequency: {
    color: '#666690',
    fontSize: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#e0e0ff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyHint: {
    color: '#666690',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  hint: {
    color: '#444466',
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: 16,
  },
});
