import stiData from "./data/sti-regional-mic-data.json";
import type { UsStateCode } from "./mic90";

type AuthStyle = "bearer" | "x-api-key";

function getEnvString(name: keyof ImportMetaEnv): string | undefined {
  const v = import.meta.env[name];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/** True when ZIP geocoding should call your OpenAPI-backed HTTP endpoint. */
export function isOpenApiGeocodeConfigured(): boolean {
  return Boolean(
    getEnvString("VITE_OPENAPI_API_KEY") &&
      getEnvString("VITE_GEOCODE_ZIP_URL"),
  );
}

function normalizeStateCode(raw: unknown): UsStateCode | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  if (code.length !== 2) return null;
  if (code in stiData.state_routing_map) return code as UsStateCode;
  return null;
}

/** Pull a 2-letter state from common OpenAPI / geocoder JSON shapes. */
export function parseStateFromGeocodeResponse(data: unknown): UsStateCode | null {
  if (data == null) return null;
  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const key of ["state", "stateCode", "state_code", "State", "region"]) {
      const s = normalizeStateCode(o[key]);
      if (s) return s;
    }
    const addr = o.address;
    if (addr && typeof addr === "object") {
      const a = addr as Record<string, unknown>;
      for (const key of ["state", "state_code", "State"]) {
        const s = normalizeStateCode(a[key]);
        if (s) return s;
      }
    }
    const result = o.results;
    if (Array.isArray(result) && result[0] && typeof result[0] === "object") {
      return parseStateFromGeocodeResponse(result[0]);
    }
  }
  return null;
}

function buildAuthHeaders(
  apiKey: string,
  style: AuthStyle,
): Record<string, string> {
  if (style === "x-api-key") return { "X-API-Key": apiKey };
  return { Authorization: `Bearer ${apiKey}` };
}

/**
 * GET {VITE_GEOCODE_ZIP_URL} with `{zip}` replaced by the 5-digit ZIP.
 * Sends your OpenAPI key as Bearer or X-API-Key (see VITE_OPENAPI_AUTH_STYLE).
 */
export async function resolveStateFromZipOpenApi(
  zip5: string,
): Promise<UsStateCode | null> {
  const apiKey = getEnvString("VITE_OPENAPI_API_KEY");
  const template = getEnvString("VITE_GEOCODE_ZIP_URL");
  if (!apiKey || !template) return null;

  const url = template.includes("{zip}")
    ? template.replaceAll("{zip}", zip5)
    : `${template.replace(/\/?$/, "/")}${zip5}`;

  const style = (getEnvString("VITE_OPENAPI_AUTH_STYLE") ?? "bearer").toLowerCase();
  const authStyle: AuthStyle = style === "x-api-key" ? "x-api-key" : "bearer";

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...buildAuthHeaders(apiKey, authStyle),
    },
  });

  if (!res.ok) return null;
  const data: unknown = await res.json();
  return parseStateFromGeocodeResponse(data);
}
