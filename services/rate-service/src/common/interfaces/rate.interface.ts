export interface Rate {
  bidRate: number;
  askRate: number;
  midRate: number;
  currencyPair: string;
  channelId: string;
  fetchTime: Date;
  validUntil: Date;
}

export interface QuoteLock {
  quoteId: string;
  merchantId: string;
  currencyPair: string;
  rate: number;
  sellCurrency: string;
  sellAmount: number;
  buyCurrency: string;
  buyAmount: number;
  lockedAt: Date;
  expiresAt: Date;
}

export interface RateCalculationResult {
  rate: number;
  sellAmount: number;
  buyAmount: number;
  channelRate: number;
  platformMarkup: number;
  merchantMarkup?: number;
}
