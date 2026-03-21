import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { TranscriptionResult } from '../types';
import { addCorrection } from '../store/glyph-map-store';

type RouteParams = {
  Correction: { result: TranscriptionResult };
};

interface WordItem {
  index: number;
  original: string;
  corrected: string | null;
}

export default function CorrectionScreen() {
  const route = useRoute<RouteProp<RouteParams, 'Correction'>>();
  const navigation = useNavigation();
  const { result } = route.params;

  const words = result.correctedText.split(/(\s+)/);
  const [wordItems] = useState<WordItem[]>(
    words
      .filter((w) => w.trim().length > 0)
      .map((w, i) => ({ index: i, original: w, corrected: null })),
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctionInput, setCorrectionInput] = useState('');
  const [savedCount, setSavedCount] = useState(0);

  const handleWordTap = (index: number) => {
    setSelectedIndex(index);
    setCorrectionInput(wordItems[index].original);
  };

  const handleSaveCorrection = async () => {
    if (selectedIndex === null) return;
    const word = wordItems[selectedIndex];
    const corrected = correctionInput.trim();

    if (!corrected) {
      Alert.alert('Empty correction', 'Please enter the correct text.');
      return;
    }

    if (corrected.toLowerCase() === word.original.toLowerCase()) {
      setSelectedIndex(null);
      setCorrectionInput('');
      return;
    }

    try {
      await addCorrection(word.original, corrected);
      word.corrected = corrected;
      setSavedCount((c) => c + 1);
      setSelectedIndex(null);
      setCorrectionInput('');
    } catch (err) {
      Alert.alert('Error', 'Failed to save correction.');
      console.error(err);
    }
  };

  const handleDone = () => {
    if (savedCount > 0) {
      Alert.alert(
        'Corrections Saved',
        `${savedCount} correction${savedCount > 1 ? 's' : ''} added to your glyph map.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.instructions}>
          Tap any word to correct it. Each correction teaches DecipherKit your
          handwriting style.
        </Text>

        <View style={styles.wordCloud}>
          {wordItems.map((item, i) => {
            const isSelected = selectedIndex === i;
            const isCorrected = item.corrected !== null;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.wordChip,
                  isSelected && styles.wordChipSelected,
                  isCorrected && styles.wordChipCorrected,
                ]}
                onPress={() => handleWordTap(i)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.wordText,
                    isSelected && styles.wordTextSelected,
                    isCorrected && styles.wordTextCorrected,
                  ]}
                >
                  {isCorrected ? item.corrected : item.original}
                </Text>
                {isCorrected && (
                  <Text style={styles.correctedBadge}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedIndex !== null && (
          <View style={styles.editArea}>
            <Text style={styles.editLabel}>
              Original: "{wordItems[selectedIndex].original}"
            </Text>
            <TextInput
              style={styles.textInput}
              value={correctionInput}
              onChangeText={setCorrectionInput}
              placeholder="Type correct text…"
              placeholderTextColor="#666690"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveCorrection}
            />
            <View style={styles.editButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setSelectedIndex(null);
                  setCorrectionInput('');
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveCorrection}
              >
                <Text style={styles.saveText}>Save Correction</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {savedCount > 0 && (
          <Text style={styles.savedBadge}>
            {savedCount} correction{savedCount > 1 ? 's' : ''} saved
          </Text>
        )}
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  instructions: {
    color: '#a0a0cc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  wordCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  wordChip: {
    backgroundColor: '#16213e',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wordChipSelected: {
    backgroundColor: '#6c5ce7',
    borderWidth: 2,
    borderColor: '#a29bfe',
  },
  wordChipCorrected: {
    backgroundColor: '#1e5631',
  },
  wordText: {
    color: '#e0e0ff',
    fontSize: 15,
  },
  wordTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  wordTextCorrected: {
    color: '#a8e6cf',
  },
  correctedBadge: {
    color: '#a8e6cf',
    fontSize: 12,
    fontWeight: '700',
  },
  editArea: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  editLabel: {
    color: '#a0a0cc',
    fontSize: 13,
  },
  textInput: {
    backgroundColor: '#0f3460',
    color: '#e0e0ff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#6c5ce7',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: '#666690',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#16213e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  savedBadge: {
    color: '#a8e6cf',
    fontSize: 13,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  doneText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
