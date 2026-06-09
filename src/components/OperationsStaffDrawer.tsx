/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';
import { OperationStaff } from '../types';
import { panelInner, panelMuted, panelTitle } from '../themeStyles';

type Theme = 'cyberpunk' | 'minimalist';

interface OperationsStaffDrawerProps {
  theme: Theme;
  sidePanelsOpen: boolean;
  staff: OperationStaff[];
  selectedStaffId: string | null;
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelectStaff: (staffId: string) => void;
}

function getStaffStatusClass(theme: Theme, status: OperationStaff['status']) {
  if (status === '抢修中') return 'text-red-500';
  if (status === '巡检中') return 'text-amber-500';
  if (status === '在线') return 'text-emerald-500';
  return theme === 'minimalist' ? 'text-slate-400' : 'text-slate-500';
}

export function OperationsStaffDrawer({
  theme,
  sidePanelsOpen,
  staff,
  selectedStaffId,
  isOpen,
  onToggleOpen,
  onSelectStaff,
}: OperationsStaffDrawerProps) {
  const isMinimal = theme === 'minimalist';
  const inner = panelInner(theme);
  const title = panelTitle(theme);
  const muted = panelMuted(theme);

  const onlineCount = staff.filter(s => s.status === '在线' || s.status === '巡检中' || s.status === '抢修中').length;

  return (
    <aside
      className={`fixed top-14 bottom-0 z-[35] flex items-stretch pointer-events-none transition-[right] duration-300 ease-in-out ${
        sidePanelsOpen ? 'right-[340px]' : 'right-0'
      }`}
      aria-label="运维人员管理"
    >
      <div
        className={`flex h-full max-h-[calc(100vh-3.5rem)] pointer-events-auto transition-all duration-300 ease-in-out ${
          isOpen ? 'w-[300px]' : 'w-0'
        }`}
      >
        <div
          className={`flex flex-col h-full min-h-0 border shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300 ${
            isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
          } ${
            isMinimal
              ? 'bg-white/95 border-slate-200 text-slate-800'
              : 'bg-slate-900/95 border-slate-700 text-slate-100'
          }`}
        >
          <div
            className={`shrink-0 px-3 py-2.5 border-b flex items-center justify-between ${
              isMinimal ? 'bg-indigo-50/80 border-slate-200' : 'bg-indigo-950/40 border-slate-800'
            }`}
          >
            <div>
              <h3 className={`text-xs font-bold flex items-center gap-1.5 ${title}`}>
                <Users className="h-4 w-4 text-indigo-500" />
                人员管理
              </h3>
              <p className={`text-[9px] mt-0.5 ${muted}`}>
                在岗 {onlineCount}/{staff.length} · 点击定位 3D
              </p>
            </div>
          </div>

          <div className={`shrink-0 grid grid-cols-[0.75fr_0.65fr_0.55fr_1.15fr] gap-1 px-3 py-1.5 text-[8px] font-bold border-b ${muted} ${
            isMinimal ? 'border-slate-100 bg-slate-50/80' : 'border-slate-800 bg-slate-950/40'
          }`}>
            <span>姓名</span>
            <span>状态</span>
            <span>工龄</span>
            <span>实时位置</span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2 min-h-0">
            <div className="flex flex-col gap-1">
              {staff.map(person => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => onSelectStaff(person.id)}
                  className={`text-left p-2 rounded-xl border transition text-[10px] w-full cursor-pointer ${
                    selectedStaffId === person.id
                      ? isMinimal
                        ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                        : 'bg-indigo-950/50 border-indigo-500/50'
                      : inner
                  }`}
                >
                  <div className="grid grid-cols-[0.75fr_0.65fr_0.55fr_1.15fr] gap-1 items-center">
                    <span className={`font-bold truncate ${isMinimal ? 'text-slate-800' : 'text-white'}`}>
                      {person.name}
                    </span>
                    <span className={`font-bold ${getStaffStatusClass(theme, person.status)}`}>
                      {person.status}
                    </span>
                    <span className={muted}>{person.workYears}年</span>
                    <span className={`${muted} truncate flex items-center gap-0.5`}>
                      <MapPin className="h-3 w-3 shrink-0" />
                      {person.currentLocation}
                    </span>
                  </div>
                  <div className={`mt-1 flex justify-between text-[8px] ${muted}`}>
                    <span>{person.role} · {person.shift}</span>
                    <span>{person.phone}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={`shrink-0 px-3 py-2 border-t text-[9px] ${muted} ${
            isMinimal ? 'border-slate-100 bg-slate-50/60' : 'border-slate-800 bg-slate-950/30'
          }`}>
            选中人员后，3D 场景自动导航至当前位置。
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleOpen}
        title={isOpen ? '收起人员管理' : '展开人员管理'}
        className={`shrink-0 self-center flex flex-col items-center justify-center gap-1 w-9 min-h-[120px] rounded-l-xl border-y border-l shadow-lg backdrop-blur-md transition-all duration-300 cursor-pointer pointer-events-auto ${
          isMinimal
            ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white'
            : 'bg-indigo-700/90 hover:bg-indigo-600 border-indigo-500/60 text-white'
        }`}
      >
        {isOpen ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
        <Users className="h-4 w-4" />
        <span
          className="text-[9px] font-bold tracking-widest"
          style={{ writingMode: 'vertical-rl' }}
        >
          人员管理
        </span>
        {!isOpen && onlineCount > 0 && (
          <span className="mt-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-400 px-1 text-[8px] font-black text-slate-900">
            {onlineCount}
          </span>
        )}
      </button>
    </aside>
  );
}
