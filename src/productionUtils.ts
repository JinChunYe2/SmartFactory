/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Device,
  ProcessStep,
  ProcessStepId,
  ProcessStepStatus,
  ProductionLineMetrics,
  ProductionOrder,
  QualityTrace,
} from './types';

export const PROCESS_STEP_STATUS_LABEL: Record<ProcessStepStatus, string> = {
  running: '正常生产',
  idle: '待机',
  blocked: '堵塞',
  stopped: '停机',
};

export const PROCESS_STEP_STATUS_COLOR: Record<ProcessStepStatus, string> = {
  running: 'text-emerald-500',
  idle: 'text-slate-400',
  blocked: 'text-amber-500',
  stopped: 'text-red-500',
};

export const PROCESS_STEP_DOT: Record<ProcessStepStatus, string> = {
  running: 'bg-emerald-500',
  idle: 'bg-slate-400',
  blocked: 'bg-amber-500 animate-pulse',
  stopped: 'bg-red-500 animate-ping',
};

export const SHIFT_FILTERS = [
  { id: 'day' as const, label: '白班' },
  { id: 'night' as const, label: '夜班' },
  { id: 'all' as const, label: '全部' },
];

export function getProductionLineStatus(device: Device): ProcessStepStatus {
  if (device.status === 'error') return 'stopped';
  if (device.status === 'bottleneck') return 'blocked';
  if (device.status === 'idle') return 'idle';
  if (device.status === 'warning') return 'blocked';
  return 'running';
}

export function getProductionLineColor(status: ProcessStepStatus): string {
  if (status === 'running') return 'rgba(16,185,129,0.25)';
  if (status === 'idle') return 'rgba(100,116,139,0.15)';
  if (status === 'blocked') return 'rgba(245,158,11,0.28)';
  return 'rgba(239,68,68,0.30)';
}

export function getProductionBorderColor(status: ProcessStepStatus, theme: 'cyberpunk' | 'minimalist'): string {
  if (status === 'running') return theme === 'minimalist' ? 'border-emerald-400' : 'border-emerald-500/60';
  if (status === 'idle') return theme === 'minimalist' ? 'border-slate-300' : 'border-slate-600';
  if (status === 'blocked') return theme === 'minimalist' ? 'border-amber-400' : 'border-amber-500/60';
  return theme === 'minimalist' ? 'border-red-400' : 'border-red-500/70';
}

export function filterLineMetrics(
  metrics: ProductionLineMetrics[],
  shift: 'day' | 'night' | 'all',
  batchFilter: string,
): ProductionLineMetrics[] {
  let result = [...metrics];
  if (shift === 'night') {
    result = result.map(m => ({
      ...m,
      outputKm: parseFloat((m.outputKm * 0.42).toFixed(1)),
      lineSpeed: Math.round(m.lineSpeed * 0.85),
      wireBreakCount: Math.max(0, m.wireBreakCount - 1),
    }));
  }
  if (batchFilter !== 'all') {
    result = result.filter(m =>
      batchFilter === 'SO-260609-18'
        ? ['LSJ-001', 'CLJ-003', 'JSX-004'].includes(m.deviceCode)
        : batchFilter === 'SO-260609-21'
          ? m.deviceCode === 'SXJ-002'
          : true,
    );
  }
  return result;
}

export function getTracesForOrder(traces: QualityTrace[], orderId: string): QualityTrace[] {
  return traces.filter(t => t.orderId === orderId);
}

export function getProcessStepById(steps: ProcessStep[], id: ProcessStepId): ProcessStep | undefined {
  return steps.find(s => s.id === id);
}

export function getOrderStatusFlow(order: ProductionOrder): { key: ProductionOrder['orderStatus']; done: boolean; current: boolean }[] {
  const flow: ProductionOrder['orderStatus'][] = ['scheduled', 'in_progress', 'qc_pending', 'completed'];
  const idx = order.orderStatus === 'exception' ? 1 : flow.indexOf(order.orderStatus);
  return flow.map((key, i) => ({
    key,
    done: i < idx || order.orderStatus === 'completed',
    current: i === idx,
  }));
}

export function sortLinesByOee(metrics: ProductionLineMetrics[]): ProductionLineMetrics[] {
  return [...metrics].sort((a, b) => b.oee - a.oee);
}

export function buildProduction3dTransform(focus?: { offsetX: number; offsetY: number; scale: number }) {
  if (!focus) return 'perspective(1400px) rotateX(42deg) rotateZ(-12deg) scale(0.9)';
  return `perspective(1400px) rotateX(42deg) rotateZ(-12deg) scale(${focus.scale * 0.9}) translate(${focus.offsetX}px, ${focus.offsetY}px)`;
}

export const REPORT_PERIODS = [
  { id: 'day' as const, label: '日报' },
  { id: 'week' as const, label: '周报' },
  { id: 'month' as const, label: '月报' },
];
