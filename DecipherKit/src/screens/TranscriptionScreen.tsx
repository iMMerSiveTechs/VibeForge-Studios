import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { transcribeImage } from '../engine/decipher-engine';
import { TranscriptionResult } from '../types';

type RouteParams = {
  Transcription: { imageBase64: string };
};

type NavParams = {
  Correction: { result: TranscriptionResult };
};

export default function TranscriptionScreen() {
  const route = useRoute<RouteProp<RouteParams, 'Transcription'>>();
  const navigation = useNavigation<NativeStackNavigationProp<NavParams>>();
  const { imageBase64 } = route.params;

  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const transcription = await transcribeImage(imageBase64);
        if (!cancelled) {
          setResult(transcription);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Transcription failed';
          setError(message);
          Alert.alert('Transcription Error', message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageBase64]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6c5ce7" />
        <Text style={styles.loadingText}>Transcribing handwriting…</Text>
        <Text style={styles.loadingHint}>This may take a few seconds</Text>
      </View>
    );
  }

  if (error || !result) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>❌ {error ?? 'Unknown error'}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Image
        source={{ uri: `data:image/jpeg;base64,${imageBase64}` }}
        style={styles.preview}
        resizeMode="contain"
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transcribed Text</Text>
        {result.correctionsApplied > 0 && (
          <Text style={styles.badge}>
            ✨ {result.correctionsApplied} glyph correction
            {result.correctionsApplied > 1 ? 's' : ''} applied
          </Text>
        )}
        <Text style={styles.transcribedText} selectable>
          {result.correctedText}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Correction', { result })}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>✏️ Correct & Teach</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: '#e0e0ff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingHint: {
    color: '#666690',
    fontSize: 13,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
  },
  preview: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: '#16213e',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#6c5ce7',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  badge: {
    color: '#a29bfe',
    fontSize: 12,
    marginBottom: 8,
  },
  transcribedText: {
    color: '#e0e0ff',
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
