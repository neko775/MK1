import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const runtimeVersion = Date.now().toString();
const requestWindows = new Map<string, { startedAt: number; count: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_IP = 60;

app.use(express.json({ limit: '15mb' }));

app.use('/api/', (req, res, next) => {
  const now = Date.now();
  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : req.ip || 'unknown';
  const current = requestWindows.get(clientIp);
  const windowState = !current || now - current.startedAt >= RATE_WINDOW_MS
    ? { startedAt: now, count: 0 }
    : current;

  windowState.count += 1;
  requestWindows.set(clientIp, windowState);
  if (windowState.count > RATE_LIMIT_PER_IP) {
    res.setHeader('Retry-After', '60');
    res.status(429).json({ error: 'リクエストが多すぎます。しばらく待ってから再試行してください。' });
    return;
  }
  next();
});

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.get('/api/version', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ version: runtimeVersion });
});

// Helper: Get active GoogleGenAI client (Prioritizes User-Provided API Key from headers/body, then fallback to env)
function getGenAIClient(req: express.Request): { client: GoogleGenAI | null; isUserKey: boolean } {
  const userHeaderKey = (req.headers['x-gemini-api-key'] as string) || '';
  const userBodyKey = (req.body?.userApiKey as string) || (req.body?.apiKey as string) || '';
  const candidateKey = (userHeaderKey || userBodyKey || '').trim();

  if (candidateKey && candidateKey.length > 20) {
    return {
      client: new GoogleGenAI({
        apiKey: candidateKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      }),
      isUserKey: true,
    };
  }

  const envKey = (process.env.GEMINI_API_KEY || '').trim();
  if (envKey) {
    return {
      client: new GoogleGenAI({
        apiKey: envKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      }),
      isUserKey: false,
    };
  }

  return { client: null, isUserKey: false };
}

// 1. Health & Gemini Status Check Endpoint
app.get('/api/gemini/status', (req, res) => {
  const { client, isUserKey } = getGenAIClient(req);
  res.json({
    available: !!client,
    isUserKey,
    model: 'gemini-3.8-flash',
    message: client
      ? isUserKey
        ? 'ユーザー登録されたGemini APIキーが有効です'
        : 'システム共有Gemini APIが待機中です'
      : 'Gemini APIキーが未設定です。キーを入力してご利用ください。',
  });
});

// 2. Validate User Gemini API Key
app.post('/api/gemini/validate-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    const keyToTest = (apiKey || '').trim();

    if (!keyToTest) {
      res.status(400).json({
        valid: false,
        error: 'APIキーが入力されていません。',
      });
      return;
    }

    if (!keyToTest.startsWith('AIza') || keyToTest.length < 30) {
      res.status(400).json({
        valid: false,
        error: '無効なAPIキー形式です。「AIza...」で始まるGoogle AI StudioのAPIキーを入力してください。',
      });
      return;
    }

    // Perform a lightweight verification call with gemini-3.1-flash-lite
    const testClient = new GoogleGenAI({
      apiKey: keyToTest,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const testResponse = await testClient.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: 'Ping',
    });

    if (testResponse) {
      res.json({
        valid: true,
        message: '認証成功！Google Gemini APIとの接続が確認されました。',
      });
    } else {
      res.json({
        valid: true,
        message: 'APIキーの形式が正常に認識されました。',
      });
    }
  } catch (error: any) {
    console.warn('API Key Validation Error:', error?.message);
    const errorMsg = error?.message || 'APIキーの認証に失敗しました。';
    if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('400')) {
      res.status(400).json({
        valid: false,
        error: 'APIキーが無効です。Google AI Studioから取得した正しいキーを入力してください。',
      });
    } else if (errorMsg.includes('503') || errorMsg.includes('overloaded') || errorMsg.includes('quota')) {
      // Key is valid, but Google endpoint is currently busy
      res.json({
        valid: true,
        message: 'APIキーは認識されました（Google側一時混雑中のため自動フォールバックが適用されます）。',
      });
    } else {
      res.status(400).json({
        valid: false,
        error: `検証エラー: ${errorMsg}`,
      });
    }
  }
});

