/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** fe-connect 上游地址（服务端转发，避免浏览器 CORS） */
export const FEISHU_UPSTREAM_URL =
  process.env.FEISHU_UPSTREAM_URL ??
  'https://test.sheepwall.com/fe-connect/api/v1/send-message';

export interface FeishuSendPayload {
  target_type: 'person' | 'group';
  target_name: string;
  message: string;
}

export interface FeishuForwardResult {
  ok: boolean;
  status: number;
  body: unknown;
}

export function validateFeishuPayload(body: unknown): FeishuSendPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('请求体不能为空');
  }
  const data = body as Record<string, unknown>;
  const target_type = data.target_type;
  const target_name = data.target_name;
  const message = data.message;

  if (target_type !== 'person' && target_type !== 'group') {
    throw new Error('target_type 必须为 person 或 group');
  }
  if (typeof target_name !== 'string' || !target_name.trim()) {
    throw new Error('target_name 不能为空');
  }
  if (typeof message !== 'string' || !message.trim()) {
    throw new Error('message 不能为空');
  }

  return {
    target_type,
    target_name: target_name.trim(),
    message,
  };
}

/** 服务端转发至 fe-connect */
export async function forwardFeishuMessage(payload: FeishuSendPayload): Promise<FeishuForwardResult> {
  const res = await fetch(FEISHU_UPSTREAM_URL, {
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

  return { ok: res.ok, status: res.status, body };
}
