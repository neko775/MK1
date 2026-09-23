import React, { useState } from 'react';
import { Code2, Play, Copy, Check, RotateCcw, X, Terminal, Sparkles } from 'lucide-react';

interface AutoSearchEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuery: string;
}

const TEMPLATES = {
  python: `# Python 3.12 / Google GenAI SDK
import asyncio
from google import genai
from google.genai import types

async def autonomous_search_crawler(query: str):
    print(f"[CRAWLER] Starting search workflow: {query}")
    client = genai.Client()
    
    # 1. Expand query variations
    expansion = await client.models.generate_content(
        model="gemini-3.8-flash",
        contents=f"Generate 3 precise technical search variations for: {query}"
    )
    print(f"[GEMINI.EVAL] Variations: \\n{expansion.text}")
    
    # 2. Parallel deep scrape & fact-check
    results = [
        {"url": "https://github.com/trending", "relevance": 0.96},
        {"url": "https://arxiv.org/list/cs", "relevance": 0.91}
    ]
    print(f"[SUMMARY] Indexed {len(results)} authoritative endpoints.")
    return results

if __name__ == "__main__":
    asyncio.run(autonomous_search_crawler("React 19 Server Actions"))
`,
  javascript: `// JavaScript (Node.js 22 / ESNext)
import { GoogleGenAI } from '@google/genai';

async function runGeminiCrawler(query) {
  console.log(\`[DISPATCH] Launching automated batch search: "\${query}"\`);
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  // Dynamic eval step
  const evalPrompt = \`Analyze the query and extract structural schema: "\${query}"\`;
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: evalPrompt
  });
  
  console.log('[EVAL RESULT]', response.text);
  return { status: 'SUCCESS', targetQuery: query };
}

runGeminiCrawler('TypeScript 7.0 Isolated Declarations');
`,
};

export const AutoSearchEditorModal: React.FC<AutoSearchEditorModalProps> = ({
  isOpen,
  onClose,
  currentQuery,
}) => {
  const [lang, setLang] = useState<'python' | 'javascript'>('python');
  const [code, setCode] = useState(TEMPLATES.python);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleLangChange = (selected: 'python' | 'javascript') => {
    setLang(selected);
    setCode(TEMPLATES[selected]);
  };

  const handleRun = () => {
    setIsRunning(true);
    setLogs([
      `[${new Date().toLocaleTimeString()}] インタプリタ初期化完了 (${lang.toUpperCase()})`,
      `[${new Date().toLocaleTimeString()}] gemini.eval() 仮想サンドボックスを起動中...`,
      `[${new Date().toLocaleTimeString()}] 対象クエリ: "${currentQuery || 'デフォルトクエリ'}"`,
    ]);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 巡回ルーティング: Google / arXiv / GitHub インデックス取得`,
        `[${new Date().toLocaleTimeString()}] Gemini 3.8 セマンティックランク付け: 94.2% マッチ`,
      ]);
    }, 800);

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 完了: 5件の高信頼度ソースを抽出。エラー 0件。`,
      ]);
      setIsRunning(false);
    }, 1600);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200/90 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <Code2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                自動検索エディタ (gemini.eval 巡回ロジック)
              </h2>
              <p className="text-xs text-gray-500">
                Python/JSスクリプトによる自律検索スクレイピング・評価サンドボックス
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 px-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleLangChange('python')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                lang === 'python'
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Python 3.12 (genai)
            </button>
            <button
              type="button"
              onClick={() => handleLangChange('javascript')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                lang === 'javascript'
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Node.js 22 (ESNext)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copied ? 'コピー済' : 'コピー'}</span>
            </button>
            <button
              type="button"
              onClick={() => setCode(TEMPLATES[lang])}
              className="p-1 text-gray-400 hover:text-gray-700"
              title="リセット"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#0F172A] text-gray-100 font-mono text-xs">
          <div className="flex-1 p-4 overflow-y-auto">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full min-h-[220px] bg-transparent resize-none focus:outline-none leading-relaxed text-indigo-100 font-mono"
              spellCheck={false}
            />
          </div>

          {/* Execution Terminal */}
          <div className="h-40 border-t border-gray-800 bg-[#0B0F19] p-3 overflow-y-auto">
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2 pb-1 border-b border-gray-800">
              <span className="flex items-center gap-1">
                <Terminal size={12} />
                <span>Console Output</span>
              </span>
              <span>サンドボックス環境: アクティブ</span>
            </div>
            {logs.length === 0 ? (
              <div className="text-gray-500 text-[11px] italic">
                「実行」ボタンを押すと、巡回・gemini.eval()評価ロジックがシミュレーション実行されます。
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="text-[11px] font-mono text-emerald-400 mb-0.5">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 bg-white border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play size={13} fill="currentColor" />
            <span>{isRunning ? 'gemini.eval() 巡回実行中...' : '実行 (Run Script)'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs hover:bg-black transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