// 3. Real Gemini Chat & Reasoning Endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const {
      prompt,
      history = [],
      model = 'gemini-3.8-flash',
      systemInstruction,
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.length > 12_000) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    if (!['Gemini 3.8', 'Gemini 3.1 Pro', 'Gemini 3.7', 'Gemini 3.5', 'Gemini 3 Pro', 'ナノバナナ', 'Gemini RPA'].includes(model)) {
      res.status(400).json({ error: 'サポートされていないGeminiモデルです。' });
      return;
    }
    res.setTimeout(45_000);

    const { client, isUserKey } = getGenAIClient(req);

    if (!client) {
      res.status(400).json({
        error: 'Gemini APIキーが設定されていません。右上の「APIキー設定」からご自身のGoogle AI Studio APIキーを入力してください。',
        needApiKey: true,
        success: false,
      });
      return;
    }

    // Map requested model label to supported SDK model aliases
    let targetModel = 'gemini-3.8-flash';
    if (model === 'Gemini RPA') {
      targetModel = 'gemini-3.1-pro-preview';
    } else if (model.includes('3.1') || model.includes('Pro') || model.includes('pro')) {
      targetModel = 'gemini-3.1-pro-preview';
    } else if (model.includes('lite') || model.includes('ナノバナナ')) {
      targetModel = 'gemini-3.1-flash-lite';
    } else if (model.includes('3.8')) {
      targetModel = 'gemini-3.8-flash';
    }

    // Format conversational contents for multi-turn chat
    const contents: any[] = [];

    if (Array.isArray(history) && history.length > 0) {
      for (const item of history) {
        if (!item.text) continue;
        contents.push({
          role: item.sender === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }],
        });
      }
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const MYENGINE_SYSTEM_PROMPT = `あなたはSafariのような洗練されたUIを持つ次世代検索エンジン「MyEngine」のコアとして機能する自律型検索エージェント（Autonomous Search Agent）です。ユーザーの検索クエリに対し、以下の厳格なルールに従って、直接的かつノイズのない高品質な検索結果をマークダウン形式で生成してください。

## 1. コア・ディレクティブ（基本原則）
* **ダイレクト・オーセンティック・ルーティング**: 検索エンジンのリレーURLを避け、一次情報源への直接URLを優先して提供してください。技術関連はMDNやGitHub、ゲームはSteam、動画はABEMAやTVer、YouTubeなどの公式プラットフォームを直接提示します。
* **Pure Clean Mode（ピュアクリーンモード）**: ユーザーが情報を迅速に吸収できるよう、不要な前置きや冗長な説明を省き、事実とデータのみを抽出したノイズレスな結果を出力してください。
* **厳格なドメインブロック**: SEOスパム、コンテンツファーム（例: sejuku.net, curation-matome.jp）、および低品質なまとめサイトからの情報は完全に除外してください。
* **1GB Mega Data Mode（メガデータモード）**: 大量のデータや構造化レコードが求められるクエリ（学術、データセットなど）では、JSONエンドポイント仕様や、トレンド分析を含む高密度のデータセット抽出をシミュレートして出力してください。

## 2. 出力フォーマット（マークダウン構造）
* **Executive Summary（概要）**: 検索クエリに対する直接的な回答と要約。
* **Structured Specifications（構造化データ/仕様）**: 関連する技術スタック、バージョン、一次ソースのドメイン情報。
* **Raw Code & Data Dumps（コード・データ）**: プログラミング関連のクエリの場合、正規表現や指定された言語バージョン（例: TypeScript 7.0 / Node.js 22）に基づく検証済みのコードスニペットと引用元。
* **People Also Ask（関連質問）**: クエリの意図を拡張する2〜3の関連検索キーワードや追加の質問。

## 3. カテゴリ別適応ルール
* **Tech/Programming**: Stack Overflow、npm、PyPI、IETF RFC、W3Cなどの公式ドキュメントやリポジトリを最優先。
* **Videos/Shorts**: YouTube、ABEMA、TVer、NicoNicoなどの公式ストリーミングメディアにフォーカス。
* **Academic/News**: arXiv、J-STAGE、Google News（Reuters等）などの権威ある情報源から抽出。
* **Weather**: 気象庁（JMA）やtenki.jpなどの直接気象ポータルから構成。`;

    const defaultSysInstruction = systemInstruction || MYENGINE_SYSTEM_PROMPT;

    let textOutput = '';
    let usedModel = targetModel;

    // Attempt 1: Requested model
    try {
      const response = await client.models.generateContent({
        model: targetModel,
        contents,
        config: {
          systemInstruction: defaultSysInstruction,
        },
      });
      if (response.text) {
        textOutput = response.text;
      }
    } catch (err1: any) {
      console.warn(`Primary model (${targetModel}) call failed, trying fallback:`, err1?.message);

      // Attempt 2: Fallback to lightweight gemini-3.1-flash-lite
      try {
        const fallbackRes = await client.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents,
          config: {
            systemInstruction: defaultSysInstruction,
          },
        });
        if (fallbackRes.text) {
          textOutput = fallbackRes.text;
          usedModel = 'gemini-3.1-flash-lite';
        }
      } catch (err2: any) {
        console.warn('Fallback model call failed:', err2?.message);
      }
    }

    let isFallback = false;

    if (!textOutput) {
      isFallback = true;
      // Graceful high-utility synthesized response if upstream is temporarily 503 / 429
      textOutput = `### 回答概要
「${prompt.slice(0, 100)}」についてのご質問を受け付けました。

現在、Google側のAPI一時的混雑（503/429）が発生しているか、共有クォータが上限に達しています。
**右上の「🔑 APIキー設定」からご自身のGoogle AI Studio無料APIキーを登録**していただくと、クォータ制限を受けずにいつでも最優先で快適にAIと会話・直接検索が可能です。`;
    }

    res.json({
      reply: textOutput,
      model: usedModel,
      isUserKey,
      isFallback,
      success: !isFallback,
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({
      error: error?.message || 'Gemini APIの呼び出し中にエラーが発生しました',
      success: false,
    });
  }
});

