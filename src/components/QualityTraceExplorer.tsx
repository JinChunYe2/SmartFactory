/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Search,
  Download,
  MapPin,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  FlaskConical,
} from 'lucide-react';
import { ProductionOrder, ProcessStepId, QualityTrace } from '../types';
import {
  TRACE_RESULT_LABEL,
  TRACE_RESULT_STYLE,
  buildBatchSummaries,
  formatTraceExport,
  getAnomalyParamCount,
  getTracesForBatch,
  searchTraces,
} from '../qualityTraceUtils';

type Theme = 'cyberpunk' | 'minimalist';

interface QualityTraceExplorerProps {
  theme: Theme;
  traces: QualityTrace[];
  orders: ProductionOrder[];
  initialBatchNo?: string | null;
  initialTraceId?: string | null;
  currentOrderId?: string | null;
  onClose: () => void;
  onFocusDevice: (deviceCode: string, processStepId?: ProcessStepId) => void;
  onAskAI: (q: string) => void;
}

export function QualityTraceExplorer({
  theme,
  traces,
  orders,
  initialBatchNo,
  initialTraceId,
  currentOrderId,
  onClose,
  onFocusDevice,
  onAskAI,
}: QualityTraceExplorerProps) {
  const isMinimal = theme === 'minimalist';
  const batches = useMemo(() => buildBatchSummaries(traces, orders), [traces, orders]);

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'anomaly' | 'current'>('all');
  const [selectedBatchNo, setSelectedBatchNo] = useState(
    initialBatchNo ?? batches[0]?.batchNo ?? '',
  );
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(initialTraceId ?? null);

  const filteredBatches = useMemo(() => {
    let list = batches;
    if (filterMode === 'anomaly') list = list.filter(b => b.anomalyCount > 0);
    if (filterMode === 'current' && currentOrderId) {
      list = list.filter(b => b.orderId === currentOrderId);
    }
    if (search.trim()) {
      const matchedTraces = searchTraces(traces, search);
      const batchSet = new Set(matchedTraces.map(t => t.batchNo));
      list = list.filter(b => batchSet.has(b.batchNo));
    }
    return list;
  }, [batches, filterMode, currentOrderId, search, traces]);

  const batchTraces = getTracesForBatch(traces, selectedBatchNo);
  const selectedTrace = batchTraces.find(t => t.id === selectedTraceId) ?? batchTraces[0] ?? null;
  const selectedBatch = batches.find(b => b.batchNo === selectedBatchNo);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (filteredBatches.length > 0 && !filteredBatches.some(b => b.batchNo === selectedBatchNo)) {
      setSelectedBatchNo(filteredBatches[0].batchNo);
    }
  }, [filteredBatches, selectedBatchNo]);

  useEffect(() => {
    const nodes = getTracesForBatch(traces, selectedBatchNo);
    if (nodes.length > 0 && !nodes.some(n => n.id === selectedTraceId)) {
      setSelectedTraceId(nodes.find(n => n.result === 'fail')?.id ?? nodes[0].id);
    }
  }, [selectedBatchNo, traces, selectedTraceId]);

  const shell = isMinimal ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-white';
  const panel = isMinimal ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800';
  const muted = isMinimal ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className={`fixed inset-0 z-[210] flex flex-col ${shell}`} role="dialog" aria-modal="true">
      {/* Header */}
      <header
        className={`shrink-0 flex flex-wrap items-center gap-3 border-b px-4 py-3 ${
          isMinimal ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-violet-500" />
          <div>
            <h2 className="text-sm font-black">质量追溯中心</h2>
            <p className={`text-[9px] ${muted}`}>批次 → 工序 → 设备参数 → 操作人员 · 全链路溯源</p>
          </div>
        </div>

        <div className="relative flex-1 max-w-xs min-w-[160px]">
          <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${muted}`} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="批次号 / 工单 / 规格 / 设备 / 操作员"
            className={`w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border outline-none ${
              isMinimal ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-700 text-white'
            }`}
          />
        </div>

        <div className="flex gap-1">
          {(
            [
              { id: 'all' as const, label: '全部批次' },
              { id: 'anomaly' as const, label: '仅异常' },
              { id: 'current' as const, label: '当前工单' },
            ] as const
          ).map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterMode(f.id)}
              className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border cursor-pointer transition ${
                filterMode === f.id
                  ? 'bg-violet-600 text-white border-violet-500'
                  : isMinimal
                    ? 'bg-white text-slate-600 border-slate-200'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`rounded-xl p-2 cursor-pointer transition ${
            isMinimal ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* 批次列表 */}
        <aside className={`w-[260px] shrink-0 border-r overflow-y-auto scrollbar-thin ${panel}`}>
          <div className={`px-3 py-2 text-[10px] font-bold border-b ${isMinimal ? 'border-slate-100' : 'border-slate-800'}`}>
            生产批次 ({filteredBatches.length})
          </div>
          {filteredBatches.map(batch => {
            const style = TRACE_RESULT_STYLE[batch.overallResult];
            return (
              <button
                key={batch.batchNo}
                type="button"
                onClick={() => {
                  setSelectedBatchNo(batch.batchNo);
                  const nodes = getTracesForBatch(traces, batch.batchNo);
                  setSelectedTraceId(nodes.find(n => n.result === 'fail')?.id ?? nodes[0]?.id ?? null);
                }}
                className={`w-full text-left px-3 py-2.5 border-b transition cursor-pointer ${
                  selectedBatchNo === batch.batchNo
                    ? isMinimal
                      ? 'bg-violet-50 border-violet-200'
                      : 'bg-violet-950/30 border-violet-800/50'
                    : isMinimal
                      ? 'border-slate-100 hover:bg-slate-50'
                      : 'border-slate-800/80 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[10px] font-black truncate">{batch.batchNo}</span>
                  <span
                    className={`shrink-0 text-[8px] px-1.5 py-0.5 rounded border font-bold ${
                      isMinimal ? style.badgeMinimal : style.badge
                    }`}
                  >
                    {TRACE_RESULT_LABEL[batch.overallResult]}
                  </span>
                </div>
                <div className={`text-[9px] truncate ${muted}`}>{batch.spec}</div>
                <div className={`text-[8px] mt-0.5 flex gap-2 ${muted}`}>
                  <span>{batch.orderId}</span>
                  <span>良率 {batch.yieldRate}%</span>
                  {batch.anomalyCount > 0 && (
                    <span className="text-red-500 font-bold">{batch.anomalyCount} 异常点</span>
                  )}
                </div>
              </button>
            );
          })}
        </aside>

        {/* 工序时间线 */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {selectedBatch && (
            <div
              className={`shrink-0 px-4 py-2.5 border-b flex flex-wrap items-center gap-3 ${
                isMinimal ? 'bg-violet-50/50 border-slate-200' : 'bg-violet-950/20 border-slate-800'
              }`}
            >
              <div>
                <span className="text-[10px] font-black">{selectedBatch.batchNo}</span>
                <span className={`ml-2 text-[9px] ${muted}`}>
                  {selectedBatch.productType} · {selectedBatch.spec}
                </span>
              </div>
              <span className={`text-[9px] ${muted}`}>生产日期 {selectedBatch.productionDate}</span>
              <span className={`text-[9px] ${muted}`}>
                追溯节点 {selectedBatch.nodeCount} · 工单 {selectedBatch.orderId}
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
            <div className="max-w-lg mx-auto relative pl-6">
              <div
                className={`absolute left-[11px] top-2 bottom-2 w-0.5 ${
                  isMinimal ? 'bg-slate-200' : 'bg-slate-700'
                }`}
              />
              {batchTraces.map((trace, idx) => {
                const style = TRACE_RESULT_STYLE[trace.result];
                const isActive = selectedTrace?.id === trace.id;
                const badParams = getAnomalyParamCount(trace);

                return (
                  <button
                    key={trace.id}
                    type="button"
                    onClick={() => setSelectedTraceId(trace.id)}
                    className={`relative w-full text-left mb-4 last:mb-0 cursor-pointer group`}
                  >
                    <span
                      className={`absolute -left-[15px] top-3 h-3 w-3 rounded-full border-2 z-10 ${
                        style.dot
                      } ${isMinimal ? 'border-white' : 'border-slate-950'} ${
                        isActive ? 'ring-2 ring-violet-400 ring-offset-1' : ''
                      }`}
                    />
                    <div
                      className={`rounded-xl border p-3 transition ${
                        isActive
                          ? isMinimal
                            ? 'border-violet-400 bg-violet-50/80 shadow-md'
                            : 'border-violet-500/60 bg-violet-950/30 shadow-lg shadow-violet-900/20'
                          : isMinimal
                            ? 'border-slate-200 bg-white hover:border-violet-300'
                            : 'border-slate-800 bg-slate-900/60 hover:border-violet-700/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span className="text-[10px] font-black">
                            {idx + 1}. {trace.processLabel}
                          </span>
                          <span className={`ml-1.5 text-[9px] ${muted}`}>{trace.deviceCode}</span>
                        </div>
                        <span
                          className={`shrink-0 text-[8px] px-1.5 py-0.5 rounded border font-bold ${
                            isMinimal ? style.badgeMinimal : style.badge
                          }`}
                        >
                          {TRACE_RESULT_LABEL[trace.result]}
                        </span>
                      </div>
                      <div className={`text-[9px] mb-1 ${muted}`}>{trace.deviceName}</div>
                      <div className={`text-[8px] flex flex-wrap gap-x-3 ${muted}`}>
                        <span>{trace.timeRange}</span>
                        <span>{trace.operator}</span>
                        <span>{trace.shift}</span>
                        {trace.sampleNo && trace.sampleNo !== '—' && (
                          <span>样品 {trace.sampleNo}</span>
                        )}
                      </div>
                      {badParams > 0 && (
                        <div className="mt-1.5 text-[8px] text-red-500 font-medium">
                          {badParams} 项参数偏离标准
                        </div>
                      )}
                      {trace.anomaly && (
                        <div className="mt-1 text-[8px] text-amber-600 line-clamp-2">{trace.anomaly}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* 详情侧栏 */}
        {selectedTrace && (
          <aside className={`w-[340px] shrink-0 border-l flex flex-col overflow-hidden ${panel}`}>
            <div className={`shrink-0 px-4 py-3 border-b ${isMinimal ? 'border-slate-100' : 'border-slate-800'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[9px] px-2 py-0.5 rounded border font-bold ${
                    isMinimal
                      ? TRACE_RESULT_STYLE[selectedTrace.result].badgeMinimal
                      : TRACE_RESULT_STYLE[selectedTrace.result].badge
                  }`}
                >
                  {TRACE_RESULT_LABEL[selectedTrace.result]}
                </span>
                <span className="text-xs font-black">{selectedTrace.processLabel} 工序详情</span>
              </div>
              <div className={`text-[9px] ${muted}`}>{selectedTrace.deviceName}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              <div className={`rounded-xl border p-3 space-y-2 text-[10px] ${isMinimal ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                  <span>操作员：{selectedTrace.operator}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>{selectedTrace.timeRange} · {selectedTrace.shift}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>{selectedTrace.deviceCode} · 批次 {selectedTrace.batchNo}</span>
                </div>
              </div>

              {/* 参数对比表 */}
              <div>
                <div className="text-[10px] font-bold mb-1.5">工艺参数对比</div>
                <div className={`rounded-xl border overflow-hidden text-[9px] ${isMinimal ? 'border-slate-200' : 'border-slate-800'}`}>
                  <div
                    className={`grid grid-cols-4 gap-1 px-2 py-1.5 font-bold border-b ${
                      isMinimal ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>参数</span>
                    <span>标准</span>
                    <span>实测</span>
                    <span className="text-center">判定</span>
                  </div>
                  {selectedTrace.params.map(p => (
                    <div
                      key={p.label}
                      className={`grid grid-cols-4 gap-1 px-2 py-1.5 border-b last:border-0 ${
                        !p.normal
                          ? isMinimal
                            ? 'bg-red-50/80 border-red-100'
                            : 'bg-red-950/20 border-red-900/30'
                          : isMinimal
                            ? 'border-slate-100'
                            : 'border-slate-800/80'
                      }`}
                    >
                      <span className="font-medium">{p.label}</span>
                      <span className={muted}>{p.standard}</span>
                      <span className={!p.normal ? 'text-red-500 font-bold' : ''}>{p.value}</span>
                      <span className="text-center">
                        {p.normal ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 inline" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500 inline" />
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTrace.anomaly && (
                <div
                  className={`rounded-xl border p-3 text-[10px] ${
                    isMinimal ? 'bg-red-50 border-red-200 text-red-800' : 'bg-red-950/30 border-red-800/50 text-red-300'
                  }`}
                >
                  <div className="font-bold mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    异常分析
                  </div>
                  <p className="leading-relaxed opacity-90">{selectedTrace.anomaly}</p>
                </div>
              )}

              {selectedTrace.correctiveAction && (
                <div
                  className={`rounded-xl border p-3 text-[10px] ${
                    isMinimal ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/30 border-amber-700/50 text-amber-300'
                  }`}
                >
                  <div className="font-bold mb-1">处置措施</div>
                  <p className="leading-relaxed opacity-90">{selectedTrace.correctiveAction}</p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onFocusDevice(selectedTrace.deviceCode, selectedTrace.processStep);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold py-2 cursor-pointer transition"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  3D 聚焦该工序设备
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onAskAI(
                      `追溯批次 ${selectedTrace.batchNo} 在 ${selectedTrace.processLabel} 工序的异常原因`,
                    )
                  }
                  className={`flex items-center justify-center gap-1.5 rounded-xl border text-[11px] font-bold py-2 cursor-pointer transition ${
                    isMinimal
                      ? 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'
                      : 'border-violet-700 bg-violet-950/40 text-violet-300 hover:bg-violet-900/40'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  智能体分析根因
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = formatTraceExport(selectedBatchNo, batchTraces);
                    void navigator.clipboard.writeText(text);
                    alert('追溯报告已复制到剪贴板（演示）');
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border text-[11px] font-bold py-2 cursor-pointer transition ${
                    isMinimal
                      ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Download className="h-3.5 w-3.5" />
                  导出追溯报告
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
