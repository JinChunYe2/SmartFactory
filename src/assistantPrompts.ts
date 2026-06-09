/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SliceId } from './types';

export type PromptCategory = SliceId | 'general';

export interface AssistantPrompt {
  id: string;
  label: string;
  prompt: string;
  category: PromptCategory;
  icon: string;
}

export const ASSISTANT_PROMPTS: AssistantPrompt[] = [
  { id: 'ops-1', label: '3号成缆机超温原因', prompt: '查看3号成缆机超温故障原因', category: 'operations', icon: '🛠️' },
  { id: 'ops-2', label: '成缆区故障设备', prompt: '成缆区有哪些设备故障', category: 'operations', icon: '⚠️' },
  { id: 'ops-3', label: 'CLJ-003 实时参数', prompt: '3号成缆机当前张力温度是否正常', category: 'operations', icon: '📊' },
  { id: 'ops-4', label: '本周故障 TOP', prompt: '近一周故障次数最多的设备', category: 'operations', icon: '📈' },
  { id: 'ops-5', label: '模具磨损预警', prompt: '哪些设备模具磨损需要更换', category: 'operations', icon: '🔩' },
  { id: 'ops-6', label: '如何创建抢修工单', prompt: '如何给故障设备创建抢修工单', category: 'operations', icon: '📋' },

  { id: 'sec-1', label: '危化区摄像头', prompt: '打开危化品仓库摄像头画面', category: 'security', icon: '📹' },
  { id: 'sec-2', label: '围栏越界告警', prompt: '核查危化品仓库电子围栏越界告警', category: 'security', icon: '🚧' },
  { id: 'sec-3', label: '北门今日访客', prompt: '北门今日访客记录有哪些', category: 'security', icon: '🚪' },
  { id: 'sec-4', label: '消防待巡检设备', prompt: '哪些消防设备待巡检', category: 'security', icon: '🧯' },
  { id: 'sec-5', label: '成缆区安全帽违规', prompt: '成缆区有没有违规作业告警', category: 'security', icon: '⛑️' },
  { id: 'sec-6', label: '应急疏散路线', prompt: '重大安全告警时的疏散路线', category: 'security', icon: '🗺️' },

  { id: 'prod-1', label: 'YJV订单进度', prompt: 'YJV-3x240 订单当前进度', category: 'production', icon: '📦' },
  { id: 'prod-2', label: '当前生产瓶颈', prompt: '当前生产瓶颈在哪个工序', category: 'production', icon: '🔴' },
  { id: 'prod-3', label: '成缆停机影响', prompt: '成缆机故障对订单交付的影响', category: 'production', icon: '⏱️' },
  { id: 'prod-4', label: '今日当班产量', prompt: '今日当班产量完成情况', category: 'production', icon: '📊' },
  { id: 'prod-5', label: 'OEE 达标情况', prompt: '各产线 OEE 是否达标', category: 'production', icon: '🎯' },

  { id: 'nrg-1', label: '5号机空转休眠', prompt: '5号挤塑机能耗空转诊断评估', category: 'energy', icon: '🌿' },
  { id: 'nrg-2', label: '尖峰用电异常', prompt: '退火炉尖峰段用电为什么异常', category: 'energy', icon: '⚡' },
  { id: 'nrg-3', label: '今日总用电量', prompt: '工厂今日总用电量多少', category: 'energy', icon: '📉' },
  { id: 'nrg-4', label: '待机设备清单', prompt: '哪些设备处于待机空耗状态', category: 'energy', icon: '💤' },
  { id: 'nrg-5', label: '退火炉今日耗电', prompt: '退火炉今日耗电多少', category: 'energy', icon: '🔥' },
  { id: 'nrg-6', label: '哪个区域超标', prompt: '哪个区域用电超标', category: 'energy', icon: '🗺️' },
  { id: 'nrg-7', label: '耗电大户排行', prompt: '全厂耗电大户 TOP 排行', category: 'energy', icon: '📊' },
  { id: 'nrg-8', label: '单位产品电耗', prompt: '绝缘C线能耗产量联动分析', category: 'energy', icon: '⚖️' },

  { id: 'gen-1', label: '全厂设备概况', prompt: '全厂设备运行概况', category: 'general', icon: '🏭' },
  { id: 'gen-2', label: '待处理告警汇总', prompt: '当前有哪些待处理告警', category: 'general', icon: '🔔' },
  { id: 'gen-3', label: '如何切换切面', prompt: '怎么切换运维安防生产能耗切面', category: 'general', icon: '🧭' },
];

export const PROMPT_CATEGORY_TABS: { id: 'featured' | PromptCategory; label: string }[] = [
  { id: 'featured', label: '推荐' },
  { id: 'operations', label: '运维' },
  { id: 'security', label: '安防' },
  { id: 'production', label: '生产' },
  { id: 'energy', label: '能耗' },
  { id: 'general', label: '通用' },
];

const SLICE_LABEL: Record<SliceId, string> = {
  operations: '运维',
  security: '安防',
  production: '生产',
  energy: '能耗',
};

export function getFeaturedPrompts(activeSlice: SliceId, limit = 6): AssistantPrompt[] {
  const slicePrompts = ASSISTANT_PROMPTS.filter(p => p.category === activeSlice);
  const general = ASSISTANT_PROMPTS.filter(p => p.category === 'general');
  const merged = [...slicePrompts, ...general];
  const seen = new Set<string>();
  return merged.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  }).slice(0, limit);
}

export function getPromptsByCategory(
  category: 'featured' | PromptCategory,
  activeSlice: SliceId,
): AssistantPrompt[] {
  if (category === 'featured') return getFeaturedPrompts(activeSlice);
  return ASSISTANT_PROMPTS.filter(p => p.category === category);
}

export function getContextHint(activeSlice: SliceId): string {
  return `当前在「${SLICE_LABEL[activeSlice]}」切面，以下为常用问询`;
}

export function rotatePrompts(
  category: 'featured' | PromptCategory,
  activeSlice: SliceId,
  seed: number,
  count = 6,
): AssistantPrompt[] {
  const pool = getPromptsByCategory(category, activeSlice);
  if (pool.length <= count) return pool;
  const start = seed % Math.max(1, pool.length - count + 1);
  return pool.slice(start, start + count);
}
