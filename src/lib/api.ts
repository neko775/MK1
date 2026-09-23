const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const STORAGE_API_KEY = 'myengine_gemini_api_key';

function getRuntimeApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  const runtimeUrl = window.__MYENGINE_API_BASE_URL__?.trim();
  if (runtimeUrl) return runtimeUrl;

  const queryUrl = new URLSearchParams(window.location.search).get('api');
  if (queryUrl?.trim()) return queryUrl.trim();

  const isNative = window.Capacitor?.isNativePlatform?.() === true;
  const isLocalFile = window.location.protocol === 'file:';
  if (isNative || isLocalFile) return 'http://localhost:3000';

  const isRemoteWeb = window.location.protocol.startsWith('http');
  if (isRemoteWeb) return window.location.origin;

  return '';
}

export function apiUrl(path: string): string {
  const baseUrl = getRuntimeApiBaseUrl() || configuredApiBaseUrl;
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function getStoredGeminiApiKey(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(STORAGE_API_KEY)?.trim() || '';
}

export async function generateGeminiFallback(
  prompt: string,
  history: Array<{ sender: 'user' | 'gemini'; text: string }>,
  apiKey: string,
): Promise<string> {
  const contents = [
    ...history.map((message) => ({
      role: message.sender === 'user' ? 'user' : 'model',
      parts: [{ text: message.text }],
    })),
    { role: 'user', parts: [{ text: prompt }] },
  ];
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({ contents }),
    },
  );
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || `Gemini APIエラー (${response.status})`);
  }
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('')
    .trim();
  if (!text) throw new Error('Geminiから回答を取得できませんでした。');
  return text;
}

export async function generateGeminiSearchFallback(query: string): Promise<{
  answer: string;
  searchQueries: string[];
  searchEngines: Array<{ name: string; url: string }>;
}> {
  const apiKey = getStoredGeminiApiKey();
  if (!apiKey) throw new Error('Gemini APIキーが設定されていません。');

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: `「${query}」を日本語で簡潔に調査し、確認できないURLや事実は推測せず、要点をMarkdownで回答してください。` }],
        }],
      }),
    },
  );
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || `Gemini APIエラー (${response.status})`);
  }
  const answer = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('')
    .trim();
  if (!answer) throw new Error('Geminiから検索回答を取得できませんでした。');

  const encodedQuery = encodeURIComponent(query);
  return {
    answer,
    searchQueries: [query],
    searchEngines: [
      { name: 'Google', url: `https://www.google.com/search?q=${encodedQuery}` },
      { name: 'Bing', url: `https://www.bing.com/search?q=${encodedQuery}` },
      { name: 'DuckDuckGo', url: `https://duckduckgo.com/?q=${encodedQuery}` },
      { name: 'Yahoo! JAPAN', url: `https://search.yahoo.co.jp/search?p=${encodedQuery}` },
    ],
  };
}
