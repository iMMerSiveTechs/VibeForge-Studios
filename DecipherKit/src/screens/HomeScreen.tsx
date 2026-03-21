import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getTranscriptionCount } from '../engine/decipher-engine';
import { getGlyphMapSize } from '../store/glyph-map-store';

type RootStackParamList = {
  Camera: undefined;
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [transcriptionCount, setTranscriptionCount] = useState(0);
  const [glyphMapSize, setGlyphMapSize] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        const [count, size] = await Promise.all([
          getTranscriptionCount(),
          getGlyphMapSize(),
        ]);
        if (!cancelled) {
          setTranscriptionCount(count);
          setGlyphMapSize(size);
          setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✒️ DecipherKit</Text>
      <Text style={styles.subtitle}>Handwriting → Text</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6c5ce7" style={styles.loader} />
      ) : (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{transcriptionCount}</Text>
            <Text style={styles.statLabel}>Transcriptions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{glyphMapSize}</Text>
            <Text style={styles.statLabel}>Learned Glyphs</Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.captureButton}
        onPress={() => navigation.navigate('Camera')}
        activeOpacity={0.8}
      >
        <Text style={styles.captureIcon}>📷</Text>
        <Text style={styles.captureText}>Capture Handwriting</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Take a photo of handwritten text or pick one from your gallery.
        DecipherKit will transcribe it and learn from your corrections.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#e0e0ff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0cc',
    marginBottom: 40,
  },
  loader: {
    marginVertical: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  statCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    minWidth: 140,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6c5ce7',
  },
  statLabel: {
    fontSize: 13,
    color: '#a0a0cc',
    marginTop: 4,
  },
  captureButton: {
    backgroundColor: '#6c5ce7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    marginBottom: 32,
  },
  captureIcon: {
    fontSize: 24,
  },
  captureText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  hint: {
    color: '#666690',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});
