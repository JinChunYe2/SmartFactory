/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { feishuConfig } from '../config/feishu';
import { getAlertLevelLabel, getRootCauseHint } from '../operationsUtils';
import { AlertLog, Device } from '../types';

export type AlertMetricKind = 'tension' | 'temperature' | 'generic';

export interface FeishuAlertContext {
  device: Device;
  alert: AlertLog;
  allDevices?: Device[];
  /** 近 30 分钟趋势采样（6 点），不传则自动生成 */
  trendPoints?: number[];
  estimatedMinutes?: number;
  /** 担当人/接手人 → 飞书 target_name，并写入消息「责任人」 */
  assignee?: string;
}

const DIVIDER = '━━━━━━━━━━━━━━━━━━━━━━';

const PROCESS_ZONE: Record<Device['process'], string> = {
  拉丝: 'rough-draw',
  绞线: 'stranding',
  收放线: 'winding',
  挤塑: 'extrusion',
  成缆: 'cabling',
};

const LEVEL_EMOJI: Record<string, string> = {
  P1: '🔴',
  P2: '🟠',
  P3: '🟡',
  P4: '🔵',
};

function levelEmoji(level: AlertLog['level']): string {
  if (level.includes('P1')) return LEVEL_EMOJI.P1;
  if (level.includes('P2')) return LEVEL_EMOJI.P2;
  if (level.includes('P3')) return LEVEL_EMOJI.P3;
  return LEVEL_EMOJI.P4;
}

function shortDeviceLabel(device: Device): string {
  const m = device.name.match(/#?\d+|F-\d+/);
  const suffix = m?.[0] ?? device.code;
  const type = device.process === '拉丝' ? '细拉机' : device.name.replace(/\s*#?\d+.*/, '');
  return `${type}${suffix.includes('-') ? suffix : suffix.startsWith('#') ? suffix : `#${suffix}`}`;
}

export function detectAlertMetric(alert: AlertLog, device: Device): AlertMetricKind {
  const text = `${alert.title} ${alert.description}`;
  if (/张力|tension/i.test(text)) return 'tension';
  if (/温度|超温|°C|温控/i.test(text)) return 'temperature';
  if (device.tension > 0 && device.tension < device.thresholds.tensionMin) return 'tension';
  if (device.temperature > device.thresholds.temperatureMax) return 'temperature';
  return 'generic';
}

function formatArea(device: Device): string {
  return device.area.replace(/\s+/g, ' · ');
}

function mapUrl(device: Device): string {
  const zone = PROCESS_ZONE[device.process] ?? 'workshop';
  return `${feishuConfig.factoryBaseUrl}/map?device=${encodeURIComponent(device.code)}&zone=${zone}`;
}

function chartUrl(device: Device, metric: AlertMetricKind): string {
  const path = metric === 'temperature' ? 'temperature' : 'tension';
  return `${feishuConfig.factoryBaseUrl}/chart/${encodeURIComponent(device.code)}/${path}?range=30m`;
}

function tensionDirection(value: number, min: number, max: number): { arrow: string; status: string } {
  if (value < min) return { arrow: '↓', status: '偏低' };
  if (value > max) return { arrow: '↑', status: '偏高' };
  return { arrow: '→', status: '正常' };
}

function temperatureDirection(value: number, max: number): { arrow: string; status: string } {
  if (value > max) return { arrow: '↑', status: '超限' };
  if (value > max * 0.9) return { arrow: '↑', status: '接近上限' };
  return { arrow: '→', status: '正常' };
}

/** 根据当前值生成近 30 分钟下降/上升趋势 */
function synthesizeTrend(current: number, min: number, max: number, kind: AlertMetricKind): number[] {
  const mid = (min + max) / 2;
  const points = 6;
  const result: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    let v: number;
    if (kind === 'temperature' && current > max) {
      v = mid + (current - mid) * t * 1.1;
    } else if (kind === 'tension' && current < min) {
      v = max - (max - current) * t;
    } else {
      v = mid + (current - mid) * t;
    }
    result.push(parseFloat(v.toFixed(1)));
  }
  result[points - 1] = current;
  return result;
}

function trendPercentChange(points: number[]): number {
  if (points.length < 2) return 0;
  const tail = points.slice(-3);
  const first = tail[0];
  const last = tail[tail.length - 1];
  if (first === 0) return 0;
  return parseFloat((((last - first) / first) * 100).toFixed(1));
}

function formatTimeLabels(): string[] {
  const now = new Date();
  const labels: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 5 * 60_000);
    labels.push(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
  }
  labels[labels.length - 1] = '现在';
  return labels;
}

