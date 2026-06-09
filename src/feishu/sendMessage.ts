/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { feishuConfig } from '../config/feishu';
import { AlertLog, Device, WorkOrder } from '../types';
import { buildFeishuAlertMessage, FeishuAlertContext } from './buildAlertMessage';
import { resolveDeviceForAlert } from './resolveAlertDevice';

export interface SendFeishuMessageOptions {
  message: string;
  targetType?: typeof feishuConfig.targetType;
  targetName?: string;
}

export interface SendFeishuResult {
  ok: boolean;
  status: number;
  body: unknown;
}

/** 调用 fe-connect 发送飞书消息 */
export async function sendFeishuMessage(options: SendFeishuMessageOptions): Promise<SendFeishuResult> {
  const payload = {
    target_type: options.targetType ?? feishuConfig.targetType,
    target_name: options.targetName ?? feishuConfig.targetName,
    message: options.message,
  };

  const res = await fetch(feishuConfig.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let body: unknown = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const errMsg =
      typeof body === 'object' && body && 'message' in body
        ? String((body as { message: string }).message)
        : `HTTP ${res.status}`;
    throw new Error(errMsg);
  }

  return { ok: res.ok, status: res.status, body };
}

/** 根据告警与设备上下文构建并推送飞书消息 */
export async function pushFeishuAlert(ctx: FeishuAlertContext): Promise<SendFeishuResult> {
  const message = buildFeishuAlertMessage(ctx);
  const targetName = ctx.assignee?.trim() || feishuConfig.targetName;
  return sendFeishuMessage({ message, targetName });
}

/** 从告警列表解析设备并推送 */
export async function pushFeishuAlertByLog(
  alert: AlertLog,
  devices: Device[],
  overrides?: Partial<FeishuAlertContext>,
): Promise<SendFeishuResult> {
  const device = overrides?.device ?? resolveDeviceForAlert(alert, devices);
  if (!device) {
    throw new Error('无法关联到具体设备，请为告警配置 deviceCode');
  }
  return pushFeishuAlert({
    device,
    alert,
    allDevices: devices,
    ...overrides,
  });
}

/** 下发抢修工单时：担当人/接手人 → 飞书 target_name */
export async function pushFeishuWorkOrder(
  workOrder: WorkOrder,
  device: Device,
  devices: Device[],
): Promise<SendFeishuResult> {
  const assignee = workOrder.assignee.trim();
  if (!assignee) {
    throw new Error('请填写担当人/接手人（飞书接收人）');
  }

  const alert: AlertLog = {
    id: workOrder.id,
    level: workOrder.type === '紧急抢修' ? 'P1严重' : 'P2高危',
    category: 'operations',
    title: workOrder.title,
    description: workOrder.description,
    location: device.area,
    time: workOrder.createdAt,
    status: 'pending',
    deviceCode: workOrder.deviceCode,
  };

  return pushFeishuAlert({
    device,
    alert,
    allDevices: devices,
    assignee,
  });
}
