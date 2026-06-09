/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Camera, AlertTriangle, Users, Search, Download, RotateCcw, Shield, Flame, Lock, Unlock, History, MapPin, Maximize2 } from 'lucide-react';
import {
  AlertLog,
  CameraZone,
  DoorLog,
  ElectronicFence,
  FireEquipment,
  SafetyEvent,
  SecurityCamera,
} from '../types';
import { getAlertLevelLabel } from '../operationsUtils';
import {
  CAMERA_ZONE_FILTERS,
  SECURITY_KIND_LABEL,
  computeSecurityOverview,
  getFireTypeLabel,
  getSecurityAlerts,
} from '../securityUtils';
import { panelCard, panelInner, panelTitle, panelMuted, panelValue } from '../themeStyles';

type Theme = 'cyberpunk' | 'minimalist';

interface SecurityLeftPanelProps {
  theme: Theme;
  cameras: SecurityCamera[];
  alerts: AlertLog[];
  doorLogs: DoorLog[];
  selectedCameraId: string | null;
  selectedSecurityAlertId: string | null;
  searchGateQuery: string;
  onSearchGateChange: (q: string) => void;
  onSelectCamera: (id: string) => void;
  onSelectSecurityAlert: (alert: AlertLog) => void;
  onOpenVideoWall: () => void;
}

