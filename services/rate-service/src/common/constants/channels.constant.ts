export enum Channel {
  PHP = 'PHP',
  BOCHK = 'BOCHK',
  LEPTAGE = 'LEPTAGE',
}

export const CHANNEL_NAMES = Object.values(Channel);

export const CACHE_KEYS = {
  CHANNEL_RATE: (channelId: string, currencyPair: string) =>
    `channel_rate:${channelId}:${currencyPair}`,
  QUOTE_LOCK: (quoteId: string) => `quote_lock:${quoteId}`,
  PLATFORM_CONFIG: (channelId: string, currencyPair: string) =>
    `platform_config:${channelId}:${currencyPair}`,
  MERCHANT_CONFIG: (merchantId: string, currencyPair: string) =>
    `merchant_config:${merchantId}:${currencyPair}`,
} as const;

export const CACHE_TTL = {
  CHANNEL_RATE: 300, // 5 minutes
  QUOTE_LOCK: 30, // 30 seconds
  PLATFORM_CONFIG: 3600, // 1 hour
  MERCHANT_CONFIG: 3600, // 1 hour
} as const;
