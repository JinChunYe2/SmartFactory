/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertLog, CameraZone, DoorLog, SecurityCamera } from './types';

export const CAMERA_ZONE_FILTERS: { id: 'all' | CameraZone; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: '车间', label: '车间' },
  { id: '大门', label: '大门' },
  { id: '危化区', label: '危化区' },
  { id: '成缆区', label: '成缆区' },
];

export const SECURITY_KIND_LABEL: Record<NonNullable<AlertLog['securityKind']>, string> = {
  intrusion: '危险区域闯入',
  violation: '违规作业',
  fire: '消防异常',
};

export function computeSecurityOverview(
  cameras: SecurityCamera[],
  alerts: AlertLog[],
  doorLogs: DoorLog[],
) {
  const online = cameras.filter(c => c.status === 'online').length;
  const pendingSecurity = alerts.filter(a => a.category === 'security' && a.status === 'pending').length;
  const todayInOut = doorLogs.filter(l => l.action === '进入' || l.action === '离开').length + 318;

  return { online, total: cameras.length, pendingSecurity, todayInOut };
}

export function getSecurityAlerts(alerts: AlertLog[]) {
  return alerts.filter(a => a.category === 'security');
}

export function build3dTransform(focus?: { offsetX: number; offsetY: number; scale: number }) {
  if (!focus) {
    return 'perspective(1400px) rotateX(42deg) rotateZ(-12deg) scale(0.9)';
  }
  return `perspective(1400px) rotateX(42deg) rotateZ(-12deg) scale(${focus.scale * 0.9}) translate(${focus.offsetX}px, ${focus.offsetY}px)`;
}

export function getFireTypeLabel(type: 'fire_extinguisher' | 'hydrant' | 'smoke_sensor') {
  if (type === 'hydrant') return '消防栓';
  if (type === 'smoke_sensor') return '烟感探测器';
  return '灭火器';
}
