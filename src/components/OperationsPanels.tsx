/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  FileText,
  History,
  Plus,
  Search,
  Sliders,
  Wrench,
} from 'lucide-react';
import {
  AlertLog,
  Device,
  MaintenanceRecord,
  MoldChangeRecord,
  WorkOrder,
} from '../types';
import {
  PROCESS_FILTERS,
  computeOpsOverview,
  getAlertLevelLabel,
  getHealthAdvice,
  getOpsStatusTone,
  getParamAlerts,
  getRootCauseHint,
  getStatusLabel,
} from '../operationsUtils';
import { panelCard, panelInner, panelTitle, panelMuted, panelValue } from '../themeStyles';

type Theme = 'cyberpunk' | 'minimalist';

interface OperationsLeftPanelProps {
  theme: Theme;
  devices: Device[];
  alerts: AlertLog[];
  selectedDeviceId: string;
  onSelectDevice: (code: string) => void;
  onSelectAlert: (alertId: string, deviceCode?: string) => void;
}

export function OperationsLeftPanel({
  theme,
  devices,
  alerts,
  selectedDeviceId,
  onSelectDevice,
  onSelectAlert,
}: OperationsLeftPanelProps) {
  const [processFilter, setProcessFilter] = useState<'all' | Device['process']>('all');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [alertFilter, setAlertFilter] = useState<'all' | Device['process']>('all');

  const overview = computeOpsOverview(devices, alerts);
  const card = panelCard(theme);
  const inner = panelInner(theme);
  const title = panelTitle(theme);
  const muted = panelMuted(theme);

  const filteredDevices = devices.filter(d => {
    if (processFilter !== 'all' && d.process !== processFilter) return false;
    const q = ledgerSearch.trim();
    if (!q) return true;
    return d.name.includes(q) || d.code.includes(q) || d.area.includes(q) || d.model.includes(q);
  });

  const opsAlerts = alerts
    .filter(a => a.category === 'operations')
    .filter(a => alertFilter === 'all' || a.location.includes(alertFilter) || a.description.includes(alertFilter));

  return (
    <div className="flex flex-col gap-3.5">
      {/* P0 运维总览看板 */}
      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <Activity className="h-4 w-4 text-blue-500" />
          运维总览看板
        </h3>
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {[
            { label: '总数', value: overview.total, color: 'text-slate-700' },
            { label: '在线', value: overview.online, color: 'text-emerald-600' },
            { label: '停机', value: overview.stopped, color: 'text-slate-500' },
            { label: '故障', value: overview.fault, color: 'text-red-500' },
          ].map(item => (
            <div key={item.label} className={`p-1.5 rounded-lg text-center border ${inner}`}>
              <div className={`text-[8px] ${muted}`}>{item.label}</div>
              <div className={`text-sm font-black ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          <div className={`p-2 rounded-lg border ${inner}`}>
            <span className={muted}>今日停机时长</span>
            <div className="font-black text-rose-500">{overview.downtimeHours} h</div>
          </div>
          <div className={`p-2 rounded-lg border ${inner}`}>
            <span className={muted}>待处置运维告警</span>
            <div className="font-black text-amber-500">{overview.pendingOpsAlerts} 条</div>
          </div>
        </div>
        <div className={`mt-2 p-2 rounded-lg border text-[10px] ${inner}`}>
          <span className={`font-bold block mb-1 ${title}`}>故障 TOP 设备</span>
          {overview.faultTop.map((d, i) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelectDevice(d.code)}
              className={`w-full flex justify-between py-0.5 hover:underline text-left ${muted}`}
            >
              <span>{i + 1}. {d.name}</span>
              <span className="text-red-500 font-bold">{d.faultCountWeek}次/周</span>
            </button>
          ))}
        </div>
        {overview.moldHighWear.length > 0 && (
          <div className={`mt-1.5 p-2 rounded-lg border text-[10px] ${theme === 'minimalist' ? 'bg-amber-50 border-amber-200' : 'bg-amber-950/20 border-amber-800/40'}`}>
            <span className="font-bold text-amber-600">模具损耗预警：</span>
            {overview.moldHighWear.map(d => `${d.code}(${d.moldWear}%)`).join(' · ')}
          </div>
        )}
      </section>

      {/* P0 设备台账 */}
      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <Sliders className="h-4 w-4 text-blue-500" />
          设备台账
        </h3>
        <div className="flex flex-wrap gap-1 mb-2">
          {PROCESS_FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setProcessFilter(f.id)}
              className={`text-[9px] px-2 py-0.5 rounded-full border transition ${
                processFilter === f.id
                  ? 'bg-blue-600 text-white border-blue-500'
                  : theme === 'minimalist' ? 'bg-white text-slate-600 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative mb-2">
          <Search className={`absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 ${muted}`} />
          <input
            value={ledgerSearch}
            onChange={e => setLedgerSearch(e.target.value)}
            placeholder="检索设备/型号/位置"
            className={`w-full pl-7 pr-2 py-1.5 text-[10px] rounded-lg border outline-none ${
              theme === 'minimalist' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-white'
            }`}
          />
        </div>
        <div className="flex flex-col gap-1 max-h-[130px] overflow-y-auto scrollbar-thin pr-0.5">
          {filteredDevices.map(dev => (
            <button
              key={dev.id}
              type="button"
              onClick={() => onSelectDevice(dev.code)}
              className={`text-left p-2 rounded-xl border transition text-[10px] ${
                selectedDeviceId === dev.code
                  ? theme === 'minimalist' ? 'bg-blue-50 border-blue-400' : 'bg-blue-950/40 border-blue-500/50'
                  : inner
              }`}
            >
              <div className="flex justify-between font-bold">
                <span className={theme === 'minimalist' ? 'text-slate-800' : 'text-white'}>{dev.name}</span>
                <span className={getOpsStatusTone(dev) === 'error' ? 'text-red-500' : getOpsStatusTone(dev) === 'warning' ? 'text-amber-500' : 'text-emerald-500'}>
                  {getStatusLabel(getOpsStatusTone(dev))}
                </span>
              </div>
              <div className={`${muted} mt-0.5`}>{dev.code} · {dev.process} · {dev.model}</div>
              <div className={`${muted} text-[9px]`}>📍 {dev.area} · 维保周期 {dev.cycleDays}天 · 模具 {dev.moldCode ?? '—'}</div>
            </button>
          ))}
        </div>
      </section>

      {/* P0 故障告警中心 */}
      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <AlertTriangle className="h-4 w-4 text-red-500" />
          故障告警中心
        </h3>
        <div className="flex flex-wrap gap-1 mb-2">
          {PROCESS_FILTERS.map(f => (
            <button
              key={`alert-${f.id}`}
              type="button"
              onClick={() => setAlertFilter(f.id)}
              className={`text-[9px] px-2 py-0.5 rounded-full border ${
                alertFilter === f.id ? 'bg-red-600 text-white border-red-500' : theme === 'minimalist' ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-1.5 max-h-[120px] overflow-y-auto scrollbar-thin">
          {opsAlerts.length === 0 ? (
            <div className={`text-[10px] text-center py-3 ${muted}`}>暂无匹配告警</div>
          ) : opsAlerts.map(alert => (
            <button
              key={alert.id}
              type="button"
              onClick={() => onSelectAlert(alert.id, alert.location.includes('成缆') ? 'CLJ-003' : undefined)}
              className={`text-left p-2 rounded-xl border text-[10px] ${
                alert.status === 'pending'
                  ? theme === 'minimalist' ? 'bg-red-50 border-red-200' : 'bg-red-950/20 border-red-800/50'
                  : `${inner} opacity-60`
              }`}
            >
              <div className="flex justify-between">
                <span className={`font-bold ${alert.level.includes('P1') ? 'text-red-500' : 'text-amber-500'}`}>
                  {getAlertLevelLabel(alert.level)}
                </span>
                <span className={muted}>{alert.time}</span>
              </div>
              <div className={`font-bold mt-0.5 ${theme === 'minimalist' ? 'text-slate-800' : 'text-white'}`}>{alert.title}</div>
              <div className={muted}>📍 {alert.location} · {alert.status === 'pending' ? '待处置' : '已闭环'}</div>
            </button>
          ))}
        </div>
      </section>

      {/* P2 设备健康度 */}
      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <Activity className="h-4 w-4 text-emerald-500" />
          设备健康度
        </h3>
        <div className="flex flex-col gap-1.5">
          {devices.map(dev => (
            <div key={dev.id} className={`p-2 rounded-xl border text-[10px] ${inner}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold truncate max-w-[140px]">{dev.name}</span>
                <span className={`font-black ${dev.health > 85 ? 'text-emerald-500' : dev.health > 60 ? 'text-amber-500' : 'text-red-500'}`}>{dev.health}分</span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden mb-1 ${theme === 'minimalist' ? 'bg-slate-200' : 'bg-slate-950'}`}>
                <div className={`h-full ${dev.health > 85 ? 'bg-emerald-500' : dev.health > 60 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${dev.health}%` }} />
              </div>
              <p className={`${muted} text-[9px] leading-snug`}>{getHealthAdvice(dev)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

interface OperationsRightPanelProps {
  theme: Theme;
  devices: Device[];
  activeDevice: Device;
  workOrders: WorkOrder[];
  maintenanceRecords: MaintenanceRecord[];
  moldRecords: MoldChangeRecord[];
  onCreateWorkOrder: () => void;
  onDispatchWorkOrder: (id: string) => void;
  onCompleteWorkOrder: (id: string, deviceCode: string) => void;
  onAskAI: (question: string) => void;
}

export function OperationsRightPanel({
  theme,
  devices,
  activeDevice,
  workOrders,
  maintenanceRecords,
  moldRecords,
  onCreateWorkOrder,
  onDispatchWorkOrder,
  onCompleteWorkOrder,
  onAskAI,
}: OperationsRightPanelProps) {
  const [historyTab, setHistoryTab] = useState<'curve' | 'alert' | 'maint' | 'mold'>('curve');
  const [multiView, setMultiView] = useState(false);

  const card = panelCard(theme);
  const inner = panelInner(theme);
  const title = panelTitle(theme);
  const muted = panelMuted(theme);
  const paramAlerts = getParamAlerts(activeDevice);

  const renderParam = (label: string, value: string, alert: boolean) => (
    <div className={`p-2 rounded-xl border ${inner}`}>
      <span className={`text-[9px] block ${muted}`}>{label}</span>
      <span className={`text-sm font-black ${alert ? 'text-red-500 animate-pulse' : panelValue(theme)}`}>{value}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-3.5">
      {/* P0 实时参数面板 */}
      <section className={`p-3 rounded-2xl border ${card}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-xs font-bold flex items-center gap-1.5 ${title}`}>
            <Sliders className="h-4 w-4 text-blue-500" />
            实时参数面板
          </h3>
          <button
            type="button"
            onClick={() => setMultiView(v => !v)}
            className={`text-[9px] px-2 py-0.5 rounded border ${theme === 'minimalist' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'}`}
          >
            {multiView ? '单设备' : '多设备'}
          </button>
        </div>

        {!multiView ? (
          <>
            <div className={`flex justify-between items-center mb-2 pb-1.5 border-b text-[10px] ${theme === 'minimalist' ? 'border-slate-200' : 'border-slate-800'}`}>
              <div>
                <span className={`font-bold block ${theme === 'minimalist' ? 'text-blue-600' : 'text-blue-400'}`}>{activeDevice.name}</span>
                <span className={muted}>{activeDevice.code} · {getStatusLabel(getOpsStatusTone(activeDevice))}</span>
              </div>
              <button type="button" onClick={() => onAskAI(`${activeDevice.name}近一周故障次数？当前张力是否正常？`)} className="text-[9px] text-indigo-500 underline">智能体问询</button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {renderParam('张力 (N)', `${activeDevice.tension}`, paramAlerts.tension)}
              {renderParam('温度 (°C)', `${activeDevice.temperature}`, paramAlerts.temperature)}
              {renderParam('转速 (rpm)', `${activeDevice.speed}`, paramAlerts.speed)}
              {renderParam('压力 (MPa)', `${activeDevice.pressure}`, paramAlerts.pressure)}
              {renderParam('负载 (%)', `${activeDevice.load}`, paramAlerts.load)}
              {renderParam('频率 (Hz)', `${activeDevice.frequency}`, paramAlerts.frequency)}
            </div>
            <p className={`mt-2 text-[9px] p-2 rounded-lg border ${theme === 'minimalist' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-indigo-950/30 border-indigo-800/50 text-indigo-300'}`}>
              🤖 根因提示：{getRootCauseHint(activeDevice)}
            </p>
          </>
        ) : (
          <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto scrollbar-thin">
            {devices.map(dev => {
              const pa = getParamAlerts(dev);
              const anyAlert = Object.values(pa).some(Boolean);
              return (
                <div key={dev.id} className={`p-2 rounded-lg border text-[9px] ${inner}`}>
                  <div className="flex justify-between font-bold mb-0.5">
                    <span>{dev.code}</span>
                    <span className={anyAlert ? 'text-red-500' : 'text-emerald-500'}>{anyAlert ? '阈值告警' : '正常'}</span>
                  </div>
                  <div className={`grid grid-cols-3 gap-1 ${muted}`}>
                    <span className={pa.tension ? 'text-red-500' : ''}>张力{dev.tension}</span>
                    <span className={pa.temperature ? 'text-red-500' : ''}>温度{dev.temperature}</span>
                    <span className={pa.speed ? 'text-red-500' : ''}>转速{dev.speed}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* P1 维修工单 */}
      <section className={`p-3 rounded-2xl border ${card}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-xs font-bold flex items-center gap-1.5 ${title}`}>
            <Wrench className="h-4 w-4 text-blue-500" />
            维修工单
          </h3>
          <button type="button" onClick={onCreateWorkOrder} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] py-1 px-2 rounded-lg">
            <Plus className="h-3 w-3" />告警建单
          </button>
        </div>
        <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto scrollbar-thin">
          {workOrders.map(wo => (
            <div key={wo.id} className={`p-2 rounded-xl border text-[10px] ${inner}`}>
              <div className="font-bold mb-0.5">
                <span className={`truncate max-w-full block ${theme === 'minimalist' ? 'text-slate-900' : 'text-white'}`}>{wo.title}</span>
              </div>
              <div className={muted}>绑定 {wo.deviceCode} · {wo.status} · {wo.assignee}</div>
              <div className="flex gap-1 mt-1 justify-end">
                {wo.status === '待派发' && (
                  <button type="button" onClick={() => onDispatchWorkOrder(wo.id)} className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px]">签收派发</button>
                )}
                {wo.status === '处理中' && (
                  <button type="button" onClick={() => onCompleteWorkOrder(wo.id, wo.deviceCode)} className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px]">验收结单</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* P1 历史追溯 */}
      <section className={`p-3 rounded-2xl border ${card}`}>
        <h3 className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${title}`}>
          <History className="h-4 w-4 text-violet-500" />
          历史追溯
        </h3>
        <div className="flex gap-1 mb-2">
          {([
            ['curve', '参数曲线'],
            ['alert', '历史告警'],
            ['maint', '维修记录'],
            ['mold', '模具更换'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setHistoryTab(id)}
              className={`text-[8px] px-1.5 py-0.5 rounded border ${
                historyTab === id ? 'bg-violet-600 text-white border-violet-500' : theme === 'minimalist' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {historyTab === 'curve' && (
          <div className={`h-14 rounded-lg border p-1 ${inner}`}>
            <svg className="w-full h-full" viewBox="0 0 300 50">
              <path d="M0,35 Q40,10 80,30 T160,25 T240,38 T300,20" fill="none" stroke="#8b5cf6" strokeWidth="2" />
              <path d="M180,15 L180,50" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
            </svg>
            <div className={`text-[8px] flex justify-between ${muted}`}>
              <span>近7日 {activeDevice.code}</span>
              <span className="text-red-500">超阈值 3次</span>
            </div>
          </div>
        )}

        {historyTab === 'alert' && (
          <div className={`text-[9px] max-h-[80px] overflow-y-auto space-y-1 ${muted}`}>
            <div className={`p-1.5 rounded border ${inner}`}>06-09 09:12 成缆机超温 · 215.3°C</div>
            <div className={`p-1.5 rounded border ${inner}`}>06-07 14:05 收线机张力预警 · 38.5N</div>
          </div>
        )}

        {historyTab === 'maint' && (
          <div className="text-[9px] max-h-[80px] overflow-y-auto space-y-1">
            {maintenanceRecords.filter(r => r.deviceCode === activeDevice.code).slice(0, 4).map(r => (
              <div key={r.id} className={`p-1.5 rounded border ${inner}`}>
                <span className="font-bold">{r.type}</span> · {r.summary}
                <div className={muted}>{r.time} · {r.operator}</div>
              </div>
            ))}
          </div>
        )}

        {historyTab === 'mold' && (
          <div className="text-[9px] max-h-[80px] overflow-y-auto space-y-1">
            {moldRecords.filter(r => r.deviceCode === activeDevice.code).map(r => (
              <div key={r.id} className={`p-1.5 rounded border ${inner}`}>
                <FileText className="inline h-3 w-3 mr-1" />
                {r.moldCode} 更换 · 磨损 {r.wearBefore}% · {r.time}
              </div>
            ))}
            {(activeDevice.moldWear ?? 0) >= 70 && (
              <div className="text-amber-500 font-bold">当前模具 {activeDevice.moldCode} 磨损 {activeDevice.moldWear}%</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