/** ASCII 折线图（张力 / 温度通用） */
export function buildTrendChart(
  points: number[],
  current: number,
  min: number,
  max: number,
  unit: string,
  timeLabels: string[],
): string {
  const chartMin = Math.min(min, ...points) - 2;
  const chartMax = Math.max(max, ...points) + 2;
  const rows = 6;
  const width = 22;
  const grid: string[][] = Array.from({ length: rows }, () => Array(width).fill(' '));

  const toRow = (v: number) => Math.round(((chartMax - v) / (chartMax - chartMin)) * (rows - 1));
  const toCol = (i: number) => Math.round((i / (points.length - 1)) * (width - 1));

  for (let i = 0; i < points.length - 1; i++) {
    const r0 = toRow(points[i]);
    const c0 = toCol(i);
    const r1 = toRow(points[i + 1]);
    const c1 = toCol(i + 1);
    grid[r0][c0] = i === 0 ? '╭' : '╮';
    const steps = Math.max(Math.abs(c1 - c0), Math.abs(r1 - r0), 1);
    for (let s = 1; s <= steps; s++) {
      const c = Math.round(c0 + ((c1 - c0) * s) / steps);
      const r = Math.round(r0 + ((r1 - r0) * s) / steps);
      if (grid[r][c] === ' ') grid[r][c] = '─';
    }
  }

  const curCol = toCol(points.length - 1);
  const curRow = toRow(current);
  grid[curRow][curCol] = '●';

  const yLabels = Array.from({ length: rows }, (_, i) => {
    const v = chartMax - ((chartMax - chartMin) * i) / (rows - 1);
    return `${v.toFixed(0)}${unit}`;
  });

  const lines = yLabels.map((label, i) => {
    const rowChars = grid[i].join('').replace(/\s+$/, '');
    return `${label.padStart(4)} │ ${rowChars}${i === curRow ? ' ← 当前' : ''}`;
  });

  const timeLine = '     ' + timeLabels.map(t => t.padEnd(5)).join(' ');
  return [...lines, '    └' + '─'.repeat(width), timeLine].join('\n');
}

function buildHeadline(ctx: FeishuAlertContext, metric: AlertMetricKind): string {
  const { device, alert } = ctx;
  const label = shortDeviceLabel(device);
  const minutes = ctx.estimatedMinutes ?? estimateRiskMinutes(device, metric);

  if (metric === 'tension') {
    return `【紧急告警】${label}张力异常，预计${minutes}分钟后可能断线`;
  }
  if (metric === 'temperature') {
    return `【紧急告警】${label}温度异常，预计${minutes}分钟后可能触发停机保护`;
  }
  return `【告警通知】${label}${alert.title.replace(/^[^ ]+\s*/, '')}`;
}

function estimateRiskMinutes(device: Device, metric: AlertMetricKind): number {
  if (metric === 'tension') {
    const gap = device.thresholds.tensionMin - device.tension;
    return Math.max(5, Math.min(30, Math.round(12 + gap * 2)));
  }
  if (metric === 'temperature') {
    const over = device.temperature - device.thresholds.temperatureMax;
    return Math.max(3, Math.min(20, Math.round(8 + over * 0.5)));
  }
  return 15;
}

function relatedDeviceCodes(device: Device, allDevices: Device[]): string {
  return allDevices
    .filter(d => d.id !== device.id && (d.process === device.process || d.area.split(' ')[0] === device.area.split(' ')[0]))
    .map(d => d.code)
    .slice(0, 3)
    .join('/') || '—';
}

function buildDispositionSteps(ctx: FeishuAlertContext, metric: AlertMetricKind): string[] {
  const { device, alert, allDevices = [] } = ctx;
  const minutes = ctx.estimatedMinutes ?? estimateRiskMinutes(device, metric);
  const related = relatedDeviceCodes(device, allDevices);
  const hint = getRootCauseHint(device);

  if (metric === 'tension') {
    const { tensionMin, tensionMax } = device.thresholds;
    const target = ((tensionMin + tensionMax) / 2).toFixed(0);
    return [
      `【立即】暂停 ${device.code} 当前卷取，避免断线造成原料报废`,
      '【2分钟内】检查放线架阻尼与导轮磨损，确认无卡滞',
      `【5分钟内】将张力设定值回调至 ${tensionMin}~${tensionMax} N（建议 ${target} N），低速试运转`,
      `【10分钟内】复核同产线 ${related} 张力数据，排除批次共性`,
      `若 ${minutes} 分钟内未恢复，联系设备维保（内线：${feishuConfig.maintenanceHotline}）`,
    ];
  }

  if (metric === 'temperature') {
    return [
      `【立即】暂停 ${device.code} 运行，防止 ${device.process}段过热损伤`,
      '【2分钟内】检查冷却水路/风扇与温控探针连接',
      '【5分钟内】排查冷却阀开度与过滤器堵塞情况',
      `【10分钟内】同步检查同区域 ${related} 温度读数`,
      `若 ${minutes} 分钟内未恢复，联系设备维保（内线：${feishuConfig.maintenanceHotline}）`,
    ];
  }

  return [
    `【立即】现场确认：${alert.location}`,
    `【5分钟内】按规程处置：${alert.description.slice(0, 40)}…`,
    `排查参考：${hint}`,
    `责任人：${feishuConfig.responsibleRoles}`,
    `若 ${minutes} 分钟内未恢复，联系设备维保（内线：${feishuConfig.maintenanceHotline}）`,
  ];
}

