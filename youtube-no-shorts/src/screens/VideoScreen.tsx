import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Video'>;

export default function VideoScreen({route}: Props) {
  const {videoId, title} = route.params;
  const {width} = useWindowDimensions();
  const [playing, setPlaying] = useState(true);

  return (
    <ScrollView style={styles.container} bounces={false}>
      <YoutubePlayer
        height={width * (9 / 16)}
        width={width}
        videoId={videoId}
        play={playing}
        onChangeState={state => {
          if (state === 'ended') {
            setPlaying(false);
          }
        }}
        webViewProps={{
          allowsFullscreenVideo: true,
          mediaPlaybackRequiresUserAction: false,
          androidLayerType: 'hardware',
        }}
        initialPlayerParams={{
          preventFullScreen: false,
          rel: false,
          modestbranding: true,
        }}
      />
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0f0f0f'},
  info: {padding: 16},
  title: {color: '#fff', fontSize: 16, fontWeight: '600', lineHeight: 22},
});
