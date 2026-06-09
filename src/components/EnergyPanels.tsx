/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  Leaf,
  Target,
  Layers,
  Activity,
  Sparkles,
} from 'lucide-react';
import {
  EnergyAlertItem,
  EnergyCapacityLink,
  EnergyOverviewSnapshot,
  EnergyPeriod,
  EnergyRankMode,
  EnergySavingTip,
  EnergyTrendGranularity,
} from '../types';
import {
  ENERGY_LEVEL_TEXT,
  ENERGY_PERIOD_TABS,
  ENERGY_RANK_MODES,
  ENERGY_TREND_MODES,
  buildEnergyRankings,
  formatCost,
  formatKwh,
  getEnergyTrend,
} from '../energyUtils';
import { panelCard, panelInner, panelTitle, panelMuted, panelValue } from '../themeStyles';

type Theme = 'cyberpunk' | 'minimalist';

function DualTrendChart({
  theme,
  points,
  showOutput,
}: {
  theme: Theme;
  points: ReturnType<typeof getEnergyTrend>;
  showOutput: boolean;
}) {
  const isMinimal = theme === 'minimalist';
  const maxE = Math.max(...points.map(p => p.energyKwh));
  const maxO = Math.max(...points.map(p => p.outputKm));

  return (
    <div className="relative h-28 flex items-end gap-1">
      {points.map(p => (
        <div key={p.label} className="flex-1 flex flex-col items-center gap-0.5 min-w-0 h-full justify-end">
          <div className="relative w-full flex items-end justify-center gap-px h-20">
            <div
              className={`w-[45%] rounded-t-sm ${p.isPeak ? 'bg-red-500' : isMinimal ? 'bg-amber-400' : 'bg-amber-500'}`}
              style={{ height: `${Math.max(8, (p.energyKwh / maxE) * 100)}%` }}
              title={`${p.energyKwh} kWh`}
            />
            {showOutput && (
              <div
                className={`w-[45%] rounded-t-sm ${isMinimal ? 'bg-emerald-400' : 'bg-emerald-500'}`}
                style={{ height: `${Math.max(8, (p.outputKm / maxO) * 100)}%` }}
                title={`${p.outputKm} km`}
              />
            )}
          </div>
          <span className={`text-[7px] truncate w-full text-center ${isMinimal ? 'text-slate-500' : 'text-slate-400'}`}>
            {p.label}
          </span>
        </div>
      ))}
    </div>
  );
}

interface EnergyLeftPanelProps {
  theme: Theme;
  overview: EnergyOverviewSnapshot;
  energyPeriod: EnergyPeriod;
  rankMode: EnergyRankMode;
  trendGranularity: EnergyTrendGranularity;
  showOutputOverlay: boolean;
  selectedDeviceCode: string | null;
  selectedZoneId: string | null;
  onPeriodChange: (p: EnergyPeriod) => void;
  onRankModeChange: (m: EnergyRankMode) => void;
  onTrendGranularityChange: (g: EnergyTrendGranularity) => void;
  onToggleOutputOverlay: () => void;
  onSelectDevice: (code: string) => void;
  onSelectZone: (zoneId: string) => void;
}

