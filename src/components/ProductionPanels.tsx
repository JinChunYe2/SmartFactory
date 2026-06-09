/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  Factory,
  GitBranch,
  TrendingUp,
} from 'lucide-react';
import {
  ProcessStep,
  ProcessStepId,
  ProductionLineMetrics,
  ProductionOrder,
  ProductionOverview,
  PRODUCTION_ORDER_STATUS_LABEL,
  QualityTrace,
} from '../types';
import {
  getOrderStatusFlow,
  PROCESS_STEP_DOT,
  PROCESS_STEP_STATUS_COLOR,
  PROCESS_STEP_STATUS_LABEL,
  REPORT_PERIODS,
  SHIFT_FILTERS,
  sortLinesByOee,
} from '../productionUtils';
import { QualityTracePanel } from './QualityTracePanel';
import { BatchReportPreviewModal } from './BatchReportPreviewModal';
import type { ReportPeriod } from '../batchReportUtils';
import { panelCard, panelInner, panelTitle, panelMuted, panelValue } from '../themeStyles';

type Theme = 'cyberpunk' | 'minimalist';

interface ProductionLeftPanelProps {
  theme: Theme;
  overview: ProductionOverview;
  orders: ProductionOrder[];
  processSteps: ProcessStep[];
  selectedOrderId: string | null;
  selectedProcessStepId: ProcessStepId | null;
  onSelectOrder: (id: string) => void;
  onSelectProcessStep: (id: ProcessStepId) => void;
}

