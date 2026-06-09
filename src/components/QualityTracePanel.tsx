/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Search,
  FlaskConical,
  Maximize2,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { ProductionOrder, QualityTrace } from '../types';
import {
  TRACE_RESULT_LABEL,
  TRACE_RESULT_STYLE,
  buildBatchSummaries,
  getTracesForBatch,
  PROCESS_STEP_ORDER,
} from '../qualityTraceUtils';
import { panelCard, panelInner, panelTitle, panelMuted, panelValue } from '../themeStyles';

type Theme = 'cyberpunk' | 'minimalist';

interface QualityTracePanelProps {
  theme: Theme;
  traces: QualityTrace[];
  orders: ProductionOrder[];
  selectedOrderId: string | null;
  onOpenExplorer: (batchNo?: string, traceId?: string) => void;
}

export function QualityTracePanel({
  theme,
  traces,
  orders,
  selectedOrderId,
  onOpenExplorer,
}: QualityTracePanelProps) {
  const card = panelCard(theme);
  const inner = panelInner(theme);
  const title = panelTitle(theme);
  const muted = panelMuted(theme);
  const isMinimal = theme === 'minimalist';

  const batches = buildBatchSummaries(traces, orders);
  const activeOrder = orders.find(o => o.id === selectedOrderId);
  const activeBatchNo = activeOrder?.batchNo;
  const activeBatch = batches.find(b => b.batchNo === activeBatchNo) ?? batches[0];
  const activeNodes = activeBatch ? getTracesForBatch(traces, activeBatch.batchNo) : [];
  const anomalyNodes = activeNodes.filter(n => n.result !== 'pass');

  return (
    <section className={`p-3 rounded-2xl border ${card}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-xs font-bold flex items-center gap-1.5 ${title}`}>
          <FlaskConical className="h-4 w-4 text-violet-500" />
          质量追溯
        </h3>
        <button
          type="button"
          onClick={() => onOpenExplorer(activeBatch?.batchNo)}
          className={`flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[9px] font-bold border cursor-pointer transition ${
            isMinimal
              ? 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
              : 'bg-violet-950/50 text-violet-300 border-violet-700/50 hover:bg-violet-900/50'
          }`}
        >
          <Maximize2 className="h-3 w-3" />
          追溯中心
        </button>
      </div>

      {/* 当前工单批次摘要 */}
      {activeBatch && (
        <button
          type="button"
          onClick={() => onOpenExplorer(activeBatch.batchNo)}
          className={`w-full text-left p-2.5 rounded-xl border mb-2 cursor-pointer transition ${
            activeBatch.anomalyCount > 0
              ? isMinimal
                ? 'border-red-200 bg-red-50/60 hover:bg-red-50'
                : 'border-red-800/50 bg-red-950/20 hover:bg-red-950/30'
              : inner
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-black ${panelValue(theme)}`}>{activeBatch.batchNo}</span>
            <span
              className={`text-[8px] px-1.5 py-0.5 rounded border font-bold ${
                isMinimal
                  ? TRACE_RESULT_STYLE[activeBatch.overallResult].badgeMinimal
                  : TRACE_RESULT_STYLE[activeBatch.overallResult].badge
              }`}
            >
              {TRACE_RESULT_LABEL[activeBatch.overallResult]}
            </span>
          </div>
          <div className={`text-[9px] ${muted}`}>{activeBatch.spec} · 良率 {activeBatch.yieldRate}%</div>
          {activeBatch.anomalyCount > 0 ? (
            <div className="mt-1 flex items-center gap-1 text-[9px] text-red-500 font-bold">
              <AlertTriangle className="h-3 w-3" />
              {activeBatch.anomalyCount} 个工序存在异常，点击查看全链路
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-1 text-[9px] text-emerald-500">
              <CheckCircle2 className="h-3 w-3" />
              全工序参数合格
            </div>
          )}
        </button>
      )}

      {/* 迷你工序链 */}
      {activeNodes.length > 0 && (
        <div className={`p-2 rounded-xl border mb-2 ${inner}`}>
          <div className={`text-[8px] font-bold mb-1.5 ${muted}`}>工序追溯链</div>
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-thin pb-0.5">
            {PROCESS_STEP_ORDER.map(stepId => {
              const node = activeNodes.find(n => n.processStep === stepId);
              if (!node) {
                return (
                  <div key={stepId} className="flex items-center gap-0.5 shrink-0">
                    <span
                      className={`h-5 w-5 rounded-full border-2 border-dashed flex items-center justify-center text-[7px] ${
                        isMinimal ? 'border-slate-200 text-slate-300' : 'border-slate-700 text-slate-600'
                      }`}
                    >
                      —
                    </span>
                    <ChevronRight className={`h-2.5 w-2.5 shrink-0 ${muted}`} />
                  </div>
                );
              }
              const style = TRACE_RESULT_STYLE[node.result];
              return (
                <div key={stepId} className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    title={`${node.processLabel} · ${TRACE_RESULT_LABEL[node.result]}`}
                    onClick={() => onOpenExplorer(activeBatch.batchNo, node.id)}
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition hover:scale-110 ${style.dot} ${
                      isMinimal ? 'border-white' : 'border-slate-900'
                    }`}
                  />
                  <ChevronRight className={`h-2.5 w-2.5 shrink-0 ${muted}`} />
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
            {activeNodes.map(n => (
              <span key={n.id} className={`text-[7px] ${muted}`}>
                {n.processLabel}
                <span className={n.result === 'pass' ? ' text-emerald-500' : ' text-red-500'}>
                  {' '}
                  {TRACE_RESULT_LABEL[n.result]}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 异常快览 */}
      {anomalyNodes.length > 0 && (
        <div className="flex flex-col gap-1 mb-2">
          <div className={`text-[8px] font-bold ${muted}`}>异常环节 ({anomalyNodes.length})</div>
          {anomalyNodes.slice(0, 2).map(node => (
            <button
              key={node.id}
              type="button"
              onClick={() => onOpenExplorer(activeBatch.batchNo, node.id)}
              className={`text-left p-2 rounded-lg border cursor-pointer transition ${
                isMinimal
                  ? 'border-red-200 bg-red-50/50 hover:bg-red-50'
                  : 'border-red-900/40 bg-red-950/20 hover:bg-red-950/30'
              }`}
            >
              <div className="flex justify-between text-[9px] font-bold mb-0.5">
                <span className="text-red-500">{node.processLabel} · {node.deviceCode}</span>
                <ChevronRight className="h-3 w-3 text-red-400" />
              </div>
              <div className={`text-[8px] line-clamp-2 ${muted}`}>{node.anomaly ?? '参数偏离标准'}</div>
            </button>
          ))}
        </div>
      )}

      {/* 全部批次快捷入口 */}
      <div className={`text-[8px] font-bold mb-1 ${muted}`}>全部批次 ({batches.length})</div>
      <div className="flex flex-col gap-1 max-h-[72px] overflow-y-auto scrollbar-thin">
        {batches.map(b => (
          <button
            key={b.batchNo}
            type="button"
            onClick={() => onOpenExplorer(b.batchNo)}
            className={`flex items-center justify-between p-1.5 rounded-lg border text-[9px] cursor-pointer transition ${inner}`}
          >
            <span className={`font-medium truncate ${panelValue(theme)}`}>{b.batchNo}</span>
            <span className="flex items-center gap-1 shrink-0">
              {b.anomalyCount > 0 && (
                <span className="text-red-500 font-bold">{b.anomalyCount}⚠</span>
              )}
              <Search className={`h-2.5 w-2.5 ${muted}`} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
