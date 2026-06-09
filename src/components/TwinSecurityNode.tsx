/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Camera, Flame } from 'lucide-react';
import { FireEquipment, SecurityCamera } from '../types';
import { getFireTypeLabel } from '../securityUtils';

interface TwinCameraNodeProps {
  camera: SecurityCamera;
  theme: 'cyberpunk' | 'minimalist';
  selected: boolean;
  alertLinked: boolean;
  onSelect: (id: string) => void;
}

export function TwinCameraNode({ camera, theme, selected, alertLinked, onSelect }: TwinCameraNodeProps) {
  const offline = camera.status === 'offline';
  return (
    <button
      type="button"
      className={`absolute z-40 flex flex-col items-center gap-0.5 group pointer-events-auto cursor-pointer transition-all ${selected ? 'scale-110' : 'hover:scale-105'}`}
      style={{ left: camera.pos3d.left, top: camera.pos3d.top, transform: `translateZ(${camera.pos3d.z ?? 30}px)` }}
      onClick={() => onSelect(camera.id)}
    >
      <div className={`relative flex h-8 w-8 items-center justify-center rounded-full shadow-lg border transition ${
        alertLinked
          ? 'bg-red-600 border-red-300 animate-pulse'
          : selected
            ? 'bg-indigo-500 border-indigo-300'
            : offline
              ? 'bg-slate-600 border-slate-500 opacity-70'
              : 'bg-indigo-600 border-indigo-400 hover:bg-indigo-500'
      }`}>
        {alertLinked && <span className="absolute -inset-1 rounded-full border border-red-500 animate-ping" />}
        <Camera className="h-4 w-4 text-white" />
      </div>
      <div className={`text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap max-w-[120px] truncate ${
        theme === 'minimalist' ? 'bg-white border border-slate-200 text-slate-800 shadow' : 'bg-indigo-950/95 border border-indigo-500/50 text-indigo-200'
      }`}>
        {camera.code}
      </div>
    </button>
  );
}

interface TwinFireNodeProps {
  equipment: FireEquipment;
  theme: 'cyberpunk' | 'minimalist';
  selected: boolean;
  onSelect: (id: string) => void;
}

export function TwinFireNode({ equipment, theme, selected, onSelect }: TwinFireNodeProps) {
  if (!equipment.pos3d) return null;
  const abnormal = equipment.status !== '正常';
  return (
    <button
      type="button"
      className={`absolute z-35 flex flex-col items-center gap-0.5 group pointer-events-auto cursor-pointer ${selected ? 'scale-110' : 'hover:scale-105'}`}
      style={{ left: equipment.pos3d.left, top: equipment.pos3d.top, transform: `translateZ(${equipment.pos3d.z ?? 25}px)` }}
      onClick={() => onSelect(equipment.id)}
    >
      <div className={`flex h-7 w-7 items-center justify-center rounded-full shadow-lg border ${
        abnormal ? 'bg-amber-500 border-amber-300 animate-pulse' : 'bg-red-600 border-red-400'
      } ${selected ? 'ring-2 ring-white/50' : ''}`}>
        <Flame className="h-3.5 w-3.5 text-white" />
      </div>
      <div className={`text-[8px] px-1 rounded whitespace-nowrap ${
        theme === 'minimalist' ? 'bg-white text-red-700 border border-red-200' : 'bg-red-950/90 text-red-200 border border-red-800'
      }`}>
        {getFireTypeLabel(equipment.type)}
      </div>
    </button>
  );
}
