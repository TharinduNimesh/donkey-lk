import * as cheerio from 'cheerio';

interface YoutubeChannelInfo {
  title: string;
  subscribers: string;
  thumbnail: string | null;
  description: string;
}

export async function fetchYoutubeChannelInfo(url: string): Promise<YoutubeChannelInfo> {
  try {
    const channelId = extractChannelId(url);

    // Use desktop Chrome user agent
    const response = await fetch(`https://www.youtube.com/${channelId}/about`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch channel. Status:', response.status);
      throw new Error('Failed to fetch channel information');
    }

    const html = await response.text();

    const $ = cheerio.load(html);

    // Extract channel information using multiple fallback selectors
    const title = $('meta[property="og:title"]').attr('content') || 
                 $('title').text().replace(' - YouTube', '') ||
                 '';
                 
    const thumbnail = $('meta[property="og:image"]').attr('content') || null;

    const description = $('meta[property="og:description"]').attr('content') || '';
    
    // Try multiple selectors for subscriber count
    let subscriberText = '';
    
    // Common YouTube subscriber count selectors
    const possibleSelectors = [
      '[itemprop="subscriberCount"]',
      '#subscriber-count',
      '#subscribers',
      'yt-formatted-string[id="subscriber-count"]',
      '.ytd-c4-tabbed-header-renderer',
      '#meta-contents yt-formatted-string',
      '#channel-header-container yt-formatted-string'
    ];

    // Try each selector
    for (const selector of possibleSelectors) {
      const element = $(selector);
      if (element.length) {
        const text = element.text().trim();
        if (text) {
          subscriberText = text;
          break;
        }
      }
    }

    // If no luck with selectors, try searching in text content
    if (!subscriberText) {
      // Try extracting from any text containing subscriber information
      const scriptTags = $('script').map((i, el) => $(el).html()).get();
      
      for (const script of scriptTags) {
        if (!script) continue;
        
        // Look for subscriber count in YouTube's initial data
        if (script.includes('subscriberCountText')) {
          const match = script.match(/"subscriberCountText":\s*{"simpleText":\s*"([^"]+)"/);
          if (match && match[1]) {
            subscriberText = match[1];
            break;
          }
        }
      }

      // If still no luck, try finding it in any text content
      if (!subscriberText) {
        const pageText = $('body').text();
        const patterns = [
          /(\d+(?:\.\d+)?[KMB]?) subscribers?/i,
          /(\d+(?:,\d{3})*) subscribers?/i,
          /subscribers?[:\s]+(\d+(?:,\d{3})*)/i,
          /subscribers?[:\s]+(\d+(?:\.\d+)?[KMB]?)/i
        ];

        for (const pattern of patterns) {
          const match = pageText.match(pattern);
          if (match && match[1]) {
            subscriberText = match[1];
            break;
          }
        }
      }
    }

    const subscribers = parseAndFormatSubscriberCount(subscriberText || '0');

    const result = {
      title,
      subscribers,
      thumbnail,
      description
    };
    return result;

  } catch (error) {
    console.error('❌ Error fetching YouTube channel:', error);
    throw new Error('Failed to fetch channel information');
  }
}

function extractChannelId(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    if (path.includes('/channel/')) {
      return path;
    } else if (path.includes('/c/') || path.includes('/user/')) {
      return path;
    } else if (path.includes('@')) {
      return path;
    }

    throw new Error('Invalid YouTube channel URL');
  } catch (error) {
    throw new Error('Invalid URL format');
  }
}

function parseAndFormatSubscriberCount(text: string): string {
  // Remove any commas and spaces
  text = text.replace(/,|\s/g, '');
  
  // Extract number and suffix
  const match = text.match(/^(\d+\.?\d*)(K|M|B)?$/i);
  if (!match) return '0';

  const [, num, suffix = ''] = match;
  const number = parseFloat(num);

  // Convert to actual number based on suffix
  let actualNumber = number;
  switch (suffix.toUpperCase()) {
    case 'K':
      actualNumber = number * 1000;
      break;
    case 'M':
      actualNumber = number * 1000000;
      break;
    case 'B':
      actualNumber = number * 1000000000;
      break;
  }

  // Format the number back to user-friendly format
  if (actualNumber >= 1000000000) {
    return `${(actualNumber / 1000000000).toFixed(1)}B`;
  }
  if (actualNumber >= 1000000) {
    return `${(actualNumber / 1000000).toFixed(1)}M`;
  }
  if (actualNumber >= 1000) {
    return `${(actualNumber / 1000).toFixed(1)}K`;
  }
  return actualNumber.toString();
}