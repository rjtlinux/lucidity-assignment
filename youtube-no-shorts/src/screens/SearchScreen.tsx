import React, {useCallback, useState} from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import VideoCard from '../components/VideoCard';
import {VideoItem} from '../types';
import {searchVideos} from '../services/youtubeApi';
import {getAccessToken} from '../services/auth';

export default function SearchScreen({navigation}: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      return;
    }
    setLoading(true);
    setSearched(true);
    setError(null);
    try {
      const token = await getAccessToken();
      const videos = await searchVideos(token, query.trim());
      setResults(videos);
    } catch (e: any) {
      setError(e?.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          placeholder="Search videos..."
          placeholderTextColor="#555"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>🔍</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ff0000" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={v => v.id}
          renderItem={({item}) => (
            <VideoCard
              video={item}
              onPress={v =>
                navigation.navigate('Video', {videoId: v.id, title: v.title})
              }
            />
          )}
          ListEmptyComponent={
            searched ? (
              <Text style={styles.emptyText}>
                No results. Shorts are filtered out automatically.
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0f0f0f'},
  searchRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchBtn: {
    backgroundColor: '#1a1a1a',
    width: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  searchBtnText: {fontSize: 20},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20},
  errorText: {color: '#ff6666', textAlign: 'center'},
  emptyText: {color: '#888', textAlign: 'center', padding: 40, fontSize: 14},
});
