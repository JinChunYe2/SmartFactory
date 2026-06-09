/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertLog, Device, DeviceProcess } from './types';

export const PROCESS_FILTERS: { id: 'all' | DeviceProcess; label: string }[] = [
  { id: 'all', label: '全部工序' },
  { id: '拉丝', label: '拉丝' },
  { id: '绞线', label: '绞线' },
  { id: '收放线', label: '收放线' },
  { id: '挤塑', label: '挤塑' },
  { id: '成缆', label: '成缆' },
];

export type OpsStatusTone = 'success' | 'warning' | 'error' | 'idle';

export function getOpsStatusTone(device: Device): OpsStatusTone {
  if (device.status === 'error' || device.status === 'bottleneck') return 'error';
  if (device.status === 'warning') return 'warning';
  if (device.status === 'idle') return 'idle';
  return 'success';
}

export function getStatusLabel(tone: OpsStatusTone): string {
  if (tone === 'error') return '故障停机';
  if (tone === 'warning') return '参数预警';
  if (tone === 'idle') return '待机';
  return '正常运行';
}

export function getStatusBorderClass(tone: OpsStatusTone, theme: 'cyberpunk' | 'minimalist', selected: boolean): string {
  const base = selected ? 'border-2' : 'border';
  if (tone === 'error') return `${base} border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35)]`;
  if (tone === 'warning') return `${base} border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.25)]`;
  if (tone === 'idle') return `${base} ${theme === 'minimalist' ? 'border-slate-300' : 'border-slate-600'}`;
  return `${base} border-emerald-500/70 shadow-[0_0_12px_rgba(16,185,129,0.2)]`;
}

export function computeOpsOverview(devices: Device[], alerts: AlertLog[]) {
  const online = devices.filter(d => d.status !== 'idle' && d.status !== 'error').length;
  const stopped = devices.filter(d => d.status === 'idle').length;
  const fault = devices.filter(d => d.status === 'error' || d.status === 'bottleneck').length;
  const warning = devices.filter(d => d.status === 'warning').length;
  const pendingOpsAlerts = alerts.filter(a => a.category === 'operations' && a.status === 'pending').length;
  const faultTop = [...devices].sort((a, b) => b.faultCountWeek - a.faultCountWeek).slice(0, 3);
  const moldHighWear = devices.filter(d => (d.moldWear ?? 0) >= 70);

  return {
    total: devices.length,
    online,
    stopped,
    fault,
    warning,
    downtimeHours: 3.5,
    pendingOpsAlerts,
    faultTop,
    moldHighWear,
  };
}

export function getParamAlerts(device: Device) {
  const t = device.thresholds;
  return {
    temperature: device.temperature > t.temperatureMax,
    tension: device.tension > t.tensionMax || (device.tension > 0 && device.tension < t.tensionMin),
    speed: device.speed > t.speedMax,
    pressure: device.pressure > t.pressureMax,
    load: device.load > t.loadMax,
    frequency: device.frequency > 55,
  };
}

export function getHealthAdvice(device: Device): string {
  if (device.health < 50) return '建议立即安排停机检修，检查主轴轴承与冷却回路';
  if ((device.moldWear ?? 0) >= 80) return '模具磨损偏高，建议纳入本周预防性维保计划';
  if (device.faultCountWeek >= 3) return '近7日故障频次偏高，建议开展根因分析与参数复核';
  if (device.health < 75) return '健康度中等，建议加强日常点检与润滑保养';
  return '设备运行平稳，按周期执行预防性维保即可';
}

export function getAlertLevelLabel(level: AlertLog['level']): string {
  if (level.includes('P1')) return '紧急故障';
  if (level.includes('P2')) return '一般故障';
  if (level.includes('P3')) return '预警';
  return '提示';
}

export function getRootCauseHint(device: Device): string {
  if (device.code === 'CLJ-003') return '排查方向：①冷却水路堵塞 ②温控探针漂移 ③主轴润滑不足';
  if (device.status === 'warning' && (device.moldWear ?? 0) > 80) return '排查方向：①模具磨损导致张力波动 ②收线张力设定偏高';
  if (device.tension > device.thresholds.tensionMax) return '排查方向：①放线张力异常 ②导轮阻滞 ③线盘偏芯';
  return '排查方向：核对工艺参数设定，检查传感器与执行器反馈';
}
