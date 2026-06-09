/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertLog, Device } from '../types';

const CODE_IN_TEXT = /\b([A-Z]{2,4}-\d{3})\b/;

/** 从告警关联字段或标题/描述中解析设备 */
export function resolveDeviceForAlert(alert: AlertLog, devices: Device[]): Device | undefined {
  if (alert.deviceCode) {
    return devices.find(d => d.code === alert.deviceCode);
  }
  const haystack = `${alert.title} ${alert.description} ${alert.location}`;
  const match = haystack.match(CODE_IN_TEXT);
  if (match) {
    return devices.find(d => d.code === match[1]);
  }
  if (haystack.includes('成缆') || haystack.includes('#03')) {
    return devices.find(d => d.code === 'CLJ-003');
  }
  if (haystack.includes('收线') || haystack.includes('#02')) {
    return devices.find(d => d.code === 'SXJ-002');
  }
  if (haystack.includes('拉丝') || haystack.includes('#01')) {
    return devices.find(d => d.code === 'LSJ-001');
  }
  return devices.find(d => alert.location.includes(d.area.split(' ')[0]));
}
