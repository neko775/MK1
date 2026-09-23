# MK1 Engine

リポジトリー: https://github.com/neko775/MK1

MK1 Engine は、Gemini API と Google Search Grounding を中核にした、技術調査・比較検索向けの検索コックピットです。通常のAI検索に加えて、画像、ショッピング、動画、ニュース、ショート動画、地図、複数検索エンジンの横断検索、音声入力、アプリ内ブラウザ、検索条件の再利用、自動検索編集を1つの画面にまとめています。

Web/PWA と Capacitor Android アプリを同じソースから生成できます。UIはReact、ビルドはVite、APIサーバーはExpress、AI処理はGoogle GenAI SDKで構成されています。

## 目次

- [全体像](#全体像)
- [検索機能](#検索機能)
- [検索カテゴリ](#検索カテゴリ)
- [Gemini機能](#gemini機能)
- [検索条件とフィルター](#検索条件とフィルター)
- [履歴・プリセット・タブ管理](#履歴プリセットタブ管理)
- [音声・ブラウザ・RPA](#音声ブラウザrpa)
- [設定・表示・ショートカット](#設定表示ショートカット)
- [バックエンドAPI](#バックエンドapi)
- [データ保存とセキュリティ](#データ保存とセキュリティ)
- [ローカル実行](#ローカル実行)
- [Androidアプリ](#androidアプリ)
- [クラウドビルド](#クラウドビルド)
- [プロジェクト構成](#プロジェクト構成)
- [既知の制約](#既知の制約)

## 全体像

### 検索ワークフロー

1. 検索欄に質問、キーワード、調査条件を入力します。
2. Geminiモデルと検索カテゴリを選択します。
3. フィルター、ドメイン除外、時間範囲、コード表示などを必要に応じて設定します。
4. Enter、検索ボタン、または `Cmd/Ctrl+Enter` で実行します。
5. AI回答、根拠ソース、構造化情報、コード/データ、関連質問を確認します。
6. 結果をアプリ内ブラウザで開く、外部ブラウザへ渡す、コピーする、Tab Stashへ保存する、Gemini Drawerで追加分析する、といった操作を行えます。

検索履歴、選択モデル、適用フィルターは検索単位で記録されます。同一クエリは重複保存されず、履歴は新しいものから最大30件保持されます。

### 検索結果の扱い

- Google Search Groundingから返された検索ソースと検索クエリを表示します。
- ソースのタイトル、URL、スニペット、追加メタデータを結果カードに表示します。
- URLコピー、元ページ表示、Tab Stash保存、ドメインブロックを結果単位で実行できます。
- 検索結果や関連質問から、現在の検索条件を引き継いだ再検索を実行できます。
- 検索条件をURLハッシュのパーマリンクとして共有できます。クエリ、モデル、Pure Clean状態を復元します。

## 検索機能

### 通常AI検索

`/api/search/direct` を通じてGeminiのGoogle Search Groundingを呼び出します。SEOスパム、低品質なまとめサイト、不要なリレーURLを避ける検索指示を生成し、AI回答と根拠ソースを返します。技術、ゲーム、天気、動画などのクエリ傾向を判定し、表示する情報の種類と優先ソースを調整します。

技術系の検索ではMDN、GitHub、npm、Stack Overflowなど、天気系では気象庁やtenki.jpなど、ゲーム系ではSteamや任天堂などの関連ソースを優先する構成です。

### 横断検索

横断検索を有効にすると、次の検索サービスを一覧化します。

- Google
- DuckDuckGo
- Bing
- Yahoo! JAPAN
- GitHub
- arXiv
- X
- YouTube
- TikTok
- Instagram
- Facebook
- Reddit
- Threads
- LinkedIn
- Pinterest
- Bluesky

エンジン別タブ、検索語候補5件の生成、タイトル・概要の編集、Geminiによる重複排除と重要度整理、全結果の新規タブ一括オープンに対応します。

### マルチモーダル検索

検索欄にはファイルを添付できます。ファイル選択とドラッグ&ドロップに対応し、添付ファイル名・種類・サイズを検索状態として扱います。画像、スクリーンショット、資料を検索文脈に加える用途を想定しています。

## 検索カテゴリ

検索結果は「すべて」「画像」「ショッピング」「動画」「ニュース」「ショート」「地図」に切り替えられます。カテゴリ指定はサーバーに渡され、カテゴリ別の検索指示や結果表示を選択します。

### 画像

- Google Images、Bing Images、DuckDuckGo Imagesへの検索導線
- 画像URLのコピー、Tab Stash保存、ダウンロード
- 類似画像検索への導線
- タイトル、出典、サムネイルを確認する画像結果表示

### ショッピング

Amazon、楽天、Yahoo!ショッピング、価格.com、ヨドバシ、メルカリを比較対象として表示します。商品ごとに価格、元価格、割引率、送料、ポイント、在庫、評価、レビュー数を表示し、送料無料のみ、価格順、評価順、おすすめ順で絞り込めます。

### 動画

ABEMA、YouTube、TVerを対象に、ライブ状態、再生時間、再生数、公開時期、チャンネル、説明を表示します。アプリ内プレイヤー、YouTube埋め込み、Tab Stash保存に対応します。

### ショート動画

YouTube ShortsやTikTokを想定した9:16の縦型結果を表示します。再生、いいね状態、再生数、投稿者、音源、ハッシュタグの確認とTab Stash保存が可能です。

### ニュース

経済、市場、IT、国際、総合、トレンドの分類に対応します。速報、媒体名、公開時刻、要約、サムネイルを表示し、Google Newsへの導線、アプリ内記事表示、Tab Stash保存を提供します。

### 地図

OpenStreetMapの埋め込みプレビューとGoogle Mapsの検索・ルート案内を利用できます。住所、距離、営業時間、電話番号、評価、レビュー数、施設タグを表示し、地図URLとルートURLをアプリ内ブラウザやTab Stashへ渡せます。

なお、カテゴリ専用ビューの商品・ニュース・地図スポット・動画メタデータの一部はクライアント側の表示データです。通常検索のAI回答と検索ソースはサーバー経由のGemini/Google Search Groundingを使用し、各外部サービスへの導線と組み合わせています。

## Gemini機能

### 選択可能なモデル

UIでは次のモデル名を切り替えられます。

- Gemini 3.8
- Gemini 3.1 Pro
- Gemini 3.7
- Gemini 3.5
- Gemini 3 Pro
- ナノバナナ
- Gemini RPA（自動操作モード）

モデル切り替えは検索、Gemini Drawer、APIコード生成、プリセットに反映されます。

### Gemini Drawer

画面右側のGemini Drawerでは、検索結果や現在の調査内容について追加質問できます。

- 会話セッションの新規作成、切り替え、削除
- チャット履歴の検索と全履歴消去
- メッセージのコピー
- ファイル名の添付
- モデル切り替え
- 音声入力と送信
- APIキーの設定、表示/非表示、保存、削除

プロンプトは最大12,000文字、過去メッセージは最大6件を会話履歴としてサーバーへ送信します。指定モデルが利用できない場合は軽量モデルへフォールバックします。

### APIコード生成

現在の検索条件から、次の形式のコードを生成できます。

- cURL
- Python
- Node.js

生成コードにはモデル、ドメインブロック、時間範囲、正規表現、言語バージョン、Pure Clean、ペイウォール設定、横断検索設定を反映します。

### 自動検索エディタ

Python 3.12またはNode.js 22向けのテンプレートを編集できます。`gemini.eval()`を使う巡回処理のシミュレーション、Google/arXiv/GitHubの巡回ログ、Geminiによるランク付けログを表示し、コード編集、コピー、リセット、実行ログ確認に対応します。

## 検索条件とフィルター

検索フィルターは検索単位で保存でき、プリセットにも含められます。

- **ドメインブロック**: SEOスパム、低品質サイト、任意のドメインやパスを除外します。
- **厳密な時間範囲**: 開始時刻と終了時刻を指定します。
- **コードの横並び表示**: AI要約と原典コードを並べて比較します。
- **プログラマブル操作**: 最小文字数、最大文字数、言語/フレームワークバージョン、正規表現を指定します。
- **Pure Clean Mode**: 検索履歴を汚染しない一時検索モードです。
- **ペイウォールフィルター**: 通常、透過、除外を切り替えます。
- **横断検索**: 複数エンジン検索を検索開始時から有効にします。

初期値では、いくつかの低品質ドメインがブロックされ、コード横並び表示が有効です。設定画面からブラックリストを追加・削除できます。

## 履歴・プリセット・タブ管理

### 検索履歴

- `localStorage` に最大30件保存
- 同一クエリの重複排除
- 履歴内検索
- 履歴からクエリ、モデル、フィルターを再呼び出し
- 直前クエリとの差分を追加・削除・不変トークンで表示
- 履歴の全消去

Pure Clean Modeで実行した検索は、履歴を汚染しない用途を想定しています。

### プリセット

モデル、全フィルター、サンプルクエリ、説明を名前付きで保存します。保存後は一覧から適用・削除できます。プリセットは `localStorage` に保持されます。

### Tab Stash

検索結果、横断検索結果、カテゴリ結果を一時保存するタブ管理機能です。

- 保存件数バッジ
- 元URLを開く
- 個別削除と全消去
- 保存ページのGemini一括解析UI
- `localStorage` への永続化

### タブメモリ診断

JavaScriptヒープ、DOMノード数、読み込み済みリソースを確認し、リソースをアクティブ/休止状態として表示します。診断結果から、`SUMMARY_REPORT.md`、`system_diagnostics.json`、`resources.html` を含むZIPを生成できます。

## 音声・ブラウザ・RPA

### 音声入力

Web Speech APIを利用し、日本語 `ja-JP` と英語 `en-US` を認識します。Web Audio APIではノイズ抑制、エコーキャンセル、自動ゲイン調整を使用します。2.4秒の無音または最大35秒で認識を終了します。

音声コマンドには検索、クリア、終了/確定、キャンセル、AI起動、Gemini Drawer内送信があり、画像、ショッピング、動画、ショート、ニュース、地図などのカテゴリ語も認識します。音量、ピーク、発話状態はバーまたは波形のビジュアライザーで表示します。

### アプリ内ブラウザ

- iframeベースのWeb Viewer
- 戻る、進む、再読み込み
- URL入力と簡易検索
- YouTube URLの埋め込みURL変換
- URLコピー、外部ブラウザ起動、全画面表示
- AI要約ボタン
- iframe制限やCORS/X-Frame-Options時の外部ブラウザフォールバック
- Web、Capacitor Native Browser、外部ブラウザの切り替え

Android/iOSではCapacitor Browserを利用します。外部サイトのポリシーによっては、アプリ内表示や埋め込み再生が制限されます。

### Gemini RPA

Gemini RPAモードは検索指示を解析し、次の形式の操作を扱います。

- `[SEARCH: ...]`: 検索の実行
- `[RPA: {...}]`: タップ、入力、スクロールなどの操作

Capacitorの `DeviceRpa` プラグイン利用可能状態を確認し、Android端末ではアクセシビリティ設定を利用する構成です。RPAは端末、権限、対象サイトのDOMやアクセシビリティ情報に依存します。

## 設定・表示・ショートカット

### 設定

- ブラックリストの管理
- JPG、PNG、GIF、MP4、WebMのローカル背景
- Blob URLによるローカルメディア読み込み
- 夜間ディミング
- リソース保護
- ダイレクト、Cloudflare Edge Proxy、Pure Cleanトンネルのプロキシ選択UI
- 履歴、Tab Stash、プリセットのローカルキャッシュ全消去

背景は画像または動画を設定でき、検索状態に応じた7色の単色遷移発光と組み合わせて表示します。

### GoogleプロフィールUI

ゲストプロフィールに加えて、メールアドレス、パスワード、名前、アバターを使うローカル登録/ログインUI、プロフィール編集、ログアウトを備えています。これはブラウザの `localStorage` ベースのUIであり、外部Google OAuthやサーバー側アカウント認証ではありません。

### ショートカット

| キー | 操作 |
| --- | --- |
| `Cmd/Ctrl+K` | コマンドパレットを開閉 |
| `Cmd/Ctrl+Shift+F` | フィルターを開閉 |
| `Cmd/Ctrl+Shift+P` | Pure Clean Modeを切り替え |
| `Cmd/Ctrl+Enter` | 即時検索 |
| `Cmd/Ctrl+1`〜`6` | Geminiモデルを切り替え |
| `Esc` | モーダル、Drawer、ドロップダウンを閉じる |

サイドバーには履歴、横断検索、タブメモリ、自動検索、APIコード、プリセット、Tab Stash、設定を配置しています。

### システム診断と自動更新

帯域、Ping、ドメイン応答時間、RAM、JavaScriptヒープ、オンライン状態、接続種別、DOMノード数を約18秒間隔で測定します。バックグラウンドタブでは測定を一時停止します。ブラウザ版はサーバーバージョンを30秒ごとに確認し、サーバー再起動を検知すると自動リロードします。

## バックエンドAPI

Expressサーバーの実装は [`server.ts`](server.ts) です。APIベースURLは `VITE_API_BASE_URL` で変更でき、未設定時は同一オリジンの相対 `/api` を使用します。ダウンロードしたHTMLを直接開く場合は、URL末尾に `?api=https://公開API.example.com` を付けるか、HTMLの `window.__MYENGINE_API_BASE_URL__` を設定してください。Capacitorのローカル開発時は未設定なら `http://localhost:3000` を使用します。

### エンドポイント

| メソッド | パス | 内容 |
| --- | --- | --- |
| `GET` | `/api/version` | 実行時刻ベースのサーバーバージョンを返す。`Cache-Control: no-store`。 |
| `GET` | `/api/gemini/status` | Gemini利用可否、ユーザーキー利用中か、モデル情報を返す。 |
| `POST` | `/api/gemini/validate-key` | `AIza`形式を確認し、`gemini-3.1-flash-lite`で実接続を検証する。 |
| `POST` | `/api/gemini/chat` | プロンプト、会話履歴、モデル、システム指示を使ったGeminiチャット。 |
| `POST` | `/api/search/direct` | カテゴリ付きGoogle Search Grounding AI検索。 |

### APIの動作仕様

- JSONリクエストボディの上限は15MBです。
- `/api/` 配下はIP単位で1分60リクエストまでです。超過時はHTTP 429と `Retry-After: 60` を返します。
- `X-Content-Type-Options: nosniff` と `Referrer-Policy: no-referrer` を設定します。
- ユーザーの `X-Gemini-API-Key` ヘッダーまたは本文のキーを優先し、未指定時はサーバーの `GEMINI_API_KEY` を使用します。
- Geminiチャットのタイムアウトは45秒です。
- 指定モデルが失敗した場合は軽量モデルへフォールバックします。
- Google Search Groundingが失敗した場合も通常Geminiモデルへのフォールバックを試みます。
- `PORT` 環境変数で待受ポートを変更でき、既定値は3000です。
- 本番環境では `dist` を静的配信し、SPA fallbackとして `index.html` を返します。

## データ保存とセキュリティ

### ローカル保存キー

ブラウザ内の次の `localStorage` キーを使用します。

- `myengine_search_history`: 検索履歴
- `myengine_stashed_pages`: Tab Stash
- `myengine_presets`: 検索プリセット
- `myengine_user_profile`: プロフィールUI
- `myengine_gemini_api_key`: ユーザー入力のGemini APIキー

`localStorage` は暗号化ストレージではありません。共有端末ではAPIキーを保存せず、利用後に削除してください。`GEMINI_API_KEY` を `VITE_*` 環境変数に設定しないでください。`VITE_*` はViteのクライアントバンドルに埋め込まれるため、APIキーが公開されます。

### APIキーと公開環境

本番APIはHTTPSで公開し、WebアプリまたはCapacitorアプリのオリジンからのアクセスを許可してください。CORS、リバースプロキシ、レート制限、ログへの秘密情報出力をデプロイ環境側でも確認してください。ユーザーAPIキーはリクエスト時にサーバーへ渡されますが、サーバー側で永続化しません。

## ローカル実行

### 前提

- Node.js 22系を推奨
- npm
- Gemini機能を使う場合はGoogle AI Studio APIキー

### セットアップ

```bash
npm install
```

`.env.local` または実行環境に次を設定します。

```dotenv
GEMINI_API_KEY=your_google_ai_studio_key
PORT=3000
```

起動:

```bash
npm run dev
```

ブラウザで `http://localhost:3000/` を開きます。`tsx watch` がExpressサーバーを再起動し、Vite HMRが画面を更新します。

### npmスクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | `server.ts`を監視しながら開発サーバーを起動 |
| `npm run build` | Vite本番ビルドを`dist/`へ出力 |
| `npm run preview` | Viteのビルド結果をプレビュー |
| `npm start` | 本番向けNodeサーバーを起動 |
| `npm run lint` | TypeScript型チェック（`tsc --noEmit`） |
| `npm run cap:sync` | Webビルド後にCapacitorへ同期 |
| `npm run cap:add:android` | Androidプラットフォームを追加 |
| `npm run cap:open:android` | Android Studioでプロジェクトを開く |
| `npm run cap:build:android` | Capacitor Androidビルド |
| `npm run clean` | `dist`と生成済みサーバーファイルを削除 |

### ワンクリック起動

- Linux: `start-server.sh` を実行し、`http://localhost:3000/` を開きます。
- Windows: `start-server.bat` を実行し、`http://localhost:3000/` を開きます。
- `launch.html`: サーバー起動後に開くブラウザランチャーです。

HTMLファイル単体ではブラウザの制約上Node.jsサーバーを起動できません。`launch.html` はサーバーの起動状態を案内するだけです。

## Androidアプリ

CapacitorのアプリIDは `com.myengine.search`、アプリ名は `MK1 検索エンジン`、Web資産の配信元は `dist/` です。

### ローカル準備

Android StudioとAndroid SDKを用意してから実行します。

```bash
npm run cap:add:android
npm run cap:sync
npm run cap:open:android
```

APKにはWeb UIが同梱されますが、Gemini API呼び出しは設定済みのAPIサーバーが必要です。公開APIを指定して同期する例:

```bash
VITE_API_BASE_URL=https://api.example.com npm run cap:sync
```

インストール済みAPKはソース編集だけでは更新されません。再ビルドして配布するか、別途Capacitor OTA更新サービスを導入してください。自動更新はWeb/PWA版のサーバー再起動検知を指します。

### Capacitor設定

`capacitor.config.json` ではAndroidスキームをHTTPSとして扱います。APIはHTTPSで公開し、アプリのオリジンからの通信を許可してください。

## クラウドビルド

GitHub Actionsの設定は [`ci.yml`](.github/workflows/ci.yml) と [`build-apk.yml`](.github/workflows/build-apk.yml) にあります。

### Web CI

`main`/`master`へのpushまたはPull Requestで起動し、次を実行します。

1. Ubuntu runnerを起動
2. Node.js 22をセットアップ
3. `npm ci` でlockfileどおりに依存関係をインストール
4. `npm run lint` で型チェック
5. `npm run build` でVite本番ビルド
6. `dist/` を `mk1-engine-web` artifactとして14日間保存

### Android APK CI

`main`/`master`へのpush、またはActions画面の手動実行で起動します。手動実行時は `api_base_url` に公開HTTPS API URLを入力できます。入力がない場合はリポジトリ変数 `VITE_API_BASE_URL` を使用します。

1. Node.js 22、JDK 21、Android SDKをセットアップ
2. `npm ci`
3. `npm run cap:sync`
4. `android/gradlew assembleDebug --no-daemon`
5. `mk1-engine-debug-apk` artifactとしてAPKを保存

AndroidのGradleビルドはGitHub Actions上で実行してください。APKはActionsの実行ページからダウンロードできます。

## プロジェクト構成

```text
.
├── server.ts                 # Express API、静的配信、Gemini呼び出し
├── index.html                # ViteエントリとPWAメタデータ
├── vite.config.ts            # Vite、React、Tailwind設定
├── capacitor.config.json     # Capacitor Android設定
├── src/
│   ├── App.tsx               # 検索状態、画面遷移、キーボード操作
│   ├── types.ts              # モデル、検索、履歴、プリセットの型
│   ├── components/           # 検索結果、各モーダル、Drawer、カテゴリ画面
│   ├── hooks/                # 音声認識、自動更新、システム診断
│   └── lib/                  # APIクライアント、端末RPA連携
├── android/                  # Capacitor Androidプロジェクト
├── .github/workflows/
│   ├── ci.yml                # Web型チェック・ビルド
│   └── build-apk.yml         # Android APKビルド
├── manifest.webmanifest      # PWAマニフェスト
└── metadata.json             # アプリの機能メタデータ
```

主要コンポーネントは [`SearchResults`](src/components/SearchResults.tsx)、[`GeminiDrawer`](src/components/GeminiDrawer.tsx)、[`CrossEngineModal`](src/components/CrossEngineModal.tsx)、[`AutoSearchEditorModal`](src/components/AutoSearchEditorModal.tsx)、[`InAppBrowserModal`](src/components/InAppBrowserModal.tsx)、カテゴリ別の `src/components/category-views/` に分かれています。

## 既知の制約

- 外部サイトのCORS、X-Frame-Options、ログイン要求、埋め込み禁止設定により、アプリ内ブラウザで表示できないページがあります。
- Geminiのモデル名、API仕様、利用可能地域、クォータ、課金状態によって応答やフォールバックが変わります。
- カテゴリ専用ビューの一部の商品・動画・ニュース・地図データはUI表示用のクライアント側データで、各サービスのリアルタイムAPIを直接取得するものではありません。
- 音声認識はブラウザ、OS、マイク権限、Web Speech APIの対応状況に依存します。
- RPAはAndroidのアクセシビリティ権限、端末状態、対象サイトの画面構造に依存します。
- `localStorage` のデータはブラウザプロファイル単位です。別端末や別ブラウザへ自動同期されません。
- Viteビルドでは大きなJavaScriptチャンクに関する警告が出る場合があります。ビルド失敗を示すものではありません。
