/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ProcessStepId,
  ProductionOrder,
  QualityBatchSummary,
  QualityTrace,
  QualityTraceResult,
} from './types';

export const TRACE_RESULT_LABEL: Record<QualityTraceResult, string> = {
  pass: '合格',
  warning: '预警',
  fail: '不合格',
};

export const TRACE_RESULT_STYLE: Record<
  QualityTraceResult,
  { dot: string; badge: string; badgeMinimal: string }
> = {
  pass: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-950/50 text-emerald-400 border-emerald-700',
    badgeMinimal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  warning: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-950/50 text-amber-400 border-amber-700',
    badgeMinimal: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  fail: {
    dot: 'bg-red-500 animate-pulse',
    badge: 'bg-red-950/50 text-red-400 border-red-700',
    badgeMinimal: 'bg-red-50 text-red-700 border-red-200',
  },
};

export const PROCESS_STEP_ORDER: ProcessStepId[] = [
  'drawing',
  'stranding',
  'insulation',
  'sheathing',
  'winding',
];

const SPEC_MAP: Record<string, string> = {
  'SO-260609-18': 'YJV-3x240 阻燃交联',
  'SO-260609-21': 'BV-2.5 硬导线',
  'SO-260609-25': 'WDZ-BYJ 低烟无卤',
  'SO-260608-11': 'KVVP-4x1.5 控制电缆',
};

export function buildBatchSummaries(
  traces: QualityTrace[],
  orders: ProductionOrder[],
): QualityBatchSummary[] {
  const batchMap = new Map<string, QualityTrace[]>();
  traces.forEach(t => {
    const list = batchMap.get(t.batchNo) ?? [];
    list.push(t);
    batchMap.set(t.batchNo, list);
  });

  return Array.from(batchMap.entries()).map(([batchNo, nodes]) => {
    const order = orders.find(o => o.batchNo === batchNo || o.id === nodes[0]?.orderId);
    const anomalyCount = nodes.filter(n => n.result !== 'pass').length;
    const worst: QualityTraceResult =
      nodes.some(n => n.result === 'fail') ? 'fail' : nodes.some(n => n.result === 'warning') ? 'warning' : 'pass';

    return {
      batchNo,
      orderId: nodes[0]?.orderId ?? '',
      productType: nodes[0]?.productType ?? '',
      spec: SPEC_MAP[nodes[0]?.orderId ?? ''] ?? nodes[0]?.productType ?? '',
      overallResult: worst,
      yieldRate: order?.qualityRate ?? 99,
      anomalyCount,
      nodeCount: nodes.length,
      productionDate: batchNo.includes('20260609') ? '2026-06-09' : '2026-06-08',
    };
  });
}

export function getTracesForBatch(traces: QualityTrace[], batchNo: string): QualityTrace[] {
  return traces
    .filter(t => t.batchNo === batchNo)
    .sort((a, b) => PROCESS_STEP_ORDER.indexOf(a.processStep) - PROCESS_STEP_ORDER.indexOf(b.processStep));
}

export function searchTraces(traces: QualityTrace[], query: string): QualityTrace[] {
  const q = query.trim().toLowerCase();
  if (!q) return traces;
  return traces.filter(
    t =>
      t.batchNo.toLowerCase().includes(q) ||
      t.orderId.toLowerCase().includes(q) ||
      t.productType.toLowerCase().includes(q) ||
      t.deviceCode.toLowerCase().includes(q) ||
      t.deviceName.toLowerCase().includes(q) ||
      t.operator.toLowerCase().includes(q) ||
      t.processLabel.includes(q),
  );
}

export function filterTracesByMode(
  traces: QualityTrace[],
  mode: 'all' | 'anomaly' | 'current',
  currentOrderId?: string | null,
): QualityTrace[] {
  if (mode === 'anomaly') return traces.filter(t => t.result !== 'pass');
  if (mode === 'current' && currentOrderId) return traces.filter(t => t.orderId === currentOrderId);
  return traces;
}

export function getAnomalyParamCount(trace: QualityTrace): number {
  return trace.params.filter(p => !p.normal).length;
}

export function getBatchOverallResult(traces: QualityTrace[]): QualityTraceResult {
  if (traces.some(t => t.result === 'fail')) return 'fail';
  if (traces.some(t => t.result === 'warning')) return 'warning';
  return 'pass';
}

export function formatTraceExport(batchNo: string, traces: QualityTrace[]): string {
  const lines = [`质量追溯报告 · ${batchNo}`, `生成时间: ${new Date().toLocaleString('zh-CN')}`, ''];
  traces.forEach(t => {
    lines.push(`【${t.processLabel}】${t.deviceName} (${t.deviceCode})`);
    lines.push(`  时段: ${t.timeRange} · 操作: ${t.operator} · 结论: ${TRACE_RESULT_LABEL[t.result]}`);
    t.params.forEach(p => {
      lines.push(`  · ${p.label}: ${p.value} (标准 ${p.standard}) ${p.normal ? '✓' : '✗'}`);
    });
    if (t.anomaly) lines.push(`  异常: ${t.anomaly}`);
    if (t.correctiveAction) lines.push(`  处置: ${t.correctiveAction}`);
    lines.push('');
  });
  return lines.join('\n');
}
