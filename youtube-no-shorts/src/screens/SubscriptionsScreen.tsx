import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import {getSubscribedChannels, getChannelVideos} from '../services/youtubeApi';
import {getAccessToken} from '../services/auth';
import VideoCard from '../components/VideoCard';
import {Channel, VideoItem} from '../types';

export default function SubscriptionsScreen({navigation}: any) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selected, setSelected] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        const {channels: ch} = await getSubscribedChannels(token);
        setChannels(ch);
      } catch {
        // silently ignore — user sees empty list
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectChannel = async (ch: Channel) => {
    setSelected(ch);
    setVideoLoading(true);
    setVideos([]);
    try {
      const token = await getAccessToken();
      const vids = await getChannelVideos(token, ch.id);
      setVideos(vids);
    } catch {
      // silently ignore
    } finally {
      setVideoLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff0000" />
      </View>
    );
  }

  if (selected) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => {
            setSelected(null);
            setVideos([]);
          }}>
          {selected.thumbnailUrl ? (
            <Image source={{uri: selected.thumbnailUrl}} style={styles.backAvatar} />
          ) : null}
          <Text style={styles.backText}>{selected.title}</Text>
        </TouchableOpacity>
        {videoLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#ff0000" />
          </View>
        ) : (
          <FlatList
            data={videos}
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
              <Text style={styles.emptyText}>
                No videos (or all were Shorts).
              </Text>
            }
          />
        )}
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={channels}
      keyExtractor={c => c.id}
      renderItem={({item}) => (
        <TouchableOpacity
          style={styles.channelRow}
          onPress={() => selectChannel(item)}>
          {item.thumbnailUrl ? (
            <Image source={{uri: item.thumbnailUrl}} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]} />
          )}
          <Text style={styles.channelName}>{item.title}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No subscriptions found.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0f0f0f'},
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0f0f',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  avatar: {width: 44, height: 44, borderRadius: 22, marginRight: 14},
  avatarFallback: {backgroundColor: '#333'},
  channelName: {flex: 1, color: '#fff', fontSize: 15},
  chevron: {color: '#666', fontSize: 20},
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: '#1a1a1a',
  },
  backAvatar: {width: 32, height: 32, borderRadius: 16, marginRight: 10},
  backText: {color: '#fff', fontSize: 16, fontWeight: '600', flex: 1},
  emptyText: {color: '#888', textAlign: 'center', padding: 40},
});
