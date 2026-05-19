import {VideoItem, Channel} from '../types';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

const parseDuration = (iso: string): number => {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) {
    return 0;
  }
  return (
    parseInt(m[1] || '0', 10) * 3600 +
    parseInt(m[2] || '0', 10) * 60 +
    parseInt(m[3] || '0', 10)
  );
};

const isShort = (v: Pick<VideoItem, 'durationSeconds' | 'title' | 'description'>): boolean => {
  if (v.durationSeconds > 0 && v.durationSeconds <= 60) {
    return true;
  }
  return /\#shorts?\b/i.test(v.title + ' ' + v.description);
};

const yt = async (
  path: string,
  params: Record<string, string>,
  token: string,
) => {
  const url = `${BASE_URL}/${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, {
    headers: {Authorization: `Bearer ${token}`},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as any)?.error?.message || `YouTube API error: HTTP ${res.status}`,
    );
  }
  return res.json();
};

const getVideoDetails = async (
  token: string,
  ids: string[],
): Promise<VideoItem[]> => {
  if (!ids.length) {
    return [];
  }
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 50) {
    chunks.push(ids.slice(i, i + 50));
  }
  const results = await Promise.all(
    chunks.map(chunk =>
      yt(
        'videos',
        {part: 'snippet,contentDetails,statistics', id: chunk.join(',')},
        token,
      ),
    ),
  );
  return results
    .flatMap((d: any) => d.items || [])
    .map((v: any): VideoItem => ({
      id: v.id,
      title: v.snippet.title,
      description: v.snippet.description || '',
      thumbnailUrl:
        v.snippet.thumbnails?.maxres?.url ||
        v.snippet.thumbnails?.high?.url ||
        v.snippet.thumbnails?.default?.url ||
        '',
      channelTitle: v.snippet.channelTitle,
      channelId: v.snippet.channelId,
      publishedAt: v.snippet.publishedAt,
      duration: v.contentDetails.duration,
      durationSeconds: parseDuration(v.contentDetails.duration),
      viewCount: v.statistics?.viewCount,
    }))
    .filter((v: VideoItem) => !isShort(v));
};

export const getSubscribedChannels = async (
  token: string,
): Promise<{channels: Channel[]; nextPageToken?: string}> => {
  const subData = await yt(
    'subscriptions',
    {part: 'snippet', mine: 'true', maxResults: '50', order: 'alphabetical'},
    token,
  );

  const channelIds: string[] = (subData.items || []).map(
    (i: any) => i.snippet.resourceId.channelId,
  );
  if (!channelIds.length) {
    return {channels: []};
  }

  const chanData = await yt(
    'channels',
    {part: 'contentDetails,snippet', id: channelIds.join(',')},
    token,
  );

  const channels: Channel[] = (chanData.items || []).map((c: any) => ({
    id: c.id,
    title: c.snippet.title,
    thumbnailUrl: c.snippet.thumbnails?.default?.url || '',
    uploadsPlaylistId: c.contentDetails.relatedPlaylists.uploads,
  }));

  return {channels, nextPageToken: subData.nextPageToken};
};

export const getSubscriptionFeed = async (token: string): Promise<VideoItem[]> => {
  const {channels} = await getSubscribedChannels(token);
  // Limit to 20 channels to stay within API quota (each channel = 1 quota unit for playlistItems)
  const selected = channels.slice(0, 20);

  const videoIdSets = await Promise.all(
    selected.map(async ch => {
      try {
        const d = await yt(
          'playlistItems',
          {
            part: 'contentDetails',
            playlistId: ch.uploadsPlaylistId,
            maxResults: '6',
          },
          token,
        );
        return (d.items || []).map((i: any) => i.contentDetails.videoId);
      } catch {
        return [];
      }
    }),
  );

  const allIds = [...new Set(videoIdSets.flat())] as string[];
  const videos = await getVideoDetails(token, allIds);
  return videos.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
};

export const searchVideos = async (
  token: string,
  q: string,
): Promise<VideoItem[]> => {
  const data = await yt(
    'search',
    {part: 'snippet', q, type: 'video', maxResults: '50'},
    token,
  );
  const ids = (data.items || []).map((i: any) => i.id.videoId);
  return getVideoDetails(token, ids);
};

export const getChannelVideos = async (
  token: string,
  channelId: string,
): Promise<VideoItem[]> => {
  const chanData = await yt(
    'channels',
    {part: 'contentDetails', id: channelId},
    token,
  );
  const uploadsId =
    chanData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) {
    return [];
  }
  const playlistData = await yt(
    'playlistItems',
    {part: 'contentDetails', playlistId: uploadsId, maxResults: '50'},
    token,
  );
  const ids = (playlistData.items || []).map(
    (i: any) => i.contentDetails.videoId,
  );
  return getVideoDetails(token, ids);
};
