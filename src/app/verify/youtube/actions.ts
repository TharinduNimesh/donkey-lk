'use server'

import { fetchYoutubeChannelInfo } from '@/lib/youtube';

export async function getChannelInfo(url: string) {
  try {
    const channelInfo = await fetchYoutubeChannelInfo(url);
    return { data: channelInfo, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to fetch channel information' 
    };
  }
}