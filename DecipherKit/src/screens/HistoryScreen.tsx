import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getHistory } from '../engine/decipher-engine';
import { TranscriptionResult } from '../types';

type NavParams = {
  Correction: { result: TranscriptionResult };
};

export default function HistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<NavParams>>();
  const [entries, setEntries] = useState<TranscriptionResult[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        const history = await getHistory();
        if (!cancelled) {
          setEntries(history.entries);
          setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const filtered = search.trim()
    ? entries.filter(
        (e) =>
          e.correctedText.toLowerCase().includes(search.toLowerCase()) ||
          e.rawText.toLowerCase().includes(search.toLowerCase()),
      )
    : entries;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: TranscriptionResult }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Correction', { result: item })}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: `data:image/jpeg;base64,${item.imageBase64}` }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.previewText} numberOfLines={2}>
          {item.correctedText}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.date}>{formatDate(item.timestamp)}</Text>
          {item.correctionsApplied > 0 && (
            <Text style={styles.corrections}>
              {item.correctionsApplied} fix{item.correctionsApplied > 1 ? 'es' : ''}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search transcriptions…"
        placeholderTextColor="#666690"
      />

      {filtered.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={styles.emptyText}>
            {search ? 'No matching transcriptions' : 'No transcriptions yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  searchInput: {
    backgroundColor: '#16213e',
    color: '#e0e0ff',
    margin: 12,
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  list: {
    padding: 12,
    gap: 8,
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 8,
  },
  thumbnail: {
    width: 72,
    height: 72,
    backgroundColor: '#0f3460',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  previewText: {
    color: '#e0e0ff',
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    color: '#666690',
    fontSize: 11,
  },
  corrections: {
    color: '#a29bfe',
    fontSize: 11,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    color: '#666690',
    fontSize: 15,
  },
});
