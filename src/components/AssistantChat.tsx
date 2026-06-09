/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Send, Minus, RefreshCw, Loader2 } from 'lucide-react';
import { SliceId } from '../types';
import {
  PROMPT_CATEGORY_TABS,
  getContextHint,
  rotatePrompts,
  type PromptCategory,
} from '../assistantPrompts';

export interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

interface AssistantChatProps {
  theme: 'cyberpunk' | 'minimalist';
  sidePanelsOpen: boolean;
  activeSlice: SliceId;
  messages: ChatMessage[];
  chatInput: string;
  isTyping: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onPromptSelect: (prompt: string) => void;
}

export function AssistantChat({
  theme,
  sidePanelsOpen,
  activeSlice,
  messages,
  chatInput,
  isTyping,
  chatEndRef,
  onClose,
  onInputChange,
  onSubmit,
  onPromptSelect,
}: AssistantChatProps) {
  const [promptCategory, setPromptCategory] = useState<'featured' | PromptCategory>('featured');
  const [rotateSeed, setRotateSeed] = useState(0);

  const visiblePrompts = rotatePrompts(promptCategory, activeSlice, rotateSeed, 6);
  const isMinimal = theme === 'minimalist';

  const chipBase = isMinimal
    ? 'bg-white hover:bg-blue-50 text-slate-700 border-slate-200 hover:border-blue-300'
    : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:border-blue-500/50';

  const tabActive = isMinimal
    ? 'bg-blue-600 text-white shadow-sm'
    : 'bg-blue-600 text-white shadow-blue-900/40';

  const tabIdle = isMinimal
    ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
    : 'text-slate-400 hover:text-white hover:bg-slate-800';

  return (
    <section
      className={`absolute bottom-6 z-40 w-[380px] border rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 transition-all ${
        sidePanelsOpen ? 'right-[340px]' : 'right-4'
      } ${
        isMinimal
          ? 'bg-white/95 border-slate-200 text-slate-800'
          : 'bg-slate-900/95 border-slate-800 text-white'
      }`}
    >
      {/* Header */}
      <div
        className={`px-3.5 py-3 flex items-center justify-between border-b shrink-0 ${
          isMinimal ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`p-1.5 rounded-xl border ${
              isMinimal ? 'bg-blue-100 border-blue-200' : 'bg-blue-950 border-blue-900/50'
            }`}
          >
            <Sparkles
              className={`h-4 w-4 animate-pulse ${isMinimal ? 'text-blue-600' : 'text-blue-400'}`}
            />
          </span>
          <div>
            <span
              className={`text-xs font-black block text-left ${isMinimal ? 'text-slate-900' : 'text-white'}`}
            >
              工厂智能助手
            </span>
            <span
              className={`text-[9px] block text-left ${isMinimal ? 'text-slate-500' : 'text-slate-400'}`}
            >
              孪生微脑智能体在线
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg transition duration-150 cursor-pointer ${
            isMinimal
              ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="最小化"
        >
          <Minus className="h-3 w-3" />
        </button>
      </div>

      {/* Messages */}
      <div
        className={`flex-1 max-h-[240px] overflow-y-auto p-3 text-xs flex flex-col gap-2.5 scrollbar-thin ${
          isMinimal ? 'bg-slate-50/50' : 'bg-transparent'
        }`}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[88%] rounded-2xl p-2.5 leading-relaxed text-[11px] text-left ${
              msg.sender === 'ai'
                ? isMinimal
                  ? 'bg-white text-slate-850 rounded-tl-sm border border-slate-200 shadow-sm'
                  : 'bg-slate-950 text-slate-300 rounded-tl-sm border border-slate-850'
                : 'bg-blue-600 text-white rounded-tr-sm self-end shadow-sm'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {isTyping && (
          <div
            className={`max-w-[70%] rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-2 text-[10px] ${
              isMinimal
                ? 'bg-white border border-slate-200 text-slate-500'
                : 'bg-slate-950 border border-slate-850 text-slate-400'
            }`}
          >
            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
            正在分析孪生数据…
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Prompt suggestions */}
      <div
        className={`shrink-0 border-t ${
          isMinimal ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-850'
        }`}
      >
        <div className="px-3 pt-2 pb-1 flex items-center justify-between gap-2">
          <span
            className={`text-[9px] font-medium truncate ${isMinimal ? 'text-slate-500' : 'text-slate-400'}`}
          >
            {getContextHint(activeSlice)}
          </span>
          <button
            type="button"
            onClick={() => setRotateSeed(s => s + 1)}
            className={`flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md shrink-0 cursor-pointer transition ${
              isMinimal
                ? 'text-blue-600 hover:bg-blue-50'
                : 'text-blue-400 hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="h-2.5 w-2.5" />
            换一批
          </button>
        </div>

        <div
          className={`px-3 pb-1.5 flex gap-1 overflow-x-auto scrollbar-thin ${
            isMinimal ? '' : 'scrollbar-thumb-slate-700'
          }`}
        >
          {PROMPT_CATEGORY_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setPromptCategory(tab.id);
                setRotateSeed(0);
              }}
              className={`shrink-0 text-[9px] px-2 py-0.5 rounded-full font-semibold transition cursor-pointer ${
                promptCategory === tab.id ? tabActive : tabIdle
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-3 pb-2.5 grid grid-cols-2 gap-1.5">
          {visiblePrompts.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPromptSelect(p.prompt)}
              disabled={isTyping}
              className={`text-[9px] px-2 py-1.5 rounded-lg border font-medium select-none text-left truncate transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${chipBase}`}
              title={p.prompt}
            >
              <span className="mr-0.5">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={onSubmit}
        className={`flex items-center gap-1.5 p-2 border-t shrink-0 ${
          isMinimal ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-850'
        }`}
      >
        <input
          type="text"
          value={chatInput}
          onChange={e => onInputChange(e.target.value)}
          disabled={isTyping}
          className={`flex-1 rounded-xl px-3.5 py-1.5 text-xs outline-none border disabled:opacity-60 ${
            isMinimal
              ? 'border-slate-300 bg-white text-slate-805 placeholder-slate-400 focus:border-blue-500'
              : 'border-slate-850 bg-slate-900 text-white placeholder-slate-500 focus:border-blue-500'
          }`}
          placeholder="输入问题，或点击上方快捷提示"
        />
        <button
          type="submit"
          disabled={isTyping || !chatInput.trim()}
          className="rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-1.5 transition select-none cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </section>
  );
}

export function AssistantLauncher({
  theme,
  sidePanelsOpen,
  onOpen,
}: {
  theme: 'cyberpunk' | 'minimalist';
  sidePanelsOpen: boolean;
  onOpen: () => void;
}) {
  const isMinimal = theme === 'minimalist';

  return (
    <button
      id="ai-agent-launcher"
      onClick={onOpen}
      className={`absolute bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 animate-bounce pointer-events-auto cursor-pointer ${
        sidePanelsOpen ? 'right-[340px]' : 'right-4'
      } ${
        isMinimal
          ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
          : 'bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-400 shadow-indigo-900/40'
      }`}
      title="工厂智能助手"
    >
      <div className="relative">
        <Sparkles className="h-6 w-6 text-white animate-pulse" />
        <span
          className={`absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 border-2 ${
            isMinimal ? 'border-white' : 'border-slate-900'
          }`}
        />
      </div>
    </button>
  );
}
