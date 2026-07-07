/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Deployed checkin Worker URL (see /worker). Set in a local `.env` or the
   * build environment. When unset, the shared community heatmap is disabled
   * and the timer works unchanged.
   */
  readonly VITE_CHECKIN_WORKER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
