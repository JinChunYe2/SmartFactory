/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Plugin } from 'vite';
import { forwardFeishuMessage, validateFeishuPayload } from './server/feishu-upstream';

/** 开发环境：在 Vite 内挂载与生产一致的飞书转发 API */
export function feishuApiPlugin(): Plugin {
  return {
    name: 'feishu-api',
    configureServer(server) {
      server.middlewares.use('/api/feishu/send-message', (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const raw = Buffer.concat(chunks).toString('utf8');
            const json = raw ? JSON.parse(raw) : null;
            const payload = validateFeishuPayload(json);
            const result = await forwardFeishuMessage(payload);
            res.statusCode = result.status;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(result.body ?? { ok: result.ok }));
          } catch (err) {
            const message = err instanceof Error ? err.message : '飞书推送失败';
            const status = message.includes('不能为空') || message.includes('必须为') ? 400 : 502;
            res.statusCode = status;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, message }));
          }
        });
        req.on('error', () => {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, message: '读取请求体失败' }));
        });
      });
    },
  };
}
