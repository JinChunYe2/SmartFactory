/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import {
  BottleneckHeatCell,
  ProcessStep,
  ProcessStepId,
  WipZone,
} from '../types';
import {
  getProductionLineColor,
  PROCESS_STEP_STATUS_LABEL,
} from '../productionUtils';

type Theme = 'cyberpunk' | 'minimalist';

interface TwinProductionLayerProps {
  theme: Theme;
  processSteps: ProcessStep[];
  wipZones: WipZone[];
  heatmapCells: BottleneckHeatCell[];
  selectedProcessStepId: ProcessStepId | null;
  showHeatmap: boolean;
  onSelectProcessStep: (id: ProcessStepId) => void;
}

const FLOW_PATH = 'M 120,290 L 280,290 L 420,290 L 580,310 L 760,310 L 880,310';

export function TwinProductionLayer({
  theme,
  processSteps,
  wipZones,
  heatmapCells,
  selectedProcessStepId,
  showHeatmap,
  onSelectProcessStep,
}: TwinProductionLayerProps) {
  const isMinimal = theme === 'minimalist';

  return (
    <>
      {/* 产线区域状态着色 P0 */}
      {processSteps.map(step => {
        const isHighlighted = selectedProcessStepId === step.id;
        const region = step.bayRegion;
        return (
          <div
            key={`region-${step.id}`}
            className={`absolute rounded-2xl pointer-events-none transition-all duration-500 border-2 ${
              isHighlighted
                ? 'border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.35)] z-[5]'
                : 'border-transparent'
            }`}
            style={{
              left: region.left,
              top: region.top,
              width: region.width,
              height: region.height,
              backgroundColor: getProductionLineColor(step.status),
              transform: 'translateZ(5px)',
            }}
          >
            {isHighlighted && (
              <div
                className={`absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold px-2 py-0.5 rounded-lg border ${
                  isMinimal
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                }`}
              >
                {step.label} · {PROCESS_STEP_STATUS_LABEL[step.status]}
              </div>
            )}
          </div>
        );
      })}

      {/* 瓶颈热力图 P2 */}
      {showHeatmap &&
        heatmapCells.map(cell => (
          <div
            key={cell.id}
            className="absolute rounded-xl pointer-events-none animate-pulse"
            style={{
              left: cell.pos3d.left,
              top: cell.pos3d.top,
              width: cell.pos3d.width,
              height: cell.pos3d.height,
              background: `radial-gradient(ellipse at center, rgba(239,68,68,${cell.intensity * 0.45}) 0%, transparent 70%)`,
              transform: 'translateZ(8px)',
            }}
          >
            <span
              className={`absolute bottom-1 left-1 text-[8px] px-1.5 py-0.5 rounded font-bold ${
                isMinimal ? 'bg-red-100 text-red-700' : 'bg-red-950/80 text-red-300'
              }`}
            >
              🔥 {cell.label} · 堵塞 {cell.blockageCount} 次
            </span>
          </div>
        ))}

      {/* 工艺流程动画 P0 */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-[6]" style={{ transform: 'translateZ(12px)' }}>
        <defs>
          <marker id="flow-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#10b981" />
          </marker>
          <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          d={FLOW_PATH}
          stroke="url(#flow-gradient)"
          strokeWidth="5"
          fill="none"
          markerEnd="url(#flow-arrow)"
          className="animate-[dash_5s_linear_infinite]"
          style={{
            strokeDasharray: '14, 10',
            filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.6))',
          }}
        />
        {/* 堵塞段标红 */}
        <path
          d="M 380,290 L 520,290"
          stroke="#ef4444"
          strokeWidth="6"
          fill="none"
          className="animate-pulse opacity-70"
          style={{ filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' }}
        />
      </svg>

      {/* 工序节点（可点击跳转） P0 */}
      {processSteps.map((step, idx) => {
        const x = [120, 280, 420, 580, 760][idx] ?? 120;
        const y = idx >= 3 ? 310 : 290;
        const isSelected = selectedProcessStepId === step.id;
        const dotColor =
          step.status === 'running'
            ? '#10b981'
            : step.status === 'idle'
              ? '#94a3b8'
              : step.status === 'blocked'
                ? '#f59e0b'
                : '#ef4444';

        return (
          <button
            key={`node-${step.id}`}
            type="button"
            onClick={() => onSelectProcessStep(step.id)}
            className={`absolute z-[15] flex flex-col items-center gap-0.5 cursor-pointer transition-transform hover:scale-110 ${
              isSelected ? 'scale-110' : ''
            }`}
            style={{ left: x - 24, top: y - 36, transform: 'translateZ(20px)' }}
            title={`${step.label} · ${PROCESS_STEP_STATUS_LABEL[step.status]}`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-black shadow-lg ${
                isSelected ? 'ring-2 ring-emerald-400 ring-offset-1' : ''
              }`}
              style={{
                backgroundColor: isMinimal ? '#fff' : '#0f172a',
                borderColor: dotColor,
                color: dotColor,
              }}
            >
              {idx + 1}
            </span>
            <span
              className={`text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                isMinimal ? 'bg-white/95 text-slate-800 shadow' : 'bg-slate-900/90 text-slate-200'
              }`}
            >
              {step.label}
            </span>
          </button>
        );
      })}

      {/* 在制品标识 P1 */}
      {wipZones.map(wip => (
        <div
          key={wip.id}
          className={`absolute z-[12] flex items-center gap-1 rounded-xl border px-2 py-1 shadow-lg pointer-events-none ${
            isMinimal
              ? 'bg-amber-50/95 border-amber-300 text-amber-900'
              : 'bg-amber-950/80 border-amber-600/50 text-amber-200'
          }`}
          style={{ left: wip.pos3d.left, top: wip.pos3d.top, transform: 'translateZ(18px)' }}
        >
          <Package className="h-3 w-3 shrink-0" />
          <div className="text-[8px] leading-tight">
            <div className="font-bold">{wip.label}</div>
            <div>
              {wip.wipQty} {wip.unit} · {wip.orderLabel}
            </div>
          </div>
        </div>
      ))}

      {/* 堵塞提示 */}
      {processSteps.some(s => s.status === 'stopped' || s.status === 'blocked') && (
        <div
          className={`absolute left-[36%] top-[250px] z-[20] flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[9px] font-bold pointer-events-none animate-pulse ${
            isMinimal ? 'bg-red-50 border-red-300 text-red-700' : 'bg-red-950/90 border-red-500/50 text-red-300'
          }`}
          style={{ transform: 'translateZ(25px)' }}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          成缆段停机 · 护套待料堵塞
        </div>
      )}
    </>
  );
}