export function SecurityLeftPanel({
  theme,
  cameras,
  alerts,
  doorLogs,
  selectedCameraId,
  selectedSecurityAlertId,
  searchGateQuery,
  onSearchGateChange,
  onSelectCamera,
  onSelectSecurityAlert,
  onOpenVideoWall,
}: SecurityLeftPanelProps) {
  const [zoneFilter, setZoneFilter] = useState<'all' | CameraZone>('all');
  const [doorTimeFilter, setDoorTimeFilter] = useState<'today' | 'all'>('today');

  const card = panelCard(theme);
  const inner = panelInner(theme);
  const title = panelTitle(theme);
  const muted = panelMuted(theme);
  const overview = computeSecurityOverview(cameras, alerts, doorLogs);
  const securityAlerts = getSecurityAlerts(alerts).filter(a => a.status === 'pending');
  const filteredCameras = cameras.filter(c => zoneFilter === 'all' || c.zone === zoneFilter);
  const filteredDoorLogs = doorLogs.filter(log => {
    const q = searchGateQuery.trim();
    const matchSearch = !q || log.name.includes(q) || log.location.includes(q) || log.role.includes(q);
    return matchSearch && (doorTimeFilter === 'all' || true);
  });

  return (
    <div className="flex flex-col gap-3.5">
      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 ${title}`}>安防总览</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: '在线摄像头', value: `${overview.online}/${overview.total}`, color: 'text-emerald-500' },
            { label: '安全告警', value: `${overview.pendingSecurity}`, color: 'text-red-500' },
            { label: '今日进出', value: `${overview.todayInOut}`, color: theme === 'minimalist' ? 'text-indigo-600' : 'text-indigo-400' },
          ].map(item => (
            <div key={item.label} className={`p-2 rounded-lg text-center border ${inner}`}>
              <div className={`text-[8px] ${muted}`}>{item.label}</div>
              <div className={`text-sm font-black ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={`p-3 rounded-2xl border ${card}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-xs font-bold flex items-center gap-1.5 ${title}`}>
            <Camera className="h-4 w-4 text-indigo-500" />
            视频监控墙
          </h3>
          <button
            type="button"
            onClick={onOpenVideoWall}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-bold border transition cursor-pointer ${
              theme === 'minimalist'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                : 'bg-indigo-950/50 text-indigo-300 border-indigo-700/50 hover:bg-indigo-900/50'
            }`}
            title="全屏查看全部摄像头"
          >
            <Maximize2 className="h-3 w-3" />
            全屏
          </button>
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {CAMERA_ZONE_FILTERS.map(z => (
            <button key={z.id} type="button" onClick={() => setZoneFilter(z.id)} className={`text-[9px] px-2 py-0.5 rounded-full border transition ${zoneFilter === z.id ? 'bg-indigo-600 text-white border-indigo-500' : theme === 'minimalist' ? 'bg-white text-slate-600 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
              {z.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5 max-h-[180px] overflow-y-auto scrollbar-thin">
          {filteredCameras.map(cam => (
            <button key={cam.id} type="button" onClick={() => onSelectCamera(cam.id)} className={`relative rounded-xl overflow-hidden aspect-video border transition ${selectedCameraId === cam.id ? 'border-indigo-500 ring-2 ring-indigo-500/40' : theme === 'minimalist' ? 'border-slate-200' : 'border-slate-800'} ${cam.status === 'offline' ? 'opacity-60' : ''}`}>
              <img src={cam.streamUrl} alt={cam.name} className="absolute inset-0 w-full h-full object-cover opacity-70" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 flex flex-col justify-end text-left">
                <span className="text-[8px] font-bold w-max px-1 rounded bg-red-600 text-white">{cam.status === 'online' ? 'LIVE' : 'OFF'}</span>
                <div className="text-[9px] font-bold text-white truncate">{cam.name}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-1 mt-2">
          <button type="button" onClick={() => alert('已切换至近30分钟录像回放（演示）')} className={`flex-1 flex items-center justify-center gap-1 text-[9px] py-1 rounded border ${inner}`}><RotateCcw className="h-3 w-3" />回放</button>
          <button type="button" onClick={() => alert('画面已截图存证（演示）')} className={`flex-1 flex items-center justify-center gap-1 text-[9px] py-1 rounded border ${inner}`}><Download className="h-3 w-3" />截图</button>
        </div>
      </section>

      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <AlertTriangle className="h-4 w-4 text-red-500" />
          区域告警中心
        </h3>
        <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto scrollbar-thin">
          {securityAlerts.map(alert => (
            <button key={alert.id} type="button" onClick={() => onSelectSecurityAlert(alert)} className={`text-left p-2 rounded-xl border text-[10px] ${selectedSecurityAlertId === alert.id ? 'border-red-500 bg-red-950/20' : inner}`}>
              <div className="flex justify-between">
                <span className="font-bold text-red-500">{alert.securityKind ? SECURITY_KIND_LABEL[alert.securityKind] : getAlertLevelLabel(alert.level)}</span>
                <span className={muted}>{alert.time}</span>
              </div>
              <div className={`font-bold ${panelValue(theme)}`}>{alert.title}</div>
            </button>
          ))}
        </div>
      </section>

      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <Users className="h-4 w-4 text-emerald-500" />
          人员门禁管理
        </h3>
        <div className="relative mb-2">
          <Search className={`absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 ${muted}`} />
          <input value={searchGateQuery} onChange={e => onSearchGateChange(e.target.value)} placeholder="按姓名/位置检索" className={`w-full pl-7 py-1.5 text-[10px] rounded-lg border outline-none ${theme === 'minimalist' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-white'}`} />
        </div>
        <div className="flex flex-col gap-1 max-h-[90px] overflow-y-auto scrollbar-thin">
          {filteredDoorLogs.map(log => (
            <div key={log.id} className={`p-1.5 rounded-lg border text-[9px] flex justify-between ${inner}`}>
              <span>{log.avatar} {log.name} <span className={muted}>({log.role})</span></span>
              <span className={log.status === 'warning' ? 'text-red-500' : 'text-emerald-500'}>{log.action}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

interface SecurityRightPanelProps {
  theme: Theme;
  cameras: SecurityCamera[];
  fences: ElectronicFence[];
  fireEquipment: FireEquipment[];
  safetyEvents: SafetyEvent[];
  selectedCameraId: string | null;
  selectedFireId: string | null;
  showEmergencyGuide: boolean;
  onToggleFence: (id: string) => void;
  onFireInspect: (id: string) => void;
  onSelectFire: (id: string) => void;
  onClearEmergency: () => void;
  onAskAI: (q: string) => void;
}

export function SecurityRightPanel({
  theme,
  cameras,
  fences,
  fireEquipment,
  safetyEvents,
  selectedCameraId,
  selectedFireId,
  showEmergencyGuide,
  onToggleFence,
  onFireInspect,
  onSelectFire,
  onClearEmergency,
  onAskAI,
}: SecurityRightPanelProps) {
  const card = panelCard(theme);
  const inner = panelInner(theme);
  const title = panelTitle(theme);
  const muted = panelMuted(theme);
  const activeCam = cameras.find(c => c.id === selectedCameraId);

  return (
    <div className="flex flex-col gap-3.5">
      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <Camera className="h-4 w-4 text-indigo-500" />
          实时视频监控
        </h3>
        {activeCam ? (
          <>
            <div className="relative rounded-xl overflow-hidden aspect-video mb-2 border border-indigo-500/50">
              <img src={activeCam.streamUrl} alt={activeCam.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              {activeCam.id === 'cam-02' && (
                <div className="absolute top-1/4 left-1/3 border-2 border-red-500 w-16 h-24 animate-pulse pointer-events-none">
                  <span className="absolute -top-4 bg-red-600 text-[6px] text-white px-1">闯入者</span>
                </div>
              )}
            </div>
            <div className={`text-[10px] space-y-0.5 ${muted}`}>
              <div className="font-bold text-indigo-400">{activeCam.name}</div>
              <div>{activeCam.code} · {activeCam.zone} · {activeCam.status === 'online' ? '在线' : '离线'}</div>
              <div>AI: {activeCam.activeDetections.join(' · ')}</div>
            </div>
          </>
        ) : (
          <div className={`text-[10px] text-center py-6 ${muted}`}>点击左侧或 3D 摄像头点位查看实时画面</div>
        )}
      </section>

      {showEmergencyGuide && (
        <section className={`p-3 rounded-2xl border ${theme === 'minimalist' ? 'bg-amber-50 border-amber-300' : 'bg-amber-950/30 border-amber-600/50'}`}>
          <h3 className="text-xs font-bold text-amber-500 mb-1 flex items-center gap-1"><MapPin className="h-4 w-4" />应急指引</h3>
          <p className={`text-[10px] mb-2 ${muted}`}>重大告警已触发：请沿 A区主通道向东疏散，就近消防设备 FE-14（危化库大门）、FH-01（拉丝柱侧）。</p>
          <button type="button" onClick={onClearEmergency} className="text-[9px] text-amber-600 underline">关闭指引</button>
        </section>
      )}

      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}><Shield className="h-4 w-4 text-indigo-500" />电子围栏</h3>
        <div className="flex flex-col gap-1.5">
          {fences.map(fence => (
            <div key={fence.id} className={`p-2 rounded-xl border text-[10px] flex justify-between items-center ${inner}`}>
              <div>
                <span className={`font-bold ${panelValue(theme)}`}>{fence.name}</span>
                <span className={`block text-[8px] ${muted}`}>{fence.fenceType} · {fence.area}</span>
                {fence.intrusionAlert && <span className="text-red-500 font-bold animate-pulse">越界告警中</span>}
              </div>
              <button type="button" onClick={() => onToggleFence(fence.id)} className={`px-2 py-0.5 rounded text-[9px] border flex items-center gap-1 ${fence.status === 'active' ? 'border-indigo-500 text-indigo-400' : muted}`}>
                {fence.status === 'active' ? <><Lock className="h-3 w-3" />撤防</> : <><Unlock className="h-3 w-3" />布防</>}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}><Flame className="h-4 w-4 text-red-500" />消防设备台账</h3>
        <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto scrollbar-thin">
          {fireEquipment.map(eq => (
            <button key={eq.id} type="button" onClick={() => onSelectFire(eq.id)} className={`text-left p-2 rounded-xl border text-[10px] ${selectedFireId === eq.id ? 'border-red-500' : inner} ${eq.status !== '正常' ? 'ring-1 ring-amber-500/50' : ''}`}>
              <div className="flex justify-between font-bold">
                <span className={panelValue(theme)}>{eq.name}</span>
                <span className={eq.status === '正常' ? 'text-emerald-500' : 'text-amber-500'}>{eq.status}</span>
              </div>
              <div className={muted}>{getFireTypeLabel(eq.type)} · 周期{eq.cycleDays}天 · {eq.area}</div>
              {eq.status === '待巡检' && (
                <span role="button" tabIndex={0} onClick={e => { e.stopPropagation(); onFireInspect(eq.id); }} onKeyDown={e => e.key === 'Enter' && onFireInspect(eq.id)} className="text-indigo-400 underline text-[9px]">完成巡检</span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}><History className="h-4 w-4 text-violet-500" />安全事件台账</h3>
        <div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto scrollbar-thin">
          {safetyEvents.map(ev => (
            <div key={ev.id} className={`p-2 rounded-xl border text-[9px] ${inner}`}>
              <div className="flex justify-between font-bold">
                <span className={panelValue(theme)}>{ev.title}</span>
                <span className={ev.status === '已闭环' ? 'text-emerald-500' : 'text-amber-500'}>{ev.status}</span>
              </div>
              <div className={muted}>{ev.type} · {ev.time}</div>
              <div className={`mt-0.5 ${muted}`}>{ev.process.slice(0, 48)}…</div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onAskAI('北门今日访客记录')} className="mt-2 text-[9px] text-indigo-500 underline">智能体：查询访客/视频</button>
      </section>
    </div>
  );
}
