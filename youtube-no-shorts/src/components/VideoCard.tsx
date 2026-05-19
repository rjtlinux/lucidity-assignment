import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {VideoItem} from '../types';

const formatViews = (v?: string) => {
  if (!v) {
    return '';
  }
  const n = parseInt(v, 10);
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M views`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(0)}K views`;
  }
  return `${n} views`;
};

const formatDuration = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) {
    return 'Today';
  }
  if (days < 7) {
    return `${days}d ago`;
  }
  if (days < 30) {
    return `${Math.floor(days / 7)}w ago`;
  }
  if (days < 365) {
    return `${Math.floor(days / 30)}mo ago`;
  }
  return `${Math.floor(days / 365)}y ago`;
};

interface Props {
  video: VideoItem;
  onPress: (video: VideoItem) => void;
}

export default function VideoCard({video, onPress}: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(video)}
      activeOpacity={0.8}>
      <View style={styles.thumbContainer}>
        <Image
          source={{uri: video.thumbnailUrl}}
          style={styles.thumb}
          resizeMode="cover"
        />
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>
            {formatDuration(video.durationSeconds)}
          </Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.meta}>
          {video.channelTitle}
          {video.viewCount ? ` · ${formatViews(video.viewCount)}` : ''}
          {` · ${timeAgo(video.publishedAt)}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {marginBottom: 20},
  thumbContainer: {
    position: 'relative',
    aspectRatio: 16 / 9,
    backgroundColor: '#1a1a1a',
  },
  thumb: {width: '100%', height: '100%'},
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  durationText: {color: '#fff', fontSize: 11, fontWeight: '600'},
  info: {padding: 10},
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 4,
  },
  meta: {color: '#aaa', fontSize: 12},
});
