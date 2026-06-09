/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Zap, AlertTriangle } from 'lucide-react';
import { EnergyDeviceProfile, EnergyZoneProfile } from '../types';
import { ENERGY_LEVEL_COLOR, ENERGY_LEVEL_LABEL, ENERGY_LEVEL_BORDER } from '../energyUtils';

type Theme = 'cyberpunk' | 'minimalist';

interface TwinEnergyLayerProps {
  theme: Theme;
  zones: EnergyZoneProfile[];
  deviceProfiles: EnergyDeviceProfile[];
  selectedZoneId: string | null;
  selectedDeviceCode: string | null;
  onSelectZone: (zoneId: string) => void;
}

export function TwinEnergyLayer({
  theme,
  zones,
  deviceProfiles,
  selectedZoneId,
  selectedDeviceCode,
  onSelectZone,
}: TwinEnergyLayerProps) {
  const isMinimal = theme === 'minimalist';
  const idleDevices = deviceProfiles.filter(d => d.isIdleWaste);
  const thl = deviceProfiles.find(d => d.deviceCode === 'THL-002');

  return (
    <>
      {zones.map(zone => {
        const isSelected = selectedZoneId === zone.id;
        return (
          <button
            key={zone.id}
            type="button"
            onClick={() => onSelectZone(zone.id)}
            className={`absolute rounded-2xl border-2 transition-all duration-500 cursor-pointer ${
              ENERGY_LEVEL_BORDER[zone.level]
            } ${isSelected ? 'ring-2 ring-amber-400 ring-offset-1 z-[6]' : 'z-[4]'}`}
            style={{
              left: zone.pos3d.left,
              top: zone.pos3d.top,
              width: zone.pos3d.width,
              height: zone.pos3d.height,
              backgroundColor: ENERGY_LEVEL_COLOR[zone.level],
              transform: 'translateZ(8px)',
            }}
            title={`${zone.name} · ${zone.totalKwh} kWh`}
          >
            <span
              className={`absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-bold px-2 py-0.5 rounded-lg border ${
                isMinimal ? 'bg-white/95 text-slate-800 border-slate-200 shadow' : 'bg-slate-900/90 text-slate-200 border-slate-700'
              }`}
            >
              {ENERGY_LEVEL_LABEL[zone.level]} · {zone.name}
            </span>
          </button>
        );
      })}

      {thl && (
        <button
          type="button"
          onClick={() => onSelectZone('zone-anneal')}
          className={`absolute left-[100px] top-[200px] z-[14] flex flex-col items-center gap-1 cursor-pointer transition hover:scale-105`}
          style={{ transform: 'translateZ(22px)' }}
        >
          <div className={`relative p-2.5 rounded-2xl border-2 border-red-500 shadow-lg ${isMinimal ? 'bg-red-50' : 'bg-red-950/60'}`}>
            <span className="text-2xl">🔥</span>
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[8px] text-white font-bold animate-pulse">
              MAX
            </span>
          </div>
          <span className={`text-[8px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${isMinimal ? 'bg-white border-red-200 text-red-700' : 'bg-red-950/90 border-red-500/50 text-red-300'}`}>
            退火炉 {thl.powerKw} kW
          </span>
        </button>
      )}

      {idleDevices.map(d => (
        <div
          key={d.deviceCode}
          className={`absolute z-[16] flex items-center gap-1 rounded-xl border px-2 py-1 animate-pulse pointer-events-none ${
            isMinimal ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-rose-950/80 border-rose-600/50 text-rose-300'
          }`}
          style={{
            left: d.deviceCode === 'JSX-005' ? 720 : 400,
            top: d.deviceCode === 'JSX-005' ? 280 : 320,
            transform: 'translateZ(20px)',
          }}
        >
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <div className="text-[8px] leading-tight">
            <div className="font-bold">空转浪费</div>
            <div>{d.idleWasteKw} kW 无效耗电</div>
          </div>
        </div>
      ))}

      {selectedDeviceCode && (
        <div
          className={`absolute left-1/2 top-4 -translate-x-1/2 z-[18] flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[9px] font-bold pointer-events-none ${
            isMinimal ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-950/90 border-amber-600/50 text-amber-200'
          }`}
          style={{ transform: 'translateZ(30px)' }}
        >
          <Zap className="h-3.5 w-3.5" />
          已聚焦高耗设备 · 查看浮标功率详情
        </div>
      )}
    </>
  );
}
