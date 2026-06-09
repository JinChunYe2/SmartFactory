/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  X,
  Maximize2,
  LayoutGrid,
  MonitorPlay,
  AlertTriangle,
  ChevronRight,
  MapPin,
  Bell,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { AlertLog, CameraZone, ElectronicFence, SecurityCamera } from '../types';
import { getAlertLevelLabel } from '../operationsUtils';
import {
  CAMERA_ZONE_FILTERS,
  SECURITY_KIND_LABEL,
  getSecurityAlerts,
} from '../securityUtils';
import {
  CAMERA_DETECTION_BOXES,
  FOCUS_WIDTH_OPTIONS,
  VIDEO_WALL_LAYOUTS,
  VideoWallLayout,
  cameraHasAlert,
  getAlertsForCamera,
  getCamerasWithAlerts,
} from '../videoWallUtils';

type Theme = 'cyberpunk' | 'minimalist';

interface VideoWallFullscreenProps {
  theme: Theme;
  cameras: SecurityCamera[];
  alerts: AlertLog[];
  fences: ElectronicFence[];
  selectedCameraId: string | null;
  selectedSecurityAlertId: string | null;
  onClose: () => void;
  onSelectCamera: (id: string) => void;
  onSelectSecurityAlert: (alert: AlertLog) => void;
  onResolveAlert: (alertId: string) => void;
}

interface CameraTileProps {
  cam: SecurityCamera;
  theme: Theme;
  alerts: AlertLog[];
  isSelected: boolean;
  isPrimary?: boolean;
  compact?: boolean;
  showDetections?: boolean;
  onClick: () => void;
  onAlertClick: (alert: AlertLog) => void;
}

function CameraTile({
  cam,
  theme,
  alerts,
  isSelected,
  isPrimary,
  compact,
  showDetections,
  onClick,
  onAlertClick,
}: CameraTileProps) {
  const isMinimal = theme === 'minimalist';
  const camAlerts = getAlertsForCamera(alerts, cam.id);
  const hasAlert = camAlerts.length > 0;
  const boxes = showDetections ? CAMERA_DETECTION_BOXES[cam.id] : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-xl border text-left transition-all cursor-pointer ${
        isPrimary ? 'aspect-auto min-h-0 h-full' : compact ? 'aspect-video' : 'aspect-video'
      } ${
        hasAlert
          ? 'border-red-500 ring-2 ring-red-500/40 shadow-lg shadow-red-900/30'
          : isSelected
            ? 'border-indigo-500 ring-2 ring-indigo-500/50'
            : isMinimal
              ? 'border-slate-300 hover:border-indigo-400'
              : 'border-slate-700 hover:border-indigo-500/60'
      } ${cam.status === 'offline' ? 'opacity-55' : ''}`}
    >
      <img
        src={cam.streamUrl}
        alt={cam.name}
        className="absolute inset-0 h-full w-full object-cover"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

      {hasAlert && (
        <div className="absolute inset-0 border-2 border-red-500/60 animate-pulse pointer-events-none rounded-xl" />
      )}

      {boxes?.map((box, i) => (
        <div
          key={i}
          className="absolute border-2 border-red-500 animate-pulse pointer-events-none"
          style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
        >
          <span className="absolute -top-4 left-0 whitespace-nowrap rounded bg-red-600 px-1 py-0.5 text-[9px] font-bold text-white">
            {box.label}
          </span>
        </div>
      ))}

      <div className={`absolute top-2 left-2 flex items-center gap-1 ${compact ? 'scale-90 origin-top-left' : ''}`}>
        <span
          className={`rounded px-1.5 py-0.5 text-[9px] font-black ${
            cam.status === 'online' ? 'bg-red-600 text-white' : 'bg-slate-600 text-slate-200'
          }`}
        >
          {cam.status === 'online' ? 'LIVE' : 'OFF'}
        </span>
        {hasAlert && (
          <span className="flex items-center gap-0.5 rounded bg-red-600/90 px-1.5 py-0.5 text-[9px] font-bold text-white animate-pulse">
            <AlertTriangle className="h-2.5 w-2.5" />
            {camAlerts.length} 告警
          </span>
        )}
      </div>

      {hasAlert && !compact && (
        <div className="absolute top-2 right-2 flex flex-col gap-1 max-w-[45%]">
          {camAlerts.slice(0, 2).map(alert => (
            <span
              key={alert.id}
              role="button"
              tabIndex={0}
              onClick={e => {
                e.stopPropagation();
                onAlertClick(alert);
              }}
              onKeyDown={e => e.key === 'Enter' && (e.stopPropagation(), onAlertClick(alert))}
              className="truncate rounded-lg border border-red-400/60 bg-red-950/80 px-2 py-1 text-[9px] font-bold text-red-200 backdrop-blur-sm hover:bg-red-900 cursor-pointer"
            >
              {alert.securityKind ? SECURITY_KIND_LABEL[alert.securityKind] : getAlertLevelLabel(alert.level)}
            </span>
          ))}
        </div>
      )}

      <div className={`absolute bottom-0 left-0 right-0 p-2 ${compact ? 'p-1.5' : 'p-2.5'}`}>
        <div className={`font-bold text-white truncate ${compact ? 'text-[9px]' : 'text-xs'}`}>{cam.name}</div>
        <div className={`text-white/70 truncate ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
          {cam.code} · {cam.zone}
        </div>
        {!compact && cam.activeDetections.length > 0 && (
          <div className="mt-0.5 text-[8px] text-indigo-300 truncate">
            AI: {cam.activeDetections.join(' · ')}
          </div>
        )}
      </div>

      {isSelected && (
        <div className="absolute inset-0 ring-2 ring-inset ring-indigo-400/50 pointer-events-none rounded-xl" />
      )}
    </button>
  );
}

