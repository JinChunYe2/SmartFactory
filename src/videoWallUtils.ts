/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertLog, CameraZone, SecurityCamera } from './types';

export function getAlertsForCamera(alerts: AlertLog[], cameraId: string): AlertLog[] {
  return alerts.filter(a => a.cameraId === cameraId && a.status === 'pending');
}

export function getCamerasWithAlerts(cameras: SecurityCamera[], alerts: AlertLog[]): SecurityCamera[] {
  const ids = new Set(
    alerts.filter(a => a.category === 'security' && a.status === 'pending' && a.cameraId).map(a => a.cameraId!),
  );
  return cameras.filter(c => ids.has(c.id));
}

export function cameraHasAlert(alerts: AlertLog[], cameraId: string): boolean {
  return getAlertsForCamera(alerts, cameraId).length > 0;
}

export type VideoWallLayout = 'grid' | 'focus' | 'alert-priority';

export const VIDEO_WALL_LAYOUTS: { id: VideoWallLayout; label: string; hint: string }[] = [
  { id: 'grid', label: '均分网格', hint: '6 路画面等比排列' },
  { id: 'focus', label: '主屏放大', hint: '一路主画面 + 副屏切换' },
  { id: 'alert-priority', label: '告警优先', hint: '异常画面自动放大置顶' },
];

export const FOCUS_WIDTH_OPTIONS = [
  { value: 0.6, label: '60%' },
  { value: 0.75, label: '75%' },
  { value: 0.9, label: '90%' },
];

/** AI 检测框演示坐标（相对百分比） */
export const CAMERA_DETECTION_BOXES: Record<
  string,
  { label: string; top: string; left: string; width: string; height: string; kind: AlertLog['securityKind'] }[]
> = {
  'cam-02': [{ label: '闯入者', top: '22%', left: '30%', width: '18%', height: '32%', kind: 'intrusion' }],
  'cam-03': [{ label: '未戴安全帽', top: '35%', left: '45%', width: '14%', height: '28%', kind: 'violation' }],
  'cam-05': [{ label: '烟感波动区', top: '18%', left: '55%', width: '22%', height: '20%', kind: 'fire' }],
};