export function EnergyLeftPanel({
  theme,
  overview,
  energyPeriod,
  rankMode,
  trendGranularity,
  showOutputOverlay,
  selectedDeviceCode,
  selectedZoneId,
  onPeriodChange,
  onRankModeChange,
  onTrendGranularityChange,
  onToggleOutputOverlay,
  onSelectDevice,
  onSelectZone,
}: EnergyLeftPanelProps) {
  const card = panelCard(theme);
  const inner = panelInner(theme);
  const title = panelTitle(theme);
  const muted = panelMuted(theme);

  const rankings = useMemo(() => buildEnergyRankings(rankMode), [rankMode]);
  const trend = useMemo(() => getEnergyTrend(trendGranularity, energyPeriod), [trendGranularity, energyPeriod]);

  return (
    <div className="flex flex-col gap-3.5">
      <section className={`p-3 rounded-2xl border ${card}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-xs font-bold flex items-center gap-1.5 ${title}`}>
            <Zap className="h-4 w-4 text-amber-500" />
            能耗总览
          </h3>
          <div className="flex gap-0.5">
            {ENERGY_PERIOD_TABS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => onPeriodChange(t.id)}
                className={`text-[8px] px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                  energyPeriod === t.id ? 'bg-amber-600 text-white' : muted
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <div className={`p-2 rounded-lg border col-span-2 ${inner}`}>
            <div className={`text-[8px] ${muted}`}>总用电量</div>
            <div className="text-lg font-black text-amber-600">{formatKwh(overview.totalKwh, energyPeriod)}</div>
            <div className={`text-[8px] ${muted}`}>成本 {formatCost(overview.totalCost)} · 均价 ¥{overview.avgPrice}/kWh</div>
          </div>
          {[
            { label: '目标达成', value: `${overview.achievementRate}%`, ok: overview.achievementRate <= 100 },
            { label: '尖峰功率', value: `${overview.peakKw} kW`, ok: false },
            { label: '同比', value: `${overview.yoyChange > 0 ? '+' : ''}${overview.yoyChange}%`, ok: overview.yoyChange <= 0 },
            { label: '环比', value: `${overview.momChange > 0 ? '+' : ''}${overview.momChange}%`, ok: overview.momChange <= 0 },
          ].map(item => (
            <div key={item.label} className={`p-1.5 rounded-lg border text-center ${inner}`}>
              <div className={`text-[7px] ${muted}`}>{item.label}</div>
              <div className={`text-xs font-black flex items-center justify-center gap-0.5 ${item.ok ? 'text-emerald-500' : 'text-red-500'}`}>
                {item.label.includes('比') && (item.ok ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />)}
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <div className={`text-[8px] flex items-center gap-1 ${overview.achievementRate > 100 ? 'text-red-500' : 'text-emerald-500'}`}>
          <Target className="h-3 w-3" />
          目标 {formatKwh(overview.targetKwh, energyPeriod)}
          {overview.achievementRate > 100 ? ' · 已超标' : ' · 控制良好'}
        </div>
      </section>

      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <BarChart3 className="h-4 w-4 text-amber-500" />
          耗电排行 TOP
        </h3>
        <div className="flex gap-1 mb-2">
          {ENERGY_RANK_MODES.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => onRankModeChange(m.id)}
              className={`flex-1 text-[9px] py-0.5 rounded-lg font-bold border cursor-pointer transition ${
                rankMode === m.id ? 'bg-amber-600 text-white border-amber-500' : inner
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto scrollbar-thin">
          {rankings.map(item => {
            const selected =
              (item.deviceCode && selectedDeviceCode === item.deviceCode) ||
              (item.zoneId && selectedZoneId === item.zoneId);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.deviceCode) onSelectDevice(item.deviceCode);
                  else if (item.zoneId) onSelectZone(item.zoneId);
                }}
                className={`text-left p-2 rounded-xl border transition cursor-pointer ${
                  selected ? 'border-amber-500 ring-1 ring-amber-500/40' : inner
                }`}
              >
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className={`font-bold ${panelValue(theme)}`}>
                    #{item.rank} {item.name}
                  </span>
                  <span className={`font-black ${ENERGY_LEVEL_TEXT[item.level]}`}>{item.valueKw} kW</span>
                </div>
                <div className={`text-[8px] truncate mb-1 ${muted}`}>{item.sub}</div>
                <div className={`h-1 rounded-full overflow-hidden ${theme === 'minimalist' ? 'bg-slate-200' : 'bg-slate-900'}`}>
                  <div
                    className={`h-full ${item.level === 'high' ? 'bg-red-500' : item.level === 'medium' ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className={`p-3 rounded-2xl border ${card}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-xs font-bold flex items-center gap-1.5 ${title}`}>
            <Activity className="h-4 w-4 text-amber-500" />
            能耗趋势
          </h3>
          <button
            type="button"
            onClick={onToggleOutputOverlay}
            className={`text-[8px] px-1.5 py-0.5 rounded border cursor-pointer ${
              showOutputOverlay ? 'bg-emerald-600 text-white border-emerald-500' : inner
            }`}
          >
            叠加产量
          </button>
        </div>
        <div className="flex gap-1 mb-2">
          {ENERGY_TREND_MODES.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => onTrendGranularityChange(m.id)}
              className={`text-[8px] px-2 py-0.5 rounded-full font-semibold cursor-pointer ${
                trendGranularity === m.id ? 'bg-amber-600 text-white' : muted
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <DualTrendChart theme={theme} points={trend} showOutput={showOutputOverlay} />
        <div className={`flex gap-3 mt-1.5 text-[8px] ${muted}`}>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-500" />用电量</span>
          {showOutputOverlay && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" />产量</span>}
          <span className="text-red-500">尖峰段标红</span>
        </div>
      </section>
    </div>
  );
}

interface EnergyRightPanelProps {
  theme: Theme;
  alerts: EnergyAlertItem[];
  capacityLinks: EnergyCapacityLink[];
  savingTips: EnergySavingTip[];
  isEcoSavingsActive: boolean;
  selectedDeviceCode: string | null;
  onSelectDevice: (code: string) => void;
  onSelectAlert: (alert: EnergyAlertItem) => void;
  onTriggerEcoSaving: () => void;
  onAskAI: (q: string) => void;
}

export function EnergyRightPanel({
  theme,
  alerts,
  capacityLinks,
  savingTips,
  isEcoSavingsActive,
  selectedDeviceCode,
  onSelectDevice,
  onSelectAlert,
  onTriggerEcoSaving,
  onAskAI,
}: EnergyRightPanelProps) {
  const [showSavingReport, setShowSavingReport] = useState(false);
  const card = panelCard(theme);
  const inner = panelInner(theme);
  const title = panelTitle(theme);
  const muted = panelMuted(theme);
  const pendingAlerts = alerts.filter(a => a.status === 'pending');

  const totalSaving = savingTips.reduce((s, t) => s + t.savingKwh, 0);
  const totalSavingCost = savingTips.reduce((s, t) => s + t.savingCost, 0);

  return (
    <div className="flex flex-col gap-3.5">
      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <AlertTriangle className="h-4 w-4 text-red-500" />
          能耗异常告警
          {pendingAlerts.length > 0 && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-600 text-white">{pendingAlerts.length}</span>
          )}
        </h3>
        <div className="flex flex-col gap-1.5 max-h-[130px] overflow-y-auto scrollbar-thin">
          {pendingAlerts.map(alert => (
            <button
              key={alert.id}
              type="button"
              onClick={() => onSelectAlert(alert)}
              className={`text-left p-2 rounded-xl border cursor-pointer transition ${
                alert.level === 'P2高危'
                  ? theme === 'minimalist' ? 'border-red-200 bg-red-50/60' : 'border-red-800/50 bg-red-950/30'
                  : inner
              }`}
            >
              <div className="flex justify-between text-[9px] font-bold mb-0.5">
                <span className="text-red-500">{alert.title}</span>
                <span className={muted}>{alert.time}</span>
              </div>
              <div className={`text-[8px] line-clamp-2 ${muted}`}>{alert.description}</div>
              <div className="text-[8px] text-amber-600 mt-0.5">异常时段 {alert.timeRange} · +{alert.spikeKw} kW</div>
            </button>
          ))}
        </div>
      </section>

      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <Layers className="h-4 w-4 text-indigo-500" />
          能耗-产能联动
        </h3>
        <div className={`text-[8px] mb-1.5 ${muted}`}>单位产品电耗 kWh/km · 点击聚焦产线</div>
        <div className="flex flex-col gap-1 max-h-[110px] overflow-y-auto scrollbar-thin">
          {capacityLinks.map(link => (
            <button
              key={link.lineId + link.batchNo}
              type="button"
              onClick={() => onAskAI(`${link.lineName}能耗产量分析`)}
              className={`text-left p-2 rounded-lg border text-[9px] cursor-pointer ${inner}`}
            >
              <div className="flex justify-between font-bold">
                <span className={panelValue(theme)}>{link.lineName}</span>
                <span className={link.status === 'good' ? 'text-emerald-500' : link.status === 'warn' ? 'text-amber-500' : 'text-red-500'}>
                  {link.kwhPerKm} kWh/km
                </span>
              </div>
              <div className={muted}>{link.batchNo} · {link.outputKm} km / {link.energyKwh} kWh · 基准 {link.benchmark}</div>
            </button>
          ))}
        </div>
      </section>

      <section className={`p-3 rounded-2xl border ${card}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-xs font-bold flex items-center gap-1.5 ${title}`}>
            <Leaf className="h-4 w-4 text-emerald-500" />
            节能分析
          </h3>
          <button
            type="button"
            onClick={() => setShowSavingReport(v => !v)}
            className={`text-[8px] underline cursor-pointer ${theme === 'minimalist' ? 'text-emerald-600' : 'text-emerald-400'}`}
          >
            {showSavingReport ? '收起' : '展开建议'}
          </button>
        </div>
        {showSavingReport && (
          <div className="flex flex-col gap-1 mb-2 max-h-[100px] overflow-y-auto scrollbar-thin">
            {savingTips.map(tip => (
              <div
                key={tip.id}
                className={`p-2 rounded-lg border text-[9px] ${tip.priority === 'high' ? (theme === 'minimalist' ? 'border-emerald-200 bg-emerald-50/50' : 'border-emerald-800/40 bg-emerald-950/20') : inner}`}
              >
                <div className="font-bold">{tip.title}</div>
                <div className={muted}>{tip.description}</div>
                <div className="text-emerald-500 font-bold mt-0.5">可省 {tip.savingKwh} kWh · {formatCost(tip.savingCost)}</div>
              </div>
            ))}
            <div className={`text-[9px] font-bold pt-1 ${theme === 'minimalist' ? 'text-emerald-700' : 'text-emerald-400'}`}>
              合计节能空间 ≈ {totalSaving} kWh/日 · {formatCost(totalSavingCost)}
            </div>
          </div>
        )}

        {isEcoSavingsActive ? (
          <div className={`border p-3 rounded-xl text-center ${theme === 'minimalist' ? 'bg-emerald-50 border-emerald-300' : 'bg-emerald-950/30 border-emerald-500/50'}`}>
            <span className="text-xl">🌿</span>
            <div className={`text-[10px] font-bold mt-1 ${theme === 'minimalist' ? 'text-emerald-700' : 'text-emerald-400'}`}>深度节能已启用</div>
            <div className={`text-[8px] ${muted}`}>5号护套机已休眠 · 日省约 120 kWh</div>
          </div>
        ) : (
          <div>
            <p className={`text-[10px] mb-2 ${muted}`}>5号护套挤出机无效空转 13.2kW，建议一键休眠。</p>
            <button
              type="button"
              onClick={onTriggerEcoSaving}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[10px] py-2 rounded-lg cursor-pointer transition"
            >
              🌿 启动一键待机节能
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => onAskAI('尖峰用电如何优化排班降低电费')}
          className="mt-2 w-full text-[9px] text-amber-500 underline cursor-pointer flex items-center justify-center gap-1"
        >
          <Sparkles className="h-3 w-3" />
          智能体：推荐最优启停时间
        </button>
      </section>
    </div>
  );
}
