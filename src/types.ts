declare global {
  interface Window {
    __MYENGINE_API_BASE_URL__?: string;
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  }
}

export type GeminiModel = 
  | 'Gemini 3.8'
  | 'Gemini 3.1 Pro'
  | 'Gemini 3.7'
  | 'Gemini 3.5'
  | 'Gemini 3 Pro'
  | 'ナノバナナ';

export type SearchCategory = 'all' | 'images' | 'shopping' | 'videos' | 'news' | 'shorts' | 'maps';

export interface SearchFilterState {
  domainBlock: boolean;
  blockedDomains: string[];
  exactTimeRange: boolean;
  timeStart: string;
  timeEnd: string;
  sideBySideCode: boolean;
  programmableOps: {
    minChars: number;
    maxChars: number;
    langVersion: string;
    regexPattern: string;
  };
  pureCleanMode: boolean;
  paywallFilter: 'off' | 'bypass' | 'exclude';
  crossEngine: boolean;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  model: GeminiModel;
  filters: Partial<SearchFilterState>;
  diff?: {
    added: string[];
    removed: string[];
    unchanged: string[];
  };
}

export interface StashedPage {
  id: string;
  title: string;
  url: string;
  snippet: string;
  stashedAt: string;
  category: string;
}

export interface SearchPreset {
  id: string;
  name: string;
  description: string;
  model: GeminiModel;
  filters: SearchFilterState;
  sampleQuery: string;
  createdAt: string;
}

export interface EngineResult {
  engine: string;
  icon: string;
  results: {
    title: string;
    url: string;
    snippet: string;
    extra?: string;
  }[];
}

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture: string;
  hd?: string;
  sub: string;
  isLoggedIn: boolean;
}

export interface StatusMetrics {
  bandwidth: string;
  ping: number;
  domainResponseMs: number;
  ramUsedGb: number;
  ramTotalGb: number;
  usedHeapMb?: number;
  isOnline?: boolean;
  connectionType?: string;
  domNodesCount?: number;
}
