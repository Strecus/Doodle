import { CPOPULATION_LH } from "./clearance";

/** Anchors the model so a 70 kg patient with PGxR = 1 and neutral regional data matches standard 500 mg IM. */
const REFERENCE_DOSE_MG = 500;
const REFERENCE_WEIGHT_KG = 70;

/**
 * Regional factor from MIC₉₀ (µg/mL). Unknown or invalid → 1.
 * Log-damped vs linear MIC/ref so routine surveillance stays near guideline-scale (~500 mg IM),
 * not multi-fold inflation from raw MIC ratios.
 */
const REFERENCE_MIC90_UG_PER_ML = 0.015;
/** Max log₂(MIC/ref) contributing to the bump (dims very high MIC). */
const REGIONAL_LOG2_CAP = 2;
/** How much each log₂ step above ref nudges the multiplier. */
const REGIONAL_LOG_COEFF = 0.065;
/** Hard cap on regional multiplier so “normal” cases stay near 500 mg anchor. */
const REGIONAL_MULT_MAX = 1.15;

export function regionalGonorrheaDoseMultiplier(mic90: number | null): number {
  if (mic90 == null || !Number.isFinite(mic90) || mic90 <= 0) return 1;
  const raw = mic90 / REFERENCE_MIC90_UG_PER_ML;
  if (raw <= 1) return 1;
  const bump = Math.min(Math.log2(raw), REGIONAL_LOG2_CAP) * REGIONAL_LOG_COEFF;
  return Math.min(1 + bump, REGIONAL_MULT_MAX);
}

/**
 * Demo IM ceftriaxone dose (mg) for gonorrhea:
 *   (C_pop × (W/70)^0.75 × PGxR) scaled to regional MIC context, anchored at 500 mg
 *   for W=70 kg, PGxR=1, regional factor=1.
 */
export function ceftriaxoneGonorrheaDoseMg(input: {
  weightKg: number;
  pgBaseXr: number;
  regionalGonorrheaMic90: number | null;
}): number {
  const cpop = CPOPULATION_LH.ceftriaxoneGonorrhea;
  const w = Math.max(40, input.weightKg);
  const pgxr = input.pgBaseXr > 0 && Number.isFinite(input.pgBaseXr) ? input.pgBaseXr : 1;
  const regional = regionalGonorrheaDoseMultiplier(input.regionalGonorrheaMic90);
  const patientCore = cpop * (w / REFERENCE_WEIGHT_KG) ** 0.75 * pgxr;
  const referenceCore = cpop * (REFERENCE_WEIGHT_KG / REFERENCE_WEIGHT_KG) ** 0.75 * 1;
  return (REFERENCE_DOSE_MG / referenceCore) * patientCore * regional;
}

export function formatCeftriaxoneDoseMg(doseMg: number): string {
  const rounded = Math.round(doseMg / 25) * 25;
  return `${rounded} mg`;
}
