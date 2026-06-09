/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** 飞书 fe-connect 推送配置（可通过 .env 覆盖） */
export const feishuConfig = {
  /** 本应用 BFF 接口（开发/生产统一走 /api/feishu/send-message） */
  apiUrl: import.meta.env.VITE_FEISHU_API_URL ?? '/api/feishu/send-message',
  targetType: (import.meta.env.VITE_FEISHU_TARGET_TYPE ?? 'person') as 'person' | 'group',
  targetName: import.meta.env.VITE_FEISHU_TARGET_NAME ?? '靳春野',
  /** 未指定 assignee 时的默认飞书接收人（告警中枢「推送飞书」等场景） */
  /** 数字孪生平台外链根地址（设备定位 / 趋势图） */
  factoryBaseUrl: import.meta.env.VITE_FACTORY_BASE_URL ?? 'https://smart-factory.example.com',
  maintenanceHotline: import.meta.env.VITE_MAINTENANCE_HOTLINE ?? '8802',
  responsibleRoles: import.meta.env.VITE_ALERT_RESPONSIBLE_ROLES ?? '产线班长 / 设备工程师',
  platformName: import.meta.env.VITE_PLATFORM_NAME ?? '智慧工厂数据接入平台 · 自动推送',
} as const;
