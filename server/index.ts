/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 生产/预览：Express 静态资源 + 飞书转发 API
 * 开发：由 vite.config 内插件挂载同一路由
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { forwardFeishuMessage, validateFeishuPayload } from './feishu-upstream.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';

export function createFeishuRouter() {
  const router = express.Router();
  router.use(express.json({ limit: '512kb' }));

  router.post('/send-message', async (req, res) => {
    try {
      const payload = validateFeishuPayload(req.body);
      const result = await forwardFeishuMessage(payload);
      res.status(result.status).json(result.body ?? { ok: result.ok });
    } catch (err) {
      const message = err instanceof Error ? err.message : '飞书推送失败';
      const status = message.includes('不能为空') || message.includes('必须为') ? 400 : 502;
      res.status(status).json({ ok: false, message });
    }
  });

  return router;
}

export function createApp() {
  const app = express();
  app.use('/api/feishu', createFeishuRouter());

  const distDir = path.resolve(__dirname, '../dist');
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });

  return app;
}

const isDirectRun = process.argv[1]?.endsWith('server/index.ts') || process.argv[1]?.endsWith('server\\index.ts');
if (isDirectRun) {
  createApp().listen(PORT, HOST, () => {
    console.log(`[server] http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log('[server] POST /api/feishu/send-message → fe-connect');
  });
}