function AlertDetailPanel({
  alert,
  theme,
  fence,
  onClose,
  onFocus3d,
  onResolve,
}: {
  alert: AlertLog;
  theme: Theme;
  fence?: ElectronicFence;
  onClose: () => void;
  onFocus3d: () => void;
  onResolve: () => void;
}) {
  const isMinimal = theme === 'minimalist';

  return (
    <aside
      className={`flex w-[320px] shrink-0 flex-col border-l ${
        isMinimal ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b px-4 py-3 ${
          isMinimal ? 'border-slate-200 bg-red-50' : 'border-slate-800 bg-red-950/40'
        }`}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <span className={`text-xs font-black ${isMinimal ? 'text-red-700' : 'text-red-400'}`}>告警详情</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`rounded-lg p-1 transition cursor-pointer ${
            isMinimal ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        <div>
          <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">
            {alert.securityKind ? SECURITY_KIND_LABEL[alert.securityKind] : getAlertLevelLabel(alert.level)}
          </span>
          <h3 className={`mt-1 text-sm font-black leading-snug ${isMinimal ? 'text-slate-900' : 'text-white'}`}>
            {alert.title}
          </h3>
        </div>

        <div className={`rounded-xl border p-3 text-[11px] space-y-2 ${isMinimal ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
          <div className="flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-500" />
            <span>{alert.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span>触发时间 {alert.time}</span>
          </div>
        </div>

        <div>
          <div className={`text-[10px] font-bold mb-1 ${isMinimal ? 'text-slate-700' : 'text-slate-300'}`}>问题描述</div>
          <p className={`text-[11px] leading-relaxed ${isMinimal ? 'text-slate-600' : 'text-slate-400'}`}>
            {alert.description}
          </p>
        </div>

        {fence && (
          <div className={`rounded-xl border p-3 text-[10px] ${isMinimal ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-950/30 border-amber-700/50 text-amber-300'}`}>
            <div className="font-bold mb-1">关联电子围栏</div>
            <div>{fence.name} · {fence.area}</div>
            {fence.intrusionAlert && (
              <div className="mt-1 font-bold text-red-500 animate-pulse">越界告警进行中</div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onFocus3d}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold py-2 transition cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            3D 场景聚焦
          </button>
          <button
            type="button"
            onClick={onResolve}
            className={`flex items-center justify-center gap-1.5 rounded-xl border text-[11px] font-bold py-2 transition cursor-pointer ${
              isMinimal
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border-emerald-700 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/40'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            标记已处置
          </button>
        </div>
      </div>
    </aside>
  );
}

export function VideoWallFullscreen({
  theme,
  cameras,
  alerts,
  fences,
  selectedCameraId,
  selectedSecurityAlertId,
  onClose,
  onSelectCamera,
  onSelectSecurityAlert,
  onResolveAlert,
}: VideoWallFullscreenProps) {
  const isMinimal = theme === 'minimalist';
  const securityAlerts = useMemo(() => getSecurityAlerts(alerts).filter(a => a.status === 'pending'), [alerts]);

  const [layout, setLayout] = useState<VideoWallLayout>('grid');
  const [zoneFilter, setZoneFilter] = useState<'all' | CameraZone>('all');
  const [focusWidth, setFocusWidth] = useState(0.75);
  const [focusCamId, setFocusCamId] = useState<string | null>(selectedCameraId ?? cameras[0]?.id ?? null);
  const [detailAlertId, setDetailAlertId] = useState<string | null>(selectedSecurityAlertId);

  const filteredCameras = cameras.filter(c => zoneFilter === 'all' || c.zone === zoneFilter);
  const focusCam = cameras.find(c => c.id === focusCamId) ?? filteredCameras[0];
  const detailAlert = detailAlertId ? alerts.find(a => a.id === detailAlertId) : undefined;
  const detailFence = detailAlert?.fenceId ? fences.find(f => f.id === detailAlert.fenceId) : undefined;

  const alertCameras = getCamerasWithAlerts(filteredCameras, alerts);
  const normalCameras = filteredCameras.filter(c => !cameraHasAlert(alerts, c.id));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (layout === 'alert-priority' && alertCameras.length > 0 && !focusCamId) {
      setFocusCamId(alertCameras[0].id);
    }
  }, [layout, alertCameras, focusCamId]);

  const handleCameraClick = (camId: string) => {
    setFocusCamId(camId);
    onSelectCamera(camId);
    if (layout === 'grid') setLayout('focus');
  };

  const handleAlertClick = (alert: AlertLog) => {
    setDetailAlertId(alert.id);
    if (alert.cameraId) {
      setFocusCamId(alert.cameraId);
      onSelectCamera(alert.cameraId);
    }
    onSelectSecurityAlert(alert);
  };

  const handleFocus3d = () => {
    if (detailAlert) onSelectSecurityAlert(detailAlert);
    onClose();
  };

  const renderGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 h-full auto-rows-fr p-3 md:p-4">
      {filteredCameras.map(cam => (
        <div key={cam.id} className="min-h-0">
          <CameraTile
            cam={cam}
            theme={theme}
            alerts={alerts}
            isSelected={focusCamId === cam.id}
            showDetections
            onClick={() => handleCameraClick(cam.id)}
            onAlertClick={handleAlertClick}
          />
        </div>
      ))}
    </div>
  );

  const renderFocus = () => {
    const sideCams = filteredCameras.filter(c => c.id !== focusCam?.id);

    return (
      <div className="flex h-full gap-2 md:gap-3 p-3 md:p-4">
        <div className="min-h-0 flex flex-col" style={{ width: `${focusWidth * 100}%` }}>
          {focusCam && (
            <CameraTile
              cam={focusCam}
              theme={theme}
              alerts={alerts}
              isSelected
              isPrimary
              showDetections
              onClick={() => {}}
              onAlertClick={handleAlertClick}
            />
          )}
        </div>
        <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto scrollbar-thin pr-1">
          {sideCams.map(cam => (
            <div key={cam.id}>
              <CameraTile
                cam={cam}
                theme={theme}
                alerts={alerts}
                isSelected={false}
                compact
                showDetections={cameraHasAlert(alerts, cam.id)}
                onClick={() => handleCameraClick(cam.id)}
                onAlertClick={handleAlertClick}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAlertPriority = () => {
    if (alertCameras.length === 0) {
      return (
        <div className="h-full flex flex-col">
          <div className={`shrink-0 px-4 py-2 text-[10px] ${isMinimal ? 'text-slate-500' : 'text-slate-400'}`}>
            当前无安防告警，展示全部监控画面
          </div>
          {renderGrid()}
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full gap-2 md:gap-3 p-3 md:p-4 overflow-hidden">
        <div>
          <div className="text-[10px] font-bold text-red-500 mb-1.5 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            异常画面 ({alertCameras.length})
          </div>
          <div
            className={`grid gap-2 md:gap-3 ${alertCameras.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
            style={{ minHeight: alertCameras.length <= 2 ? '45%' : '35%' }}
          >
            {alertCameras.map(cam => (
              <div key={cam.id} className="min-h-0">
                <CameraTile
                  cam={cam}
                  theme={theme}
                  alerts={alerts}
                  isSelected={focusCamId === cam.id}
                  showDetections
                  onClick={() => handleCameraClick(cam.id)}
                  onAlertClick={handleAlertClick}
                />
              </div>
            ))}
          </div>
        </div>
        {normalCameras.length > 0 && (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className={`text-[10px] font-bold mb-1.5 ${isMinimal ? 'text-slate-500' : 'text-slate-400'}`}>
              正常监控 ({normalCameras.length})
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2 flex-1 min-h-0 auto-rows-fr overflow-y-auto scrollbar-thin">
              {normalCameras.map(cam => (
                <div key={cam.id} className="min-h-0">
                  <CameraTile
                    cam={cam}
                    theme={theme}
                    alerts={alerts}
                    isSelected={focusCamId === cam.id}
                    compact
                    onClick={() => handleCameraClick(cam.id)}
                    onAlertClick={handleAlertClick}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col ${isMinimal ? 'bg-slate-100' : 'bg-slate-950'}`}
      role="dialog"
      aria-modal="true"
      aria-label="视频监控全屏"
    >
      {/* Header */}
      <header
        className={`shrink-0 flex flex-wrap items-center gap-2 md:gap-3 border-b px-3 md:px-5 py-2.5 ${
          isMinimal ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 mr-2">
          <Camera className="h-5 w-5 text-indigo-500" />
          <div>
            <h2 className={`text-sm font-black ${isMinimal ? 'text-slate-900' : 'text-white'}`}>安防视频监控墙</h2>
            <p className={`text-[9px] ${isMinimal ? 'text-slate-500' : 'text-slate-400'}`}>
              {filteredCameras.filter(c => c.status === 'online').length}/{filteredCameras.length} 在线
              · {securityAlerts.length} 条待处置告警
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          {VIDEO_WALL_LAYOUTS.map(item => (
            <button
              key={item.id}
              type="button"
              title={item.hint}
              onClick={() => setLayout(item.id)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold border transition cursor-pointer ${
                layout === item.id
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : isMinimal
                    ? 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-indigo-500/50'
              }`}
            >
              {item.id === 'grid' && <LayoutGrid className="h-3 w-3" />}
              {item.id === 'focus' && <Maximize2 className="h-3 w-3" />}
              {item.id === 'alert-priority' && <AlertTriangle className="h-3 w-3" />}
              {item.label}
            </button>
          ))}

          {layout === 'focus' && (
            <div className="flex items-center gap-1 ml-1">
              <span className={`text-[9px] ${isMinimal ? 'text-slate-500' : 'text-slate-500'}`}>主屏占比</span>
              {FOCUS_WIDTH_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFocusWidth(opt.value)}
                  className={`rounded px-2 py-0.5 text-[9px] font-bold border transition cursor-pointer ${
                    focusWidth === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : isMinimal
                        ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {CAMERA_ZONE_FILTERS.map(z => (
            <button
              key={z.id}
              type="button"
              onClick={() => setZoneFilter(z.id)}
              className={`rounded-full px-2 py-0.5 text-[9px] font-semibold border transition cursor-pointer ${
                zoneFilter === z.id
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : isMinimal
                    ? 'bg-white text-slate-600 border-slate-200'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`rounded-xl p-2 transition cursor-pointer ${
            isMinimal ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="退出全屏 (Esc)"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Alert ticker */}
      {securityAlerts.length > 0 && (
        <div
          className={`shrink-0 flex items-center gap-2 overflow-x-auto px-3 py-1.5 border-b scrollbar-thin ${
            isMinimal ? 'bg-red-50 border-red-100' : 'bg-red-950/30 border-red-900/40'
          }`}
        >
          <MonitorPlay className="h-3.5 w-3.5 text-red-500 shrink-0" />
          <span className="text-[9px] font-bold text-red-500 shrink-0">实时告警</span>
          {securityAlerts.map(alert => (
            <button
              key={alert.id}
              type="button"
              onClick={() => handleAlertClick(alert)}
              className={`shrink-0 flex items-center gap-1 rounded-lg border px-2 py-1 text-[9px] font-bold transition cursor-pointer ${
                detailAlertId === alert.id
                  ? 'bg-red-600 text-white border-red-500'
                  : isMinimal
                    ? 'bg-white text-red-700 border-red-200 hover:bg-red-100'
                    : 'bg-red-950/60 text-red-300 border-red-800 hover:bg-red-900/60'
              }`}
            >
              {alert.securityKind ? SECURITY_KIND_LABEL[alert.securityKind] : getAlertLevelLabel(alert.level)}
              <ChevronRight className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-h-0 min-w-0">
          {layout === 'grid' && renderGrid()}
          {layout === 'focus' && renderFocus()}
          {layout === 'alert-priority' && renderAlertPriority()}
        </div>

        {detailAlert && (
          <AlertDetailPanel
            alert={detailAlert}
            theme={theme}
            fence={detailFence}
            onClose={() => setDetailAlertId(null)}
            onFocus3d={handleFocus3d}
            onResolve={() => {
              onResolveAlert(detailAlert.id);
              setDetailAlertId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