// 4. Direct AI Search with Google Search Grounding & Resilient Fallback Chain
app.post('/api/search/direct', async (req, res) => {
  try {
    const { query, category = 'all' } = req.body;

    if (!query || typeof query !== 'string' || query.length > 500) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    if (!['all', 'images', 'shopping', 'videos', 'news', 'shorts', 'maps'].includes(category)) {
      res.status(400).json({ error: 'サポートされていない検索カテゴリです。' });
      return;
    }
    res.setTimeout(45_000);

    const { client, isUserKey } = getGenAIClient(req);

    // Tailor the search grounding prompt based on category
    let categoryDirective = '';
    if (category === 'news') {
      categoryDirective = '最新ニュース・時事・報道情報に特化し、報道日時や各社の見解を整理してください。';
    } else if (category === 'shopping') {
      categoryDirective = '商品比較・価格帯・主なスペック・ユーザーの評価や選び方のポイントを重視して整理してください。';
    } else if (category === 'videos') {
      categoryDirective = '関連する動画コンテンツ、解説チュートリアル、配信情報や見どころを整理してください。';
    } else if (category === 'images') {
      categoryDirective = '視覚的特徴、デザイン、図解、外観に関する情報やギャラリーの解説を重視してください。';
    }

    const searchPrompt = `あなたはSafariのような洗練されたUIを持つ次世代検索エンジン「MyEngine」のコアとして機能する自律型検索エージェント（Autonomous Search Agent）です。
ユーザーの検索クエリに対し、以下の厳格なルールに従って、直接的かつノイズのない高品質な検索結果をマークダウン形式で生成してください。

## 1. コア・ディレクティブ（基本原則）
* **ダイレクト・オーセンティック・ルーティング**: 検索エンジンのリレーURLを避け、一次情報源への直接URLを優先。技術関連はMDNやGitHub、ゲームはSteam、動画はABEMAやTVer、YouTubeなどの公式プラットフォームを直接提示。
* **Pure Clean Mode（ピュアクリーンモード）**: 不要な前置きや冗長な説明を省き、事実とデータのみを抽出したノイズレスな結果を出力。
* **厳格なドメインブロック**: SEOスパム、コンテンツファーム（例: sejuku.net, curation-matome.jp）、および低品質なまとめサイトからの情報は完全に除外。
* **事実優先**: 検索で確認できないURL、サムネイル、価格、ニュース本文、統計値を生成・推測しない。確認できた情報だけを回答する。

検索クエリ: 「${query}」
指定カテゴリ: ${category}
${categoryDirective}

## 2. 出力フォーマット（マークダウン構造）
必ず以下のMarkdownセクション構成で出力してください:
### Executive Summary
(検索クエリに対する直接的でノイズのない回答と要約)

### Structured Specifications
(関連する技術スタック、バージョン、一次ソースのドメイン情報やメタデータ仕様)

### Raw Code & Data Dumps
(プログラミング・技術クエリの場合は検証済みのコードスニペットや正規表現、その他のクエリの場合は高密度データテーブルやJSON構造)

### People Also Ask
(クエリの意図を拡張する2〜3の関連質問や検索キーワード)`;

    let answerText = '';
    let webSources: any[] = [];
    let webSearchQueries: string[] = [];

    if (client) {
      // Attempt 1: Gemini 3.8 Flash with Search Grounding
      try {
        const response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: searchPrompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        if (response.text) {
          answerText = response.text;
          const groundingChunks =
            response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          webSearchQueries =
            response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

          webSources = groundingChunks
            .map((chunk: any, index: number) => {
              if (!chunk.web) return null;
              const uri = chunk.web.uri || '';
              const title = chunk.web.title || `情報ソース ${index + 1}`;
              let domain = '';
              try {
                domain = new URL(uri).hostname.replace('www.', '');
              } catch {
                domain = 'web';
              }
              return {
                id: `grounded-${index}-${Date.now()}`,
                title,
                url: uri,
                domain,
                snippet: `一次情報源 (${domain}) から取得したリアルタイムWeb検索ソース`,
              };
            })
            .filter(Boolean);
        }
      } catch (err1: any) {
        console.warn('Search Grounding attempt failed, trying standard model:', err1?.message);

        // Attempt 2: Try without tools
        try {
          const response = await client.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: searchPrompt,
          });
          if (response.text) {
            answerText = response.text;
          }
        } catch (err2: any) {
          console.warn('Flash lite fallback failed:', err2?.message);
        }
      }
    }

    // Only show sources confirmed by Search Grounding. Synthetic directory entries
    // are intentionally excluded because they can look relevant while being unrelated.
    const finalSources = webSources.slice(0, 10);

    let isFallback = false;
    if (!answerText) {
      isFallback = true;
      answerText = isUserKey
        ? 'AI検索から確認できるソースを取得できませんでした。下の検索エンジンリンクから同じ検索語を確認してください。'
        : 'Gemini APIキーが未設定のためAI回答は利用できません。下の検索エンジンリンクから同じ検索語を確認するか、AIキーを設定してください。';
    }

    res.json({
      success: !isFallback,
      query,
      answer: answerText,
      sources: finalSources,
      searchQueries: webSearchQueries.length > 0 ? webSearchQueries : [query],
      searchEngines: [
        { name: 'Google', url: `https://www.google.com/search?q=${encodeURIComponent(query)}` },
        { name: 'Bing', url: `https://www.bing.com/search?q=${encodeURIComponent(query)}` },
        { name: 'DuckDuckGo', url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}` },
        { name: 'Yahoo! JAPAN', url: `https://search.yahoo.co.jp/search?p=${encodeURIComponent(query)}` },
        { name: 'X', url: `https://x.com/search?q=${encodeURIComponent(query)}` },
        { name: 'YouTube', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` },
        { name: 'TikTok', url: `https://www.tiktok.com/search?q=${encodeURIComponent(query)}` },
        { name: 'Instagram', url: `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(query)}` },
        { name: 'Facebook', url: `https://www.facebook.com/search/top?q=${encodeURIComponent(query)}` },
        { name: 'Reddit', url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}` },
        { name: 'Threads', url: `https://www.threads.net/search?q=${encodeURIComponent(query)}` },
        { name: 'LinkedIn', url: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(query)}` },
        { name: 'Pinterest', url: `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}` },
        { name: 'Bluesky', url: `https://bsky.app/search?q=${encodeURIComponent(query)}` },
      ],
      isUserKey,
      isFallback,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Direct Search Error:', error);
    res.status(500).json({
      error: error?.message || '検索処理中にエラーが発生しました',
      success: false,
    });
  }
});

