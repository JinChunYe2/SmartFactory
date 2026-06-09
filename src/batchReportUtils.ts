/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProductionOrder } from './types';
import { REPORT_PERIODS } from './productionUtils';

export type ReportPeriod = 'day' | 'week' | 'month';

export interface ReportKpi {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  trendGood?: boolean;
}

export interface ReportLineRow {
  lineName: string;
  outputKm: number;
  oee: number;
  wireBreaks: number;
  defectRate: number;
  runHours: number;
}

export interface ReportOrderRow {
  orderId: string;
  batchNo: string;
  product: string;
  plannedKm: number;
  completedKm: number;
  completionRate: number;
  qualityRate: number;
  status: string;
}

export interface ReportShiftRow {
  shift: string;
  outputKm: number;
  oee: number;
  headcount: number;
}

export interface ReportDefectRow {
  reason: string;
  count: number;
  pct: number;
  process: string;
}

export interface ReportTrendPoint {
  label: string;
  outputKm: number;
  yieldRate: number;
}

export interface BatchReportData {
  period: ReportPeriod;
  periodLabel: string;
  title: string;
  subtitle: string;
  dateRange: string;
  generatedAt: string;
  factoryName: string;
  department: string;
  kpis: ReportKpi[];
  shifts: ReportShiftRow[];
  lines: ReportLineRow[];
  orders: ReportOrderRow[];
  quality: {
    passBatches: number;
    warningBatches: number;
    failBatches: number;
    overallYield: number;
    inspectCount: number;
    reworkKm: number;
  };
  defects: ReportDefectRow[];
  trend: ReportTrendPoint[];
  remarks: string[];
  preparedBy: string;
  approvedBy: string;
}

const PERIOD_META: Record<
  ReportPeriod,
  { title: string; dateRange: string; outputKm: number; wireBreaks: number; oee: number; inspect: number; rework: number }
> = {
  day: {
    title: '生产质量日报',
    dateRange: '2026-06-09（白班 + 夜班）',
    outputKm: 42.8,
    wireBreaks: 7,
    oee: 81.2,
    inspect: 12,
    rework: 0.6,
  },
  week: {
    title: '生产质量周报',
    dateRange: '2026-06-03 — 2026-06-09（第 23 周）',
    outputKm: 286,
    wireBreaks: 34,
    oee: 83.5,
    inspect: 68,
    rework: 3.2,
  },
  month: {
    title: '生产质量月报',
    dateRange: '2026-06-01 — 2026-06-09（月累计）',
    outputKm: 1120,
    wireBreaks: 128,
    oee: 84.1,
    inspect: 245,
    rework: 11.8,
  },
};

