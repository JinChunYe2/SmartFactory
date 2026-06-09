/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FEISHU_API_URL?: string;
  readonly VITE_FEISHU_TARGET_TYPE?: string;
  readonly VITE_FEISHU_TARGET_NAME?: string;
  readonly VITE_FACTORY_BASE_URL?: string;
  readonly VITE_MAINTENANCE_HOTLINE?: string;
  readonly VITE_ALERT_RESPONSIBLE_ROLES?: string;
  readonly VITE_PLATFORM_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