// Blacklisted low-quality domains and SEO spam/content farms
const BLOCKED_DOMAINS = [
  'sejuku.net',
  'curation-matome.jp',
  'matome.naver.jp',
  'matome-hub.com',
  'curation-feed.net',
  'summary-news.xyz',
  'affiliate-scraping.biz',
];

// Helper: Generates direct, authentic web destinations (NOT search engine relays!)
function generateDirectWebSources(query: string, category: string) {
  const q = query.trim().toLowerCase();
  const rawSources: any[] = [];

  // Tech / Programming Queries -> Stack Overflow, npm, PyPI, MDN, GitHub, IETF RFC, W3C
  if (
    category === 'tech' ||
    q.includes('react') ||
    q.includes('javascript') ||
    q.includes('typescript') ||
    q.includes('python') ||
    q.includes('github') ||
    q.includes('npm') ||
    q.includes('pypi') ||
    q.includes('api') ||
    q.includes('css') ||
    q.includes('html') ||
    q.includes('node') ||
    q.includes('sql')
  ) {
    rawSources.push(
      {
        id: 'src-mdn-direct',
        title: 'MDN Web Docs (公式日本語ドキュメント)',
        url: `https://developer.mozilla.org/ja/search?q=${encodeURIComponent(query)}`,
        domain: 'developer.mozilla.org',
        snippet: 'Web技術（JavaScript, TypeScript, Web API, HTML, CSS）の公式リファレンスと仕様解説。',
      },
      {
        id: 'src-github-direct',
        title: `GitHub | 「${query}」公式リポジトリ＆実装コード`,
        url: `https://github.com/search?q=${encodeURIComponent(query)}`,
        domain: 'github.com',
        snippet: 'オープンソースコミュニティによる検証済みライブラリ、コードベース、およびIssue解決。',
      },
      {
        id: 'src-npm-direct',
        title: `npm Registry | 「${query}」パッケージ仕様`,
        url: `https://www.npmjs.com/search?q=${encodeURIComponent(query)}`,
        domain: 'npmjs.com',
        snippet: 'Node.js/JavaScriptのエコシステムパッケージ仕様、ダウンロード統計、型定義情報。',
      },
      {
        id: 'src-stackoverflow-direct',
        title: `Stack Overflow | 「${query}」技術Q&Aと解法`,
        url: `https://stackoverflow.com/questions/tagged/${encodeURIComponent(q.split(' ')[0] || 'javascript')}`,
        domain: 'stackoverflow.com',
        snippet: '世界中のエンジニアによる技術的な問題解決策、ベストプラクティス、コード例。',
      }
    );
  }

  // Academic & News Queries -> arXiv, J-STAGE, Reuters / Google News
  if (
    category === 'news' ||
    q.includes('arxiv') ||
    q.includes('論文') ||
    q.includes('研究') ||
    q.includes('ai') ||
    q.includes('ニュース') ||
    q.includes('速報') ||
    q.includes('経済')
  ) {
    rawSources.push(
      {
        id: 'src-arxiv-direct',
        title: `arXiv.org (Computer Science / AI) | 「${query}」最新論文`,
        url: `https://arxiv.org/search/?query=${encodeURIComponent(query)}&searchtype=all`,
        domain: 'arxiv.org',
        snippet: 'コーネル大学が運営するオープンアクセス学術リポジトリ。最先端のAI・計算機科学プレプリント。',
      },
      {
        id: 'src-jstage-direct',
        title: `J-STAGE | 「${query}」日本の学術論文・科学技術情報`,
        url: `https://www.jstage.jst.go.jp/result/global/-char/ja?globalSearchKey=${encodeURIComponent(query)}`,
        domain: 'jstage.jst.go.jp',
        snippet: '国立研究開発法人科学技術振興機構（JST）が提供する日本の学術論文プラットフォーム。',
      },
      {
        id: 'src-reuters-direct',
        title: 'ロイター (Reuters) | 国際ニュース・経済速報',
        url: 'https://jp.reuters.com/',
        domain: 'jp.reuters.com',
        snippet: '世界各国の市場データ、経済動向、国際情勢に関する信頼性の高い一次報道速報。',
      }
    );
  }

  // Video Streaming & Entertainment -> Abema, YouTube, TVer, NicoNico
  if (
    category === 'videos' ||
    category === 'shorts' ||
    q.includes('動画') ||
    q.includes('abema') ||
    q.includes('アベマ') ||
    q.includes('youtube') ||
    q.includes('アニメ') ||
    q.includes('配信') ||
    q.includes('ドラマ') ||
    q.includes('テレビ') ||
    q.includes('ショート')
  ) {
    rawSources.push(
      {
        id: 'src-abema-direct',
        title: 'ABEMA (アベマ) | 公式動画配信＆24時間ニュース・アニメ・スポーツ',
        url: 'https://abema.tv/',
        domain: 'abema.tv',
        snippet: '登録不要で24時間無料のニュース、話題のアニメ、ドラマ、バラエティ、格闘技・スポーツ中継を直接視聴可能。',
      },
      {
        id: 'src-youtube-direct',
        title: `YouTube | 「${query}」関連の公式動画・ハイライト・解説`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        domain: 'youtube.com',
        snippet: '世界最大の動画共有プラットフォーム。高画質動画、公式チャンネル、最新ライブ配信を直接閲覧。',
      },
      {
        id: 'src-tver-direct',
        title: 'TVer (ティーバー) | 民放公式テレビ配信サービス',
        url: 'https://tver.jp/',
        domain: 'tver.jp',
        snippet: '民放各局の最新ドラマ、バラエティ、報道番組の見逃し無料配信を直接視聴。',
      }
    );
  }

  // Weather Queries -> Direct Meteorological Portals
  if (q.includes('天気') || q.includes('雨') || q.includes('気温') || q.includes('台風') || q.includes('気象')) {
    rawSources.push(
      {
        id: 'src-jma-direct',
        title: '気象庁 | 防災気象情報・全国天気予報 (公式)',
        url: 'https://www.jma.go.jp/bosai/forecast/',
        domain: 'jma.go.jp',
        snippet: '気象庁公式の週間天気予報、降水確率、最高・最低気温、警報・注意報の直接発表データ。',
      },
      {
        id: 'src-tenki-direct',
        title: '日本気象協会 tenki.jp (公式)',
        url: 'https://tenki.jp/',
        domain: 'tenki.jp',
        snippet: '日本気象協会によるピンポイント天気予報、雨雲レーダー、洗濯指数、PM2.5情報。',
      }
    );
  }

  // Gaming Queries -> Direct Gaming Platforms & Store Pages
  if (q.includes('ゲーム') || q.includes('game') || q.includes('switch') || q.includes('steam') || q.includes('任天堂') || q.includes('playstation')) {
    rawSources.push(
      {
        id: 'src-steam-direct',
        title: `Steam | 「${query}」ストア・コミュニティ (公式)`,
        url: `https://store.steampowered.com/search/?term=${encodeURIComponent(query)}`,
        domain: 'store.steampowered.com',
        snippet: '世界最大のPCゲームプラットフォーム。無料プレイ作品、人気ランキング、ユーザーレビューを直接閲覧可能。',
      },
      {
        id: 'src-nintendo-direct',
        title: '任天堂ホームページ (公式)',
        url: 'https://www.nintendo.com/jp/',
        domain: 'nintendo.com',
        snippet: 'Nintendo Switch本体・ソフトラインナップ、最新トピックス、体験版ダウンロード。',
      }
    );
  }

  // General Knowledge -> Direct Wikipedia Article
  rawSources.push({
    id: 'src-wiki-direct',
    title: `ウィキペディア (Wikipedia) - ${query}`,
    url: `https://ja.wikipedia.org/wiki/${encodeURIComponent(query)}`,
    domain: 'ja.wikipedia.org',
    snippet: `フリー百科事典『ウィキペディア』における「${query}」の詳細な歴史、定義、体系的解説。`,
  });

  // Filter out blocked domains strictly
  return rawSources.filter((s) => {
    return !BLOCKED_DOMAINS.some((blocked) => s.domain.toLowerCase().includes(blocked));
  });
}

