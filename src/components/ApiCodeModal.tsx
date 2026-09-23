import React, { useState } from 'react';
import { FileCode2, Copy, Check, X, Terminal, Code2 } from 'lucide-react';
import { GeminiModel, SearchFilterState } from '../types';

interface ApiCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  model: GeminiModel;
  filters: SearchFilterState;
}

export const ApiCodeModal: React.FC<ApiCodeModalProps> = ({
  isOpen,
  onClose,
  query,
  model,
  filters,
}) => {
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'nodejs'>('curl');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const targetQuery = query || 'React 19 Server Components';
  const modelId =
    model === 'Gemini 3.8'
      ? 'gemini-3.8-flash'
      : model === 'Gemini 3.1 Pro'
      ? 'gemini-3.1-pro-preview'
      : model === 'Gemini 3.7'
      ? 'gemini-3.7-flash'
      : model === 'Gemini 3.5'
      ? 'gemini-3.5-pro'
      : model === 'Gemini 3 Pro'
      ? 'gemini-3-pro'
      : 'gemini-nano-banana';

  const filterPayload = {
    query: targetQuery,
    model: modelId,
    domain_block: filters.domainBlock,
    blocked_domains: filters.domainBlock ? filters.blockedDomains : [],
    time_range: filters.exactTimeRange
      ? { start: filters.timeStart, end: filters.timeEnd }
      : null,
    programmable_ops: filters.programmableOps,
    pure_clean: filters.pureCleanMode,
    paywall_filter: filters.paywallFilter,
    cross_engine: filters.crossEngine,
  };

  const curlCode = `# cURL - MyEngine Studio Search API Endpoint
curl -X POST "https://api.myengine.local/v1/search" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $GEMINI_API_KEY" \\
  -d '${JSON.stringify(filterPayload, null, 2)}'
`;

  const pythonCode = `# Python 3.12 - @google/genai SDK Integration
import os
import json
from google import genai
from google.genai import types

def run_myengine_search():
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    
    system_instruction = (
        "You are MyEngine Autonomous Search Agent. "
        "Strictly adhere to domain blocklists and extract verified code with citations."
    )
    
    prompt = f"""
    Search Query: "${targetQuery}"
    Filters: ${JSON.stringify(filterPayload, null, 2)}
    """
    
    response = client.models.generate_content(
        model="${modelId}",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2,
        )
    )
    
    print(response.text)

if __name__ == "__main__":
    run_myengine_search()
`;

  const nodejsCode = `// Node.js 22 / TypeScript - Google GenAI SDK
import { GoogleGenAI } from '@google/genai';

async function executeSearch() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const payload = ${JSON.stringify(filterPayload, null, 2)};
  
  const response = await ai.models.generateContent({
    model: '${modelId}',
    contents: [
      {
        role: 'user',
        parts: [{ text: \`Execute verified search for: \${payload.query}\` }]
      }
    ],
    config: {
      temperature: 0.2
    }
  });

  console.log(response.text);
}

executeSearch();
`;

  const currentCode =
    activeTab === 'curl' ? curlCode : activeTab === 'python' ? pythonCode : nodejsCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
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
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileCode2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                cURL / Python / Node.js APIコード自動生成
              </h2>
              <p className="text-xs text-gray-500">
                UIで組んだ条件と7つのフィルターを1クリックで完全な実行コードへ変換
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

        {/* Tab selection & copy */}
        <div className="p-3 px-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(['curl', 'python', 'nodejs'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-gray-900 text-white shadow-2xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab === 'curl' ? 'cURL' : tab === 'python' ? 'Python (genai)' : 'Node.js (ESNext)'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5 shadow-2xs font-medium"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            <span>{copied ? 'クリップボードにコピー済!' : 'コードをコピー'}</span>
          </button>
        </div>

        {/* Code view */}
        <div className="flex-1 bg-[#0F172A] p-4 overflow-y-auto font-mono text-xs text-indigo-100 leading-relaxed">
          <pre className="whitespace-pre">{currentCode}</pre>
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>モデル: {model} | フィルター連動: 有効</span>
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
