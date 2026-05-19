import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import VideoCard from '../components/VideoCard';
import {VideoItem} from '../types';
import {getSubscriptionFeed} from '../services/youtubeApi';
import {getAccessToken} from '../services/auth';

export default function HomeScreen({navigation}: any) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    try {
      if (!refresh) {
        setLoading(true);
      }
      setError(null);
      const token = await getAccessToken();
      const feed = await getSubscriptionFeed(token);
      setVideos(feed);
    } catch (e: any) {
      setError(e?.message || 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleVideoPress = (v: VideoItem) =>
    navigation.navigate('Video', {videoId: v.id, title: v.title});

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff0000" />
        <Text style={styles.loadingText}>Loading your feed…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={videos}
      keyExtractor={v => v.id}
      renderItem={({item}) => (
        <VideoCard video={item} onPress={handleVideoPress} />
      )}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load(true);
          }}
          tintColor="#ff0000"
        />
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>No videos found.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {flex: 1, backgroundColor: '#0f0f0f'},
  center: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {color: '#888', marginTop: 12, fontSize: 14},
  errorText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#ff0000',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryText: {color: '#fff', fontWeight: '600'},
  emptyText: {color: '#888', textAlign: 'center', padding: 40, fontSize: 15},
});