// Helper: Generates structured direct synthesized answer when external grounding is temporarily unavailable
function generateDirectSynthesizedAnswer(query: string, category: string, isUserKey: boolean) {
  const isTech =
    category === 'tech' ||
    /react|typescript|javascript|python|css|html|api|docker|sql|node/i.test(query);

  const rawCodeSection = isTech
    ? `### Raw Code & Data Dumps
\`\`\`typescript
// Verified Sample Implementation / Data Pattern for: ${query}
export interface SpecificationResult {
  query: string;
  category: string;
  status: 'authenticated' | 'synthesized';
  timestamp: string;
}

export function executeRouting(target: string): SpecificationResult {
  return {
    query: target,
    category: '${category}',
    status: 'synthesized',
    timestamp: new Date().toISOString(),
  };
}
\`\`\``
    : `### Raw Code & Data Dumps
| Parameter | Value / Specification | Primary Domain |
| :--- | :--- | :--- |
| **Query Target** | ${query} | Direct Authentic Hub |
| **Routing Mode** | Pure Clean Mode | No Search Engine Relays |
| **Data Fidelity** | High Density Mega Data | Verified Sources |`;

  return `### 🟢 [Synthesized Answer]

### Executive Summary
「${query}」に対する一次情報源に基づく直接回答です。不要な広告・前置き・リレーURLを完全に排除し、信頼性の高いドキュメントおよび公式プラットフォームの構造化データを提示します。

### Structured Specifications
- **検索対象**: ${query}
- **ルーティング先**: 一次情報源（MDN / GitHub / arXiv / Steam / ABEMA / 気象庁 公式等）
- **フィルタリング**: Pure Clean Mode 適用済（SEOスパム・まとめサイト完全除外）

${rawCodeSection}

### People Also Ask
- 「${query}」の公式仕様・最新アップデート情報
- 「${query}」と類似する代替技術・関連プラットフォームの比較
- 「${query}」の具体的な導入手順と推奨ベストプラクティス

${!isUserKey ? '> 💡 **ヒント**: 画面右上の「🔑 APIキー設定」からご自身のGoogle AI Studio APIキーを入力すると、Google Search Groundingによるリアルタイム最新Web解析がフル稼働します。' : ''}`;
}

// Mount Vite or static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('Shutting down server gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
