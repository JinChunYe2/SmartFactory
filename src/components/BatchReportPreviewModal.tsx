/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo } from 'react';
import {
  X,
  Download,
  Printer,
  BarChart3,
  Factory,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { ProductionOrder } from '../types';
import {
  BatchReportData,
  ReportPeriod,
  buildBatchReport,
  formatBatchReportText,
} from '../batchReportUtils';
import { REPORT_PERIODS } from '../productionUtils';

type Theme = 'cyberpunk' | 'minimalist';

interface BatchReportPreviewModalProps {
  theme: Theme;
  period: ReportPeriod;
  orders: ProductionOrder[];
  onClose: () => void;
  onPeriodChange?: (period: ReportPeriod) => void;
}

function TrendBars({
  report,
  theme,
}: {
  report: BatchReportData;
  theme: Theme;
}) {
  const isMinimal = theme === 'minimalist';
  const maxOut = Math.max(...report.trend.map(t => t.outputKm));

  return (
    <div className="space-y-2">
      <div className={`text-[10px] font-bold ${isMinimal ? 'text-slate-700' : 'text-slate-300'}`}>
        产量 / 良率趋势
      </div>
      <div className="flex items-end gap-1.5 h-24">
        {report.trend.map(point => (
          <div key={point.label} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
            <span className={`text-[7px] font-bold ${isMinimal ? 'text-emerald-600' : 'text-emerald-400'}`}>
              {point.yieldRate}%
            </span>
            <div
              className={`w-full rounded-t-md transition-all ${
                isMinimal ? 'bg-indigo-400' : 'bg-indigo-500'
              }`}
              style={{ height: `${Math.max(12, (point.outputKm / maxOut) * 72)}px` }}
              title={`${point.outputKm} km`}
            />
            <span className={`text-[7px] truncate w-full text-center ${isMinimal ? 'text-slate-500' : 'text-slate-400'}`}>
              {point.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BatchReportPreviewModal({
  theme,
  period,
  orders,
  onClose,
  onPeriodChange,
}: BatchReportPreviewModalProps) {
  const isMinimal = theme === 'minimalist';
  const report = useMemo(() => buildBatchReport(period, orders), [period, orders]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const panel = isMinimal ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700';
  const muted = isMinimal ? 'text-slate-500' : 'text-slate-400';
  const headCell = isMinimal ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700';

  const handleExport = () => {
    const text = formatBatchReportText(report);
    void navigator.clipboard.writeText(text);
    alert(`${report.periodLabel}已复制到剪贴板，可粘贴至 Excel / 飞书文档（演示）`);
  };

  return (
    <div
      className={`fixed inset-0 z-[220] flex items-center justify-center p-4 backdrop-blur-sm ${
        isMinimal ? 'bg-slate-900/40' : 'bg-slate-950/75'
      }`}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-[720px] max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${panel}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`shrink-0 px-5 py-4 border-b ${
            isMinimal ? 'bg-indigo-50 border-indigo-100' : 'bg-indigo-950/40 border-indigo-800/50'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl ${isMinimal ? 'bg-indigo-100' : 'bg-indigo-900/60'}`}
              >
                <FileText className={`h-5 w-5 ${isMinimal ? 'text-indigo-600' : 'text-indigo-400'}`} />
              </div>
              <div>
                <h2 className={`text-base font-black ${isMinimal ? 'text-slate-900' : 'text-white'}`}>
                  {report.title}
                </h2>
                <p className={`text-[10px] mt-0.5 ${muted}`}>{report.subtitle}</p>
                <p className={`text-[9px] mt-1 ${muted}`}>
                  {report.factoryName} · {report.department}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg p-1.5 cursor-pointer transition ${
                isMinimal ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {REPORT_PERIODS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPeriodChange?.(p.id)}
                className={`text-[9px] px-2.5 py-1 rounded-lg font-bold border cursor-pointer transition ${
                  period === p.id
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : isMinimal
                      ? 'bg-white text-slate-600 border-slate-200'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
            <span className={`text-[9px] ml-auto ${muted}`}>
              周期 {report.dateRange} · 生成 {report.generatedAt}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {/* KPI 卡片 */}
          <div className="grid grid-cols-3 gap-2">
            {report.kpis.map(kpi => (
              <div
                key={kpi.label}
                className={`rounded-xl border p-2.5 ${isMinimal ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}
              >
                <div className={`text-[8px] font-medium ${muted}`}>{kpi.label}</div>
                <div className={`text-sm font-black mt-0.5 ${isMinimal ? 'text-slate-900' : 'text-white'}`}>
                  {kpi.value}
                </div>
                {kpi.sub && <div className={`text-[8px] ${muted}`}>{kpi.sub}</div>}
                {kpi.trend && (
                  <div
                    className={`text-[8px] font-bold mt-0.5 ${
                      kpi.trendGood === false ? 'text-red-500' : kpi.trendGood ? 'text-emerald-500' : muted
                    }`}
                  >
                    {kpi.trend}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 趋势 + 班次 */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl border p-3 ${isMinimal ? 'border-slate-200' : 'border-slate-800'}`}>
              <TrendBars report={report} theme={theme} />
            </div>
            <div className={`rounded-xl border p-3 ${isMinimal ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className={`text-[10px] font-bold mb-2 flex items-center gap-1 ${isMinimal ? 'text-slate-700' : 'text-slate-300'}`}>
                <Factory className="h-3.5 w-3.5 text-indigo-500" />
                班次产量
              </div>
              {report.shifts.map(s => (
                <div key={s.shift} className={`mb-2 last:mb-0 text-[9px] ${isMinimal ? 'text-slate-600' : 'text-slate-400'}`}>
                  <div className="flex justify-between font-bold mb-0.5">
                    <span>{s.shift}</span>
                    <span className={isMinimal ? 'text-slate-800' : 'text-slate-200'}>{s.outputKm} km</span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden mb-0.5 ${isMinimal ? 'bg-slate-200' : 'bg-slate-800'}`}>
                    <div className="h-full bg-indigo-500" style={{ width: `${s.oee}%` }} />
                  </div>
                  <div className={muted}>OEE {s.oee}% · 在岗 {s.headcount} 人</div>
                </div>
              ))}
            </div>
          </div>

          {/* 产线明细表 */}
          <div>
            <div className={`text-[10px] font-bold mb-1.5 flex items-center gap-1 ${isMinimal ? 'text-slate-700' : 'text-slate-300'}`}>
              <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
              产线生产明细
            </div>
            <div className={`rounded-xl border overflow-hidden text-[9px] ${isMinimal ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className={`grid grid-cols-6 gap-1 px-2 py-1.5 font-bold border-b ${headCell}`}>
                <span className="col-span-2">产线</span>
                <span>产量</span>
                <span>OEE</span>
                <span>断线</span>
                <span>次品率</span>
              </div>
              {report.lines.map(line => (
                <div
                  key={line.lineName}
                  className={`grid grid-cols-6 gap-1 px-2 py-1.5 border-b last:border-0 ${
                    line.oee < 70
                      ? isMinimal ? 'bg-red-50/50 border-red-100' : 'bg-red-950/15 border-red-900/20'
                      : isMinimal ? 'border-slate-100' : 'border-slate-800/80'
                  }`}
                >
                  <span className="col-span-2 font-medium">{line.lineName}</span>
                  <span>{line.outputKm} km</span>
                  <span className={line.oee >= 85 ? 'text-emerald-500 font-bold' : line.oee >= 70 ? 'text-amber-500' : 'text-red-500 font-bold'}>
                    {line.oee}%
                  </span>
                  <span>{line.wireBreaks}</span>
                  <span>{line.defectRate}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* 工单批次表 */}
          <div>
            <div className={`text-[10px] font-bold mb-1.5 ${isMinimal ? 'text-slate-700' : 'text-slate-300'}`}>
              在制 / 完工工单批次
            </div>
            <div className={`rounded-xl border overflow-hidden text-[9px] ${isMinimal ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className={`grid grid-cols-7 gap-1 px-2 py-1.5 font-bold border-b ${headCell}`}>
                <span>工单</span>
                <span className="col-span-2">产品规格</span>
                <span>完成量</span>
                <span>进度</span>
                <span>良率</span>
                <span>状态</span>
              </div>
              {report.orders.map(o => (
                <div
                  key={o.orderId}
                  className={`grid grid-cols-7 gap-1 px-2 py-1.5 border-b last:border-0 ${
                    o.status === '瓶颈'
                      ? isMinimal ? 'bg-amber-50/60 border-amber-100' : 'bg-amber-950/20 border-amber-900/30'
                      : isMinimal ? 'border-slate-100' : 'border-slate-800/80'
                  }`}
                >
                  <span className="font-mono font-bold">{o.orderId.slice(-8)}</span>
                  <span className="col-span-2 truncate" title={o.product}>{o.product}</span>
                  <span>{o.completedKm}/{o.plannedKm} km</span>
                  <span>{o.completionRate}%</span>
                  <span className="text-emerald-500">{o.qualityRate}%</span>
                  <span className={o.status === '瓶颈' ? 'text-red-500 font-bold' : muted}>{o.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 质量汇总 + 缺陷 TOP */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl border p-3 ${isMinimal ? 'border-slate-200 bg-emerald-50/30' : 'border-slate-800 bg-emerald-950/10'}`}>
              <div className={`text-[10px] font-bold mb-2 flex items-center gap-1 ${isMinimal ? 'text-slate-700' : 'text-slate-300'}`}>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                质量批次汇总
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                {[
                  { label: '合格', value: report.quality.passBatches, color: 'text-emerald-500' },
                  { label: '预警', value: report.quality.warningBatches, color: 'text-amber-500' },
                  { label: '不合格', value: report.quality.failBatches, color: 'text-red-500' },
                ].map(item => (
                  <div key={item.label}>
                    <div className={`text-lg font-black ${item.color}`}>{item.value}</div>
                    <div className={`text-[8px] ${muted}`}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div className={`text-[9px] space-y-0.5 ${muted}`}>
                <div>综合良率 <span className="font-bold text-emerald-500">{report.quality.overallYield}%</span></div>
                <div>质检 {report.quality.inspectCount} 批 · 返工 {report.quality.reworkKm} km</div>
              </div>
            </div>

            <div className={`rounded-xl border p-3 ${isMinimal ? 'border-slate-200' : 'border-slate-800'}`}>
              <div className={`text-[10px] font-bold mb-2 flex items-center gap-1 ${isMinimal ? 'text-slate-700' : 'text-slate-300'}`}>
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                缺陷原因 TOP
              </div>
              <div className="space-y-1.5">
                {report.defects.map(d => (
                  <div key={d.reason}>
                    <div className="flex justify-between text-[9px] mb-0.5">
                      <span className={isMinimal ? 'text-slate-700' : 'text-slate-300'}>{d.reason}</span>
                      <span className={muted}>{d.count} 次 · {d.pct}%</span>
                    </div>
                    <div className={`h-1 rounded-full overflow-hidden ${isMinimal ? 'bg-slate-200' : 'bg-slate-800'}`}>
                      <div className="h-full bg-amber-500" style={{ width: `${d.pct}%` }} />
                    </div>
                    <div className={`text-[7px] ${muted}`}>{d.process}工序</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 备注 */}
          <div className={`rounded-xl border p-3 ${isMinimal ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
            <div className={`text-[10px] font-bold mb-1.5 flex items-center gap-1 ${isMinimal ? 'text-slate-700' : 'text-slate-300'}`}>
              <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
              分析备注
            </div>
            <ul className={`text-[9px] space-y-1 list-disc pl-4 ${muted}`}>
              {report.remarks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          <div className={`text-[8px] flex justify-between pt-1 border-t ${isMinimal ? 'border-slate-200 text-slate-400' : 'border-slate-800 text-slate-500'}`}>
            <span>编制：{report.preparedBy}</span>
            <span>审核：{report.approvedBy}</span>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`shrink-0 flex gap-2 px-5 py-3 border-t ${
            isMinimal ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => alert('已发送至默认打印机（演示）')}
            className={`flex items-center justify-center gap-1.5 flex-1 rounded-xl border text-[11px] font-bold py-2 cursor-pointer transition ${
              isMinimal
                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Printer className="h-3.5 w-3.5" />
            打印
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-center gap-1.5 flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold py-2 cursor-pointer transition"
          >
            <Download className="h-3.5 w-3.5" />
            导出报表
          </button>
        </div>
      </div>
    </div>
  );
}
