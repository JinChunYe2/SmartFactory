/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EnergyDeviceProfile,
  EnergyLevel,
  EnergyPeriod,
  EnergyRankMode,
  EnergyRankingItem,
  EnergyTrendGranularity,
  EnergyTrendPoint,
  EnergyZoneProfile,
} from './types';
import {
  ENERGY_DEVICE_PROFILES,
  ENERGY_TREND_DAY,
  ENERGY_TREND_HOUR,
  ENERGY_TREND_SHIFT,
  ENERGY_ZONE_PROFILES,
} from './data';

export const ENERGY_PERIOD_TABS = [
  { id: 'day' as const, label: '日' },
  { id: 'week' as const, label: '周' },
  { id: 'month' as const, label: '月' },
];

export const ENERGY_RANK_MODES: { id: EnergyRankMode; label: string }[] = [
  { id: 'device', label: '设备' },
  { id: 'line', label: '产线' },
  { id: 'zone', label: '区域' },
];

export const ENERGY_TREND_MODES: { id: EnergyTrendGranularity; label: string }[] = [
  { id: 'hour', label: '按小时' },
  { id: 'shift', label: '按班次' },
  { id: 'day', label: '按日期' },
];

export const ENERGY_LEVEL_LABEL: Record<EnergyLevel, string> = {
  high: '高能耗',
  medium: '中能耗',
  low: '低能耗',
};

export const ENERGY_LEVEL_COLOR: Record<EnergyLevel, string> = {
  high: 'rgba(239,68,68,0.35)',
  medium: 'rgba(245,158,11,0.28)',
  low: 'rgba(16,185,129,0.22)',
};

export const ENERGY_LEVEL_BORDER: Record<EnergyLevel, string> = {
  high: 'border-red-500/60',
  medium: 'border-amber-500/50',
  low: 'border-emerald-500/40',
};

export const ENERGY_LEVEL_TEXT: Record<EnergyLevel, string> = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-emerald-500',
};

export function formatKwh(kwh: number, period?: EnergyPeriod): string {
  if (period === 'month' || kwh >= 10000) return `${(kwh / 1000).toFixed(1)} MWh`;
  if (kwh >= 1000) return `${(kwh / 1000).toFixed(2)} MWh`;
  return `${kwh} kWh`;
}

export function formatCost(yuan: number): string {
  if (yuan >= 10000) return `¥${(yuan / 10000).toFixed(2)} 万`;
  return `¥${yuan.toLocaleString('zh-CN')}`;
}

export function getEnergyTrend(granularity: EnergyTrendGranularity, period: EnergyPeriod): EnergyTrendPoint[] {
  if (granularity === 'hour') return ENERGY_TREND_HOUR;
  if (granularity === 'shift') return ENERGY_TREND_SHIFT;
  const base = ENERGY_TREND_DAY;
  if (period === 'week') return base;
  if (period === 'month') {
    return [
      { label: 'W1', energyKwh: 82000, outputKm: 268 },
      { label: 'W2', energyKwh: 86200, outputKm: 286, isPeak: true },
      { label: 'W3', energyKwh: 84800, outputKm: 278 },
      { label: 'W4', energyKwh: 94800, outputKm: 288 },
    ];
  }
  return base.slice(0, 1).concat(base.slice(0, 1)).map((p, i) => ({ ...p, label: `今日${i + 1}` }));
}

export function buildEnergyRankings(mode: EnergyRankMode): EnergyRankingItem[] {
  if (mode === 'device') {
    const sorted = [...ENERGY_DEVICE_PROFILES].sort((a, b) => b.powerKw - a.powerKw);
    const max = sorted[0]?.powerKw ?? 1;
    return sorted.map((d, i) => ({
      rank: i + 1,
      id: d.deviceCode,
      name: d.deviceName,
      sub: d.area,
      valueKw: d.powerKw,
      dailyKwh: d.dailyKwh,
      pct: Math.round((d.powerKw / max) * 100),
      level: d.level,
      deviceCode: d.deviceCode,
    }));
  }
  if (mode === 'zone') {
    const sorted = [...ENERGY_ZONE_PROFILES].sort((a, b) => b.totalKwh - a.totalKwh);
    const max = sorted[0]?.totalKwh ?? 1;
    return sorted.map((z, i) => ({
      rank: i + 1,
      id: z.id,
      name: z.name,
      sub: z.area,
      valueKw: z.powerKw,
      dailyKwh: z.totalKwh,
      pct: Math.round((z.totalKwh / max) * 100),
      level: z.level,
      zoneId: z.id,
    }));
  }
  const lineMap = new Map<string, { name: string; kw: number; kwh: number; level: EnergyLevel }>();
  ENERGY_DEVICE_PROFILES.forEach(d => {
    const cur = lineMap.get(d.lineId) ?? { name: d.lineName, kw: 0, kwh: 0, level: 'low' as EnergyLevel };
    cur.kw += d.powerKw;
    cur.kwh += d.dailyKwh;
    if (d.level === 'high') cur.level = 'high';
    else if (d.level === 'medium' && cur.level !== 'high') cur.level = 'medium';
    lineMap.set(d.lineId, cur);
  });
  const sorted = Array.from(lineMap.entries()).sort((a, b) => b[1].kw - a[1].kw);
  const max = sorted[0]?.[1].kw ?? 1;
  return sorted.map(([id, v], i) => ({
    rank: i + 1,
    id,
    name: v.name,
    sub: `${v.kwh} kWh/日`,
    valueKw: v.kw,
    dailyKwh: v.kwh,
    pct: Math.round((v.kw / max) * 100),
    level: v.level,
  }));
}

export function getDeviceEnergyProfile(code: string): EnergyDeviceProfile | undefined {
  return ENERGY_DEVICE_PROFILES.find(d => d.deviceCode === code);
}

export function getZoneEnergyProfile(zoneId: string): EnergyZoneProfile | undefined {
  return ENERGY_ZONE_PROFILES.find(z => z.id === zoneId);
}

export function buildEnergy3dTransform(focus?: { offsetX: number; offsetY: number; scale: number }) {
  if (!focus) return 'perspective(1400px) rotateX(42deg) rotateZ(-12deg) scale(0.9)';
  return `perspective(1400px) rotateX(42deg) rotateZ(-12deg) scale(${focus.scale * 0.9}) translate(${focus.offsetX}px, ${focus.offsetY}px)`;
}

export function scaleOverviewForPeriod<T extends { totalKwh: number; totalCost: number; targetKwh: number }>(
  snapshot: T,
  period: EnergyPeriod,
): T {
  if (period === 'day') return snapshot;
  const mult = period === 'week' ? 6.73 : 27.2;
  return {
    ...snapshot,
    totalKwh: Math.round(snapshot.totalKwh * (period === 'week' ? 1 : mult / 6.73)),
    totalCost: Math.round(snapshot.totalCost * (period === 'week' ? 1 : mult / 6.73)),
    targetKwh: Math.round(snapshot.targetKwh * (period === 'week' ? 1 : mult / 6.73)),
  };
}