function responsibleLabel(ctx: FeishuAlertContext): string {
  return ctx.assignee?.trim() || feishuConfig.responsibleRoles;
}

function buildMetricSection(ctx: FeishuAlertContext, metric: AlertMetricKind): string {
  const { device, alert } = ctx;

  if (metric === 'tension') {
    const { tensionMin, tensionMax } = device.thresholds;
    const { arrow, status } = tensionDirection(device.tension, tensionMin, tensionMax);
    return [
      `设备编号：${device.code}（${device.name}）`,
      `产线区域：${formatArea(device)}`,
      `当前张力：${device.tension} N（阈值 ${tensionMin}~${tensionMax} N）${arrow} ${status}`,
      `告警等级：${levelEmoji(alert.level)} ${getAlertLevelLabel(alert.level)}`,
    ].join('\n');
  }

  if (metric === 'temperature') {
    const max = device.thresholds.temperatureMax;
    const { arrow, status } = temperatureDirection(device.temperature, max);
    return [
      `设备编号：${device.code}（${device.name}）`,
      `产线区域：${formatArea(device)}`,
      `当前温度：${device.temperature} °C（阈值 ≤ ${max} °C）${arrow} ${status}`,
      `告警等级：${levelEmoji(alert.level)} ${getAlertLevelLabel(alert.level)}`,
    ].join('\n');
  }

  return [
    `设备编号：${device.code}（${device.name}）`,
    `产线区域：${formatArea(device)}`,
    `告警摘要：${alert.title}`,
    `告警等级：${levelEmoji(alert.level)} ${getAlertLevelLabel(alert.level)}`,
  ].join('\n');
}

/** 组装完整飞书消息正文 */
export function buildFeishuAlertMessage(ctx: FeishuAlertContext): string {
  const { device, alert } = ctx;
  const metric = detectAlertMetric(alert, device);
  const minutes = ctx.estimatedMinutes ?? estimateRiskMinutes(device, metric);
  const timeLabels = formatTimeLabels();

  const sections: string[] = [
    buildHeadline(ctx, metric),
    '',
    DIVIDER,
    '📍 设备信息',
    DIVIDER,
    buildMetricSection(ctx, metric),
    '',
    '📍 设备定位',
    mapUrl(device),
  ];

  if (metric === 'tension' || metric === 'temperature') {
    const isTension = metric === 'tension';
    const min = isTension ? device.thresholds.tensionMin : device.thresholds.temperatureMax * 0.85;
    const max = isTension ? device.thresholds.tensionMax : device.thresholds.temperatureMax;
    const current = isTension ? device.tension : device.temperature;
    const unit = isTension ? 'N' : '°C';
    const points = ctx.trendPoints ?? synthesizeTrend(current, min, max, metric);
    const pct = trendPercentChange(points);
    const trendWord = pct < 0 ? '持续下降' : pct > 0 ? '持续上升' : '基本平稳';

    sections.push(
      '',
      DIVIDER,
      `${isTension ? '📈 张力趋势（近30分钟）' : '📈 温度趋势（近30分钟）'}`,
      DIVIDER,
      buildTrendChart(points, current, min, max, unit, timeLabels),
      `趋势：${trendWord}，近5分钟${pct >= 0 ? '升幅' : '降幅'} ${Math.abs(pct)}%`,
      '',
      `趋势详情：${chartUrl(device, metric)}`,
    );
  }

  const steps = buildDispositionSteps(ctx, metric);
  sections.push(
    '',
    DIVIDER,
    '✅ 处置建议',
    DIVIDER,
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    '',
    `责任人：${responsibleLabel(ctx)}`,
  );

  if (metric === 'tension') {
    sections.push(`预计断线窗口：约 ${minutes} 分钟（请优先处置）`);
  } else if (metric === 'temperature') {
    sections.push(`预计停机窗口：约 ${minutes} 分钟（请优先处置）`);
  }

  sections.push('', `—— ${feishuConfig.platformName}`);
  return sections.join('\n');
}
