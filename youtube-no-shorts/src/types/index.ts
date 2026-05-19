export interface VideoItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  duration: string;
  durationSeconds: number;
  viewCount?: string;
}

export interface Channel {
  id: string;
  title: string;
  thumbnailUrl: string;
  uploadsPlaylistId: string;
}

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Video: {videoId: string; title: string};
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Subscriptions: undefined;
};