export function ProductionLeftPanel({
  theme,
  overview,
  orders,
  processSteps,
  selectedOrderId,
  selectedProcessStepId,
  onSelectOrder,
  onSelectProcessStep,
}: ProductionLeftPanelProps) {
  const card = panelCard(theme);
  const inner = panelInner(theme);
  const title = panelTitle(theme);
  const muted = panelMuted(theme);

  return (
    <div className="flex flex-col gap-3.5">
      {/* 生产总览看板 P0 */}
      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <Factory className="h-4 w-4 text-emerald-500" />
          生产总览看板
        </h3>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: '当班产量', value: `${overview.shiftOutputKm} km`, color: 'text-emerald-500' },
            { label: '今日总产量', value: `${overview.dailyOutputKm} km`, color: theme === 'minimalist' ? 'text-indigo-600' : 'text-indigo-400' },
            { label: '订单完成率', value: `${overview.orderCompletionRate}%`, color: 'text-emerald-500' },
            { label: '整体良率', value: `${overview.overallYield}%`, color: 'text-emerald-500' },
            { label: '产线 OEE', value: `${overview.avgOee}%`, color: overview.avgOee >= 85 ? 'text-emerald-500' : 'text-amber-500' },
            { label: '累计断线', value: `${overview.totalWireBreaks} 次`, color: 'text-red-500' },
          ].map(item => (
            <div key={item.label} className={`p-2 rounded-lg text-center border ${inner}`}>
              <div className={`text-[8px] ${muted}`}>{item.label}</div>
              <div className={`text-sm font-black ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
        <div className={`mt-2 text-[9px] ${muted}`}>
          日计划达成 {overview.dailyPlanProgress}% · 多批次连续化生产监控中
        </div>
      </section>

      {/* 工单管理 P0 */}
      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <ClipboardList className="h-4 w-4 text-emerald-500" />
          在制工单管理
        </h3>
        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto scrollbar-thin">
          {orders.map(order => {
            const flow = getOrderStatusFlow(order);
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => onSelectOrder(order.id)}
                className={`text-left p-2.5 rounded-xl border transition cursor-pointer ${
                  selectedOrderId === order.id
                    ? 'border-emerald-500 ring-1 ring-emerald-500/40'
                    : inner
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-black ${panelValue(theme)}`}>{order.id}</span>
                  <span
                    className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                      order.orderStatus === 'exception' || order.status === 'bottleneck'
                        ? 'bg-red-100 text-red-600'
                        : order.orderStatus === 'qc_pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {order.orderStatus === 'exception'
                      ? '异常挂账'
                      : PRODUCTION_ORDER_STATUS_LABEL[order.orderStatus]}
                  </span>
                </div>
                <div className={`text-[9px] truncate mb-1 ${muted}`}>{order.productType}</div>
                <div className={`text-[8px] mb-1.5 ${muted}`}>
                  批次 {order.batchNo} · 交付 {order.deliveryTime}
                </div>
                <div className={`flex items-center justify-between text-[9px] mb-1 ${muted}`}>
                  <span>{order.completedQty}/{order.plannedQty} km</span>
                  <span className="font-bold">{order.completionRate}%</span>
                </div>
                <div className={`h-1 rounded-full overflow-hidden ${theme === 'minimalist' ? 'bg-slate-200' : 'bg-slate-900'}`}>
                  <div
                    className={`h-full ${order.status === 'bottleneck' ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${order.completionRate}%` }}
                  />
                </div>
                <div className="flex items-center gap-0.5 mt-2">
                  {flow.map((step, i) => (
                    <React.Fragment key={step.key}>
                      <span
                        className={`text-[7px] px-1 py-0.5 rounded ${
                          step.current
                            ? 'bg-emerald-600 text-white font-bold'
                            : step.done
                              ? 'bg-emerald-100 text-emerald-700'
                              : theme === 'minimalist'
                                ? 'bg-slate-100 text-slate-400'
                                : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {PRODUCTION_ORDER_STATUS_LABEL[step.key]}
                      </span>
                      {i < flow.length - 1 && <ChevronRight className={`h-2.5 w-2.5 ${muted}`} />}
                    </React.Fragment>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 工序流程看板 P0 */}
      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <GitBranch className="h-4 w-4 text-emerald-500" />
          工序流程看板
        </h3>
        <div className="flex flex-col gap-1.5">
          {processSteps.map((step, idx) => (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelectProcessStep(step.id)}
              className={`text-left p-2 rounded-xl border transition cursor-pointer ${
                selectedProcessStepId === step.id
                  ? 'border-emerald-500 bg-emerald-950/10'
                  : inner
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${PROCESS_STEP_DOT[step.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-bold ${panelValue(theme)}`}>
                      {idx + 1}. {step.label}
                    </span>
                    <span className={`text-[9px] font-bold ${PROCESS_STEP_STATUS_COLOR[step.status]}`}>
                      {PROCESS_STEP_STATUS_LABEL[step.status]}
                    </span>
                  </div>
                  <div className={`text-[8px] truncate ${muted}`}>
                    {step.deviceName} · 在制品 {step.wipQty} {step.wipUnit}
                    {step.orderId && ` · ${step.orderId}`}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

interface ProductionRightPanelProps {
  theme: Theme;
  lineMetrics: ProductionLineMetrics[];
  qualityTraces: QualityTrace[];
  selectedOrderId: string | null;
  shiftFilter: 'day' | 'night' | 'all';
  batchFilter: string;
  orders: ProductionOrder[];
  onShiftChange: (s: 'day' | 'night' | 'all') => void;
  onBatchChange: (b: string) => void;
  onOpenTraceExplorer: (batchNo?: string, traceId?: string) => void;
  onAskAI: (q: string) => void;
}

export function ProductionRightPanel({
  theme,
  lineMetrics,
  qualityTraces,
  selectedOrderId,
  shiftFilter,
  batchFilter,
  orders,
  onShiftChange,
  onBatchChange,
  onOpenTraceExplorer,
  onAskAI,
}: ProductionRightPanelProps) {
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('day');
  const [reportPreviewOpen, setReportPreviewOpen] = useState(false);
  const card = panelCard(theme);
  const inner = panelInner(theme);
  const title = panelTitle(theme);
  const muted = panelMuted(theme);

  const rankedLines = sortLinesByOee(lineMetrics);

  return (
    <div className="flex flex-col gap-3.5">
      {/* 产线实时数据 P0 */}
      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <Activity className="h-4 w-4 text-emerald-500" />
          产线实时数据
        </h3>
        <div className="flex flex-wrap gap-1 mb-2">
          {SHIFT_FILTERS.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => onShiftChange(s.id)}
              className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold cursor-pointer transition ${
                shiftFilter === s.id
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : theme === 'minimalist'
                    ? 'bg-white text-slate-600 border-slate-200'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <select
          value={batchFilter}
          onChange={e => onBatchChange(e.target.value)}
          className={`w-full mb-2 text-[10px] rounded-lg border px-2 py-1.5 outline-none cursor-pointer ${
            theme === 'minimalist' ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          <option value="all">全部批次/工单</option>
          {orders.map(o => (
            <option key={o.id} value={o.id}>
              {o.id} · {o.batchNo}
            </option>
          ))}
        </select>
        <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto scrollbar-thin">
          {lineMetrics.map(line => (
            <div key={line.lineId} className={`p-2 rounded-xl border text-[9px] ${inner}`}>
              <div className="flex justify-between font-bold mb-0.5">
                <span className={panelValue(theme)}>{line.lineName}</span>
                <span className={line.oee >= 85 ? 'text-emerald-500' : line.oee >= 70 ? 'text-amber-500' : 'text-red-500'}>
                  OEE {line.oee}%
                </span>
              </div>
              <div className={`grid grid-cols-2 gap-x-2 ${muted}`}>
                <span>产量 {line.outputKm} km</span>
                <span>线速 {line.lineSpeed} m/min</span>
                <span>断线 {line.wireBreakCount} 次</span>
                <span>次品率 {line.defectRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <QualityTracePanel
        theme={theme}
        traces={qualityTraces}
        orders={orders}
        selectedOrderId={selectedOrderId}
        onOpenExplorer={onOpenTraceExplorer}
      />

      {/* 产线效率分析 P1 */}
      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <TrendingUp className="h-4 w-4 text-amber-500" />
          产线效率分析
        </h3>
        <div className="flex flex-col gap-1.5">
          {rankedLines.map((line, idx) => (
            <div key={line.lineId} className={`p-2 rounded-xl border text-[9px] ${inner}`}>
              <div className="flex justify-between mb-1">
                <span className={`font-bold ${panelValue(theme)}`}>
                  #{idx + 1} {line.lineName}
                </span>
                <span className="text-emerald-500 font-black">OEE {line.oee}%</span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden mb-1 ${theme === 'minimalist' ? 'bg-slate-200' : 'bg-slate-900'}`}>
                <div className="h-full bg-emerald-500" style={{ width: `${line.oee}%` }} />
              </div>
              <div className={`flex gap-2 ${muted}`}>
                <span>有效运行 {line.effectiveRunHours}h</span>
                <span>待机 {line.idleRatio}%</span>
                <span>停机 {line.downtimeRatio}%</span>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onAskAI('当前生产瓶颈在哪个工序')}
          className="mt-2 text-[9px] text-emerald-500 underline cursor-pointer"
        >
          智能体：分析效率损失原因
        </button>
      </section>

      {/* 批次报表 P2 */}
      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <BarChart3 className="h-4 w-4 text-indigo-500" />
          批次报表
        </h3>
        <div className="flex gap-1 mb-2">
          {REPORT_PERIODS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setReportPeriod(p.id)}
              className={`flex-1 text-[9px] py-1 rounded-lg border font-bold cursor-pointer transition ${
                reportPeriod === p.id
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : theme === 'minimalist'
                    ? 'bg-white text-slate-600 border-slate-200'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className={`p-2 rounded-xl border text-[9px] space-y-1 ${inner}`}>
          <div className="flex justify-between">
            <span className={muted}>生产总量</span>
            <span className={`font-bold ${panelValue(theme)}`}>
              {reportPeriod === 'day' ? '42.8 km' : reportPeriod === 'week' ? '286 km' : '1,120 km'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={muted}>平均良率</span>
            <span className="font-bold text-emerald-500">98.9%</span>
          </div>
          <div className="flex justify-between">
            <span className={muted}>断线合计</span>
            <span className="font-bold text-red-500">{reportPeriod === 'day' ? '7' : reportPeriod === 'week' ? '34' : '128'} 次</span>
          </div>
        </div>
        <div className="flex gap-1.5 mt-2">
          <button
            type="button"
            onClick={() => setReportPreviewOpen(true)}
            className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 rounded-lg border font-bold cursor-pointer transition ${
              theme === 'minimalist'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                : 'bg-indigo-950/40 border-indigo-700/50 text-indigo-300 hover:bg-indigo-900/50'
            }`}
          >
            <Eye className="h-3 w-3" />
            预览报表
          </button>
          <button
            type="button"
            onClick={() => setReportPreviewOpen(true)}
            className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 rounded-lg border font-bold cursor-pointer transition ${
              theme === 'minimalist'
                ? 'bg-white border-slate-200 hover:border-indigo-400 text-slate-700'
                : 'bg-slate-900 border-slate-700 hover:border-indigo-500 text-slate-300'
            }`}
          >
            <Download className="h-3 w-3" />
            导出报表
          </button>
        </div>

        {reportPreviewOpen && (
          <BatchReportPreviewModal
            theme={theme}
            period={reportPeriod}
            orders={orders}
            onClose={() => setReportPreviewOpen(false)}
            onPeriodChange={setReportPeriod}
          />
        )}
      </section>
    </div>
  );
}
