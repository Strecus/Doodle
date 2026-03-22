import stiData from "./data/sti-regional-mic-data.json";
import zipToStateDemo from "./data/zip-to-state-demo.json";

export type MicBin = { mic: number; probability: number };

export type SurveillanceRegion = keyof typeof stiData.regional_mic_archetypes;

export type UsStateCode = keyof typeof stiData.state_routing_map;

const zipLookup = zipToStateDemo as Record<string, string>;

/** Count of demo ZIP codes (for UI copy). */
export const DEMO_ZIP_LOOKUP_COUNT = Object.keys(zipLookup).length;

/**
 * MIC₉₀: smallest MIC whose cumulative regional probability ≥ 90%.
 * Expects bins sorted weakest → strongest (sorted defensively).
 */
export function calculateMIC90(regionalMicArray: MicBin[]): number {
  const sorted = [...regionalMicArray].sort((a, b) => a.mic - b.mic);
  let cumulativeProbability = 0;
  for (let i = 0; i < sorted.length; i++) {
    cumulativeProbability += sorted[i].probability;
    if (cumulativeProbability >= 0.9) {
      return sorted[i].mic;
    }
  }
  return sorted[sorted.length - 1]!.mic;
}

export function getRegionForState(state: string): SurveillanceRegion | null {
  const r = stiData.state_routing_map[state as UsStateCode];
  return (r as SurveillanceRegion) ?? null;
}

export function getGonorrheaMicDistribution(region: SurveillanceRegion): MicBin[] {
  return stiData.regional_mic_archetypes[region].gonorrhea_mic_distribution;
}

/** Normalize to 5-digit string or null. */
export function normalizeZip5(raw: string): string | null {
  const d = raw.replace(/\D/g, "").slice(0, 5);
  return d.length === 5 ? d : null;
}

/** Demo: resolve state from ZIP; production replaces with full ZIP DB / geocode. */
export function resolveStateFromZipDemo(zipRaw: string): UsStateCode | null {
  const z = normalizeZip5(zipRaw);
  if (!z) return null;
  const st = zipLookup[z];
  if (!st || st.startsWith("_")) return null;
  if (st in stiData.state_routing_map) return st as UsStateCode;
  return null;
}

export const US_STATE_CODES = Object.keys(stiData.state_routing_map).sort() as UsStateCode[];

export function surveillanceMetadata() {
  return stiData.metadata;
}
