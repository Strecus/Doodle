import stiData from "./data/sti-regional-mic-data.json";

export type MicBin = { mic: number; probability: number };

export type SurveillanceRegion = keyof typeof stiData.regional_mic_archetypes;

export type UsStateCode = keyof typeof stiData.state_routing_map;

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

export const US_STATE_CODES = Object.keys(stiData.state_routing_map).sort() as UsStateCode[];

export function surveillanceMetadata() {
  return stiData.metadata;
}
