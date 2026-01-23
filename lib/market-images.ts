/**
 * Market image utilities
 * Extract relevant images based on market category from question text
 */

// Category placeholder image paths
export const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  twitter: '/images/categories/twitter.svg',
  youtube: '/images/categories/youtube.svg',
  coin: '/images/categories/coin.svg',
  general: '/images/categories/general.svg',
};

/**
 * Extract Twitter/X username from question text
 * Looks for @username patterns or x.com/twitter.com URLs
 */
export function extractTwitterUsername(question: string): string | null {
  const patterns = [
    /@([a-zA-Z0-9_]{1,15})\b/,  // @username
    /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]{1,15})/i,  // URL patterns
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Get Twitter profile image URL using unavatar.io
 */
export function getTwitterImageUrl(username: string): string {
  return `https://unavatar.io/twitter/${username}`;
}

/**
 * Extract YouTube video ID from question text
 */
export function extractYouTubeVideoId(question: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Get YouTube video thumbnail URL
 */
export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Extract token/coin symbol from question text
 * Looks for $SYMBOL patterns or common token names
 */
export function extractTokenSymbol(question: string): string | null {
  const patterns = [
    /\$([A-Z]{2,10})\b/,  // $BTC, $SOL, $ETH
    /\b(BTC|ETH|SOL|USDC|USDT|BONK|JUP|RAY|PYTH|WIF|JTO|ORCA|MNGO|SRM|FIDA|STEP|COPE|MEDIA|OXY|MAPS|PORT|ATLAS|POLIS|SAMO|GRAPE|IN|SLIM|ABR|C98|LDO|MSOL|STSOL|JSOL)\b/i,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }
  return null;
}

/**
 * Get coin/token logo URL
 * Uses GitHub token lists for reliable image sources
 */
export function getCoinImageUrl(symbol: string): string {
  // Map symbols to known token mint addresses (Solana)
  const symbolToMint: Record<string, string> = {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    PYTH: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
    WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    JTO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
    ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  };

  const mint = symbolToMint[symbol];
  if (mint) {
    // Use Solana token list CDN
    return `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${mint}/logo.png`;
  }

  // Fallback: use CryptoCompare for common coins
  return `https://www.cryptocompare.com/media/37746251/${symbol.toLowerCase()}.png`;
}

/**
 * Main function to derive market image URL based on category
 * Returns both a primary image URL (may fail) and a fallback URL
 */
export function getMarketImage(market: {
  category: string;
  question: string;
}): { imageUrl: string | null; fallbackUrl: string } {
  const fallbackUrl = CATEGORY_PLACEHOLDERS[market.category] || CATEGORY_PLACEHOLDERS.general;

  let imageUrl: string | null = null;

  switch (market.category) {
    case 'twitter': {
      const username = extractTwitterUsername(market.question);
      if (username) {
        imageUrl = getTwitterImageUrl(username);
      }
      break;
    }
    case 'youtube': {
      const videoId = extractYouTubeVideoId(market.question);
      if (videoId) {
        imageUrl = getYouTubeThumbnailUrl(videoId);
      }
      break;
    }
    case 'coin': {
      const symbol = extractTokenSymbol(market.question);
      if (symbol) {
        imageUrl = getCoinImageUrl(symbol);
      }
      break;
    }
    default:
      // General category - no specific image extraction
      imageUrl = null;
  }

  return { imageUrl, fallbackUrl };
}
