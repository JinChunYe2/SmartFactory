/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppTheme = 'cyberpunk' | 'minimalist';

/** 面板外层壳（左右侧栏） */
export function panelShell(theme: AppTheme, side: 'left' | 'right'): string {
  if (theme === 'minimalist') {
    return side === 'left'
      ? 'bg-white/98 border-r border-slate-200 text-slate-800'
      : 'bg-white/98 border-l border-slate-200 text-slate-800';
  }
  return side === 'left'
    ? 'bg-slate-950/98 border-r border-blue-500/40 text-slate-100 cyber-panel-left'
    : 'bg-slate-950/98 border-l border-blue-500/40 text-slate-100 cyber-panel-right';
}

export function panelHeader(theme: AppTheme): string {
  return theme === 'minimalist'
    ? 'border-slate-200'
    : 'border-blue-500/35 cyber-panel-header';
}

export function panelBadge(theme: AppTheme): string {
  return theme === 'minimalist'
    ? 'bg-blue-50 text-blue-600 border-blue-100'
    : 'bg-blue-500/15 text-blue-300 border-blue-400/40 cyber-badge-glow';
}

export function panelKicker(theme: AppTheme): string {
  return theme === 'minimalist' ? 'text-blue-600' : 'text-blue-400 cyber-text-glow';
}

export function panelHeading(theme: AppTheme): string {
  return theme === 'minimalist' ? 'text-slate-900' : 'text-slate-50 cyber-text-glow';
}

/** 运维等业务卡片 */
export function panelCard(theme: AppTheme): string {
  return theme === 'minimalist'
    ? 'bg-slate-50/80 border-slate-200'
    : 'bg-slate-950/75 border-blue-500/35 cyber-card';
}

export function panelInner(theme: AppTheme): string {
  return theme === 'minimalist'
    ? 'bg-white border-slate-200'
    : 'bg-slate-950/85 border-blue-500/28 cyber-card-inner';
}

export function panelTitle(theme: AppTheme): string {
  return theme === 'minimalist' ? 'text-slate-800' : 'text-slate-100 cyber-text-glow';
}

export function panelMuted(theme: AppTheme): string {
  return theme === 'minimalist' ? 'text-slate-500' : 'text-slate-300';
}

export function panelValue(theme: AppTheme): string {
  return theme === 'minimalist' ? 'text-slate-900' : 'text-slate-50';
}
