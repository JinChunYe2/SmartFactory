/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { type FC } from 'react';
import { Device, EnergyDeviceProfile } from '../types';
import { DEVICE_3D_LAYOUT } from '../data';
import {
  getOpsStatusTone,
  getStatusBorderClass,
  getStatusLabel,
} from '../operationsUtils';
import { getProductionBorderColor, getProductionLineStatus } from '../productionUtils';
import { ENERGY_LEVEL_BORDER, ENERGY_LEVEL_LABEL, ENERGY_LEVEL_TEXT } from '../energyUtils';

type Theme = 'cyberpunk' | 'minimalist';

interface TwinDeviceNodeProps {
  device: Device;
  theme: Theme;
  selected: boolean;
  hovered: boolean;
  operationsMode: boolean;
  productionMode?: boolean;
  energyMode?: boolean;
  energyProfile?: EnergyDeviceProfile;
  isEcoSavingsActive?: boolean;
  onSelect: (code: string) => void;
  onHover: (code: string | null) => void;
}

export const TwinDeviceNode: FC<TwinDeviceNodeProps> = ({
  device,
  theme,
  selected,
  hovered,
  operationsMode,
  productionMode,
  energyMode,
  energyProfile,
  isEcoSavingsActive,
  onSelect,
  onHover,
}) => {
  const layout = DEVICE_3D_LAYOUT[device.code];
  if (!layout) return null;

  const tone = getOpsStatusTone(device);
  const prodStatus = getProductionLineStatus(device);
  const isFault = tone === 'error';
  const isWarn = tone === 'warning';
  const isIdle = device.code === 'JSX-005';

  const statusBorder = energyMode && energyProfile
    ? `border-2 ${ENERGY_LEVEL_BORDER[energyProfile.level]}${selected ? ' ring-2 ring-amber-400/50' : ''}${energyProfile.isIdleWaste && !isEcoSavingsActive ? ' animate-pulse' : ''}`
    : productionMode
      ? `border-2 ${getProductionBorderColor(prodStatus, theme)}${selected ? ' ring-2 ring-emerald-400/50' : ''}`
      : operationsMode
        ? getStatusBorderClass(tone, theme, selected)
        : selected
          ? 'border-2 border-blue-500'
          : theme === 'minimalist' ? 'border border-slate-200' : 'border border-slate-700';

  const bgClass = energyMode && energyProfile
    ? theme === 'minimalist'
      ? energyProfile.level === 'high' ? 'bg-red-50/90' : energyProfile.level === 'medium' ? 'bg-amber-50/85' : energyProfile.isIdleWaste && !isEcoSavingsActive ? 'bg-rose-50/90' : 'bg-emerald-50/80'
      : energyProfile.level === 'high' ? 'bg-red-950/35' : energyProfile.level === 'medium' ? 'bg-amber-950/25' : energyProfile.isIdleWaste && !isEcoSavingsActive ? 'bg-rose-950/30' : 'bg-emerald-950/20'
    : productionMode
    ? theme === 'minimalist'
      ? prodStatus === 'stopped' ? 'bg-red-50/95' : prodStatus === 'blocked' ? 'bg-amber-50/90' : prodStatus === 'idle' ? 'bg-slate-100' : 'bg-emerald-50/90'
      : prodStatus === 'stopped' ? 'bg-red-950/40' : prodStatus === 'blocked' ? 'bg-amber-950/30' : prodStatus === 'idle' ? 'bg-slate-800/80' : 'bg-emerald-950/25'
    : theme === 'minimalist'
      ? isFault ? 'bg-rose-50/95' : isWarn ? 'bg-amber-50/90' : isIdle && isEcoSavingsActive ? 'bg-emerald-50' : 'bg-slate-50'
      : isFault ? 'bg-slate-900/95' : 'bg-slate-800/90';

  const icon = energyMode && energyProfile?.isIdleWaste
    ? isEcoSavingsActive ? '✅' : '⚡'
    : isIdle && isEcoSavingsActive ? '✅' : isIdle ? '💤' : layout.icon;

  return (
    <div
      className={`${layout.className} ${layout.zIndex} p-3 rounded-2xl flex flex-col items-center gap-2 shadow-lg select-none transition-all duration-500 cursor-pointer group ${statusBorder} ${bgClass} ${
        selected ? 'scale-105' : 'hover:scale-[1.02]'
      }`}
      onClick={() => onSelect(device.code)}
      onMouseEnter={() => onHover(device.code)}
      onMouseLeave={() => onHover(null)}
      style={{ transform: 'translateZ(15px)' }}
    >
      {/* 故障聚焦：红色扩散光圈（无频闪） */}
      {operationsMode && isFault && (
        <span className="absolute inset-[-16px] rounded-3xl border-2 border-red-500/40 pointer-events-none animate-[pulse_3s_ease-in-out_infinite]" />
      )}
      {operationsMode && isWarn && !isFault && (
        <span className="absolute inset-[-10px] rounded-2xl border border-amber-400/50 pointer-events-none" />
      )}

      {isFault && (
        <span className="absolute -top-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[10px] text-white font-bold">!</span>
      )}

      {/* 状态色条 */}
      {(operationsMode || productionMode || energyMode) && (
        <span className={`absolute top-1 left-1 h-2 w-2 rounded-full ${
          energyMode && energyProfile
            ? energyProfile.level === 'high' ? 'bg-red-500 animate-pulse' : energyProfile.level === 'medium' ? 'bg-amber-400' : energyProfile.isIdleWaste ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
            : productionMode
            ? prodStatus === 'stopped' ? 'bg-red-500' : prodStatus === 'blocked' ? 'bg-amber-400 animate-pulse' : prodStatus === 'idle' ? 'bg-slate-400' : 'bg-emerald-500'
            : tone === 'error' ? 'bg-red-500' : tone === 'warning' ? 'bg-amber-400' : tone === 'idle' ? 'bg-slate-400' : 'bg-emerald-500'
        }`} />
      )}

      <div className="flex justify-between w-full text-[10px]">
        <span className={theme === 'minimalist' ? 'text-slate-500 font-semibold' : 'text-slate-400'}>{device.process}</span>
        <span className={`font-bold px-1 rounded font-mono ${
          tone === 'error' ? 'text-red-500' : tone === 'warning' ? 'text-amber-500' : 'text-emerald-500'
        }`}>{device.code}</span>
      </div>

      <div className={`h-10 w-12 border rounded flex items-center justify-center text-xl ${
        theme === 'minimalist' ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-850'
      }`}>
        {icon}
      </div>

      <div className={`text-[11px] font-extrabold text-center ${theme === 'minimalist' ? 'text-slate-800' : 'text-slate-200'}`}>
        {device.name}
      </div>

      {energyMode && energyProfile?.isIdleWaste && !isEcoSavingsActive && (
        <span className={`absolute -top-2 -right-2 text-[7px] font-black px-1 py-0.5 rounded bg-rose-600 text-white`}>空耗</span>
      )}

      <div className={`flex gap-1 w-full border-t pt-1 text-[9px] justify-between ${
        theme === 'minimalist' ? 'border-slate-200/60 text-slate-500' : 'border-slate-700/60 text-slate-400'
      }`}>
        {energyMode && energyProfile ? (
          <>
            <span className={ENERGY_LEVEL_TEXT[energyProfile.level]}>{energyProfile.powerKw} kW</span>
            <span>{energyProfile.dailyKwh} kWh</span>
          </>
        ) : (
          <>
            <span>张力 {device.tension}N</span>
            <span className={device.temperature > device.thresholds.temperatureMax ? 'text-red-500 font-bold' : ''}>
              {device.temperature}°C
            </span>
          </>
        )}
      </div>

      {(hovered || selected) && energyMode && energyProfile && (
        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-50 min-w-[155px] p-2 rounded-xl border shadow-xl text-[9px] pointer-events-none ${
          theme === 'minimalist' ? 'bg-white border-amber-200 text-slate-700' : 'bg-slate-900/95 border-amber-700/50 text-slate-200'
        }`}>
          <div className={`font-bold mb-1 ${ENERGY_LEVEL_TEXT[energyProfile.level]}`}>
            {ENERGY_LEVEL_LABEL[energyProfile.level]}
          </div>
          <div>实时功率 {energyProfile.powerKw} kW · 负载 {energyProfile.loadPct}%</div>
          <div>当日累计 {energyProfile.dailyKwh} kWh</div>
          {energyProfile.kwhPerKm != null && energyProfile.kwhPerKm > 0 && (
            <div>单位电耗 {energyProfile.kwhPerKm} kWh/km</div>
          )}
          {energyProfile.isIdleWaste && !isEcoSavingsActive && (
            <div className="text-rose-500 font-bold mt-0.5">⚠ 待机空耗 {energyProfile.idleWasteKw} kW</div>
          )}
        </div>
      )}

      {(hovered || selected) && (operationsMode || productionMode) && !energyMode && (
        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-50 min-w-[140px] p-2 rounded-xl border shadow-xl text-[9px] pointer-events-none ${
          theme === 'minimalist' ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900/95 border-slate-700 text-slate-200'
        }`}>
          <div className="font-bold mb-1">
            {productionMode
              ? prodStatus === 'running' ? '正常生产' : prodStatus === 'idle' ? '待机' : prodStatus === 'blocked' ? '堵塞' : '停机'
              : getStatusLabel(tone)}
          </div>
          <div>线速 {device.speed} m/min · 负载 {device.load}%</div>
          <div>张力 {device.tension}N · 温度 {device.temperature}°C</div>
          {productionMode && device.faultCountWeek > 0 && (
            <div className="text-red-500">本周断线/故障 {device.faultCountWeek} 次</div>
          )}
        </div>
      )}
    </div>
  );
};