export function buildBatchReport(period: ReportPeriod, orders: ProductionOrder[]): BatchReportData {
  const meta = PERIOD_META[period];
  const scale = period === 'day' ? 1 : period === 'week' ? 6.5 : 26;

  const orderRows: ReportOrderRow[] = orders.map(o => ({
    orderId: o.id,
    batchNo: o.batchNo,
    product: o.productType,
    plannedKm: o.plannedQty,
    completedKm: parseFloat((o.completedQty * (period === 'month' ? 1.15 : 1)).toFixed(2)),
    completionRate: o.completionRate,
    qualityRate: o.qualityRate,
    status:
      o.orderStatus === 'in_progress'
        ? o.status === 'bottleneck'
          ? '瓶颈'
          : '生产中'
        : o.orderStatus === 'qc_pending'
          ? '待质检'
          : o.orderStatus === 'completed'
            ? '已完成'
            : '排产中',
  }));

  const trend: ReportTrendPoint[] =
    period === 'day'
      ? [
          { label: '06:00', outputKm: 4.2, yieldRate: 99.2 },
          { label: '08:00', outputKm: 8.6, yieldRate: 99.0 },
          { label: '10:00', outputKm: 12.1, yieldRate: 98.7 },
          { label: '12:00', outputKm: 18.6, yieldRate: 98.9 },
          { label: '14:00', outputKm: 24.3, yieldRate: 98.8 },
          { label: '16:00', outputKm: 42.8, yieldRate: 98.9 },
        ]
      : period === 'week'
        ? [
            { label: '周一', outputKm: 38, yieldRate: 99.1 },
            { label: '周二', outputKm: 41, yieldRate: 98.8 },
            { label: '周三', outputKm: 39, yieldRate: 99.0 },
            { label: '周四', outputKm: 44, yieldRate: 98.6 },
            { label: '周五', outputKm: 42, yieldRate: 98.9 },
            { label: '周六', outputKm: 40, yieldRate: 99.2 },
            { label: '周日', outputKm: 42, yieldRate: 98.9 },
          ]
        : [
            { label: 'W1', outputKm: 268, yieldRate: 98.7 },
            { label: 'W2', outputKm: 286, yieldRate: 98.9 },
            { label: 'W3', outputKm: 302, yieldRate: 99.0 },
            { label: 'W4', outputKm: 264, yieldRate: 98.5 },
          ];

  return {
    period,
    periodLabel: REPORT_PERIODS.find(p => p.id === period)?.label ?? '',
    title: meta.title,
    subtitle: '线缆连续化生产 · 多批次多规格统计',
    dateRange: meta.dateRange,
    generatedAt: '2026-06-09 16:30:00',
    factoryName: '华东特种线缆数字孪生工厂',
    department: '一车间 / 二车间 交联阻燃产线',
    kpis: [
      {
        label: '生产总量',
        value: `${meta.outputKm} km`,
        sub: period === 'day' ? '日计划 52 km' : undefined,
        trend: period === 'day' ? '82% 达成' : period === 'week' ? '+4.2% 环比' : '+6.8% 同比',
        trendGood: period !== 'day',
      },
      {
        label: '综合 OEE',
        value: `${meta.oee}%`,
        trend: period === 'day' ? '未达标 (目标 85%)' : '接近目标',
        trendGood: meta.oee >= 85,
      },
      {
        label: '平均良率',
        value: '98.9%',
        trend: period === 'day' ? '-0.1% 较昨日' : '+0.2% 较上期',
        trendGood: true,
      },
      {
        label: '断线合计',
        value: `${meta.wireBreaks} 次`,
        trend: period === 'day' ? '成缆区 3 次' : '拉丝段占比最高',
        trendGood: false,
      },
      {
        label: '质检批次',
        value: `${meta.inspect} 批`,
        sub: `返工 ${meta.rework} km`,
      },
      {
        label: '在制工单',
        value: `${orders.filter(o => o.orderStatus === 'in_progress').length} 单`,
        sub: `${orders.filter(o => o.status === 'bottleneck').length} 单瓶颈`,
      },
    ],
    shifts: [
      {
        shift: '白班 08:00—20:00',
        outputKm: parseFloat((meta.outputKm * 0.68).toFixed(1)),
        oee: parseFloat((meta.oee + 2).toFixed(1)),
        headcount: 28,
      },
      {
        shift: '夜班 20:00—08:00',
        outputKm: parseFloat((meta.outputKm * 0.32).toFixed(1)),
        oee: parseFloat((meta.oee - 5).toFixed(1)),
        headcount: 16,
      },
    ],
    lines: [
      { lineName: '拉丝 A 线', outputKm: parseFloat((8.2 * scale).toFixed(1)), oee: 89, wireBreaks: period === 'day' ? 1 : period === 'week' ? 5 : 18, defectRate: 0.9, runHours: 6.2 },
      { lineName: '成缆 B 线', outputKm: parseFloat((4.1 * scale).toFixed(1)), oee: 42, wireBreaks: period === 'day' ? 3 : period === 'week' ? 12 : 45, defectRate: 2.1, runHours: 2.8 },
      { lineName: '绝缘 C 线', outputKm: parseFloat((3.6 * scale).toFixed(1)), oee: 68, wireBreaks: period === 'day' ? 0 : period === 'week' ? 2 : 8, defectRate: 1.4, runHours: 5.1 },
      { lineName: '护套 D 线', outputKm: parseFloat((0.8 * scale).toFixed(1)), oee: 35, wireBreaks: 0, defectRate: 0, runHours: 1.2 },
      { lineName: '收线 E 线', outputKm: parseFloat((6.4 * scale).toFixed(1)), oee: 86, wireBreaks: period === 'day' ? 2 : period === 'week' ? 8 : 32, defectRate: 0.6, runHours: 5.8 },
    ],
    orders: orderRows,
    quality: {
      passBatches: period === 'day' ? 8 : period === 'week' ? 52 : 198,
      warningBatches: period === 'day' ? 3 : period === 'week' ? 12 : 38,
      failBatches: period === 'day' ? 1 : period === 'week' ? 4 : 9,
      overallYield: 98.9,
      inspectCount: meta.inspect,
      reworkKm: meta.rework,
    },
    defects: [
      { reason: '成缆主轴超温', count: period === 'day' ? 1 : period === 'week' ? 4 : 12, pct: 42, process: '成缆' },
      { reason: '绝缘厚度偏差', count: period === 'day' ? 2 : period === 'week' ? 6 : 18, pct: 28, process: '绝缘' },
      { reason: '拉丝断线', count: period === 'day' ? 1 : period === 'week' ? 5 : 22, pct: 18, process: '拉丝' },
      { reason: '护套表面麻点', count: period === 'day' ? 0 : period === 'week' ? 3 : 11, pct: 8, process: '护套' },
      { reason: '收线张力波动', count: period === 'day' ? 1 : period === 'week' ? 2 : 9, pct: 4, process: '收线' },
    ],
    trend,
    remarks: [
      '成缆机 #03 超温停机导致 YJV-3x240 批次交付滞后，已下发抢修工单。',
      '5 号护套挤出机空转待料，建议成缆恢复前启动节能休眠。',
      period !== 'day' ? '本周 OEE 较上周提升 1.8%，拉丝与收线线体表现稳定。' : '白班产量占全天 68%，夜班 OEE 偏低需关注。',
      period === 'month' ? '月累计返工 11.8 km，主要集中在本月上旬成缆故障时段。' : '质量追溯已关联 12 条工序记录，1 批不合格挂账。',
    ],
    preparedBy: 'MES 系统自动汇总',
    approvedBy: '生产调度 · 李主管',
  };
}

export function formatBatchReportText(report: BatchReportData): string {
  const lines = [
    report.title,
    `${report.factoryName} · ${report.department}`,
    `统计周期: ${report.dateRange}`,
    `生成时间: ${report.generatedAt}`,
    '',
    '【核心指标】',
    ...report.kpis.map(k => `  ${k.label}: ${k.value}${k.sub ? ` (${k.sub})` : ''}`),
    '',
    '【产线产量】',
    ...report.lines.map(l => `  ${l.lineName}: ${l.outputKm} km · OEE ${l.oee}% · 断线 ${l.wireBreaks} 次`),
    '',
    '【备注】',
    ...report.remarks.map(r => `  · ${r}`),
    '',
    `编制: ${report.preparedBy}  审核: ${report.approvedBy}`,
  ];
  return lines.join('\n');
}
