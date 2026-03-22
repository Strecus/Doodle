/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Sent as Authorization: Bearer … or X-API-Key (see VITE_OPENAPI_AUTH_STYLE). */
  readonly VITE_OPENAPI_API_KEY?: string;
  /** GET URL; use literal `{zip}` where the 5-digit ZIP should go. */
  readonly VITE_GEOCODE_ZIP_URL?: string;
  /** `bearer` (default) or `x-api-key` */
  readonly VITE_OPENAPI_AUTH_STYLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
