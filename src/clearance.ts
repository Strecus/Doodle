/**
 * Population clearance priors (L/hr) — C_population for STI pathways.
 * Ceftriaxone stays mostly intravascular; azithromycin distributes into tissue (high apparent clearance).
 */
export const CPOPULATION_LH = {
  ceftriaxoneGonorrhea: 0.85,
  azithromycinChlamydiaGonorrhea: 35.0,
  doxycyclineChlamydiaSyphilisAlt: 3.5,
} as const;

/** @deprecated Use CPOPULATION_LH */
export const CPOP_LH = CPOPULATION_LH;

/**
 * Covariate multiplier P_G,base^XR in:
 * C_individual = C_population × (W/70)^0.75 × P_G,base^XR
 */
export const DEFAULT_PG_BASE_XR = 1;

/** Ordered keys for Host PGx profile UI. */
export const PGX_PROFILE_IDS = [
  "john-mayer",
  "lady-gaga",
  "troye-sivan",
  "muna",
] as const;

export type PgxProfileId = (typeof PGX_PROFILE_IDS)[number];

/** Maps Host PGx profile → display label and P_G,base^XR multiplier (demo priors). */
export const PGX_PROFILE_PG_BASE_XR: Record<
  PgxProfileId,
  { label: string; pgBaseXr: number }
> = {
  "john-mayer": {
    label: "John Mayer",
    pgBaseXr: 0.91,
  },
  "lady-gaga": {
    label: "Lady Gaga",
    pgBaseXr: 0.35,
  },
  "troye-sivan": {
    label: "Troye Sivan",
    pgBaseXr: 0.96,
  },
  muna: {
    label: "MUNA",
    pgBaseXr: 1.04,
  },
};

export const DEFAULT_PGX_PROFILE_ID: PgxProfileId = "john-mayer";

export function getPgxProfileMeta(id: PgxProfileId) {
  return PGX_PROFILE_PG_BASE_XR[id];
}

/**
 * Individual clearance (L/hr):
 * C_individual = C_population × (weightKg / 70)^0.75 × P_G,base^XR × albuminFactor
 *
 * For highly protein-bound drugs such as ceftriaxone, hypoalbuminemia can raise the
 * free fraction and increase apparent clearance of the unbound fraction. The optional
 * albumin risk count approximates that effect at 15% per checked albumin risk flag.
 */
export function clearanceIndividualLh(
  cpopulationLh: number,
  weightKg: number,
  pgBaseXr: number = DEFAULT_PG_BASE_XR,
  albuminRiskCount: number = 0,
): number {
  const albuminFactor = albuminRiskCount > 0 ? 1 + albuminRiskCount * 0.15 : 1;
  return cpopulationLh * (weightKg / 70) ** 0.75 * pgBaseXr * albuminFactor;
}

export function roundClearanceLh(value: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export type ClearanceDrugRow = {
  drug: string;
  indication: string;
  cpopulationLh: number;
  cindividualLh: number;
  albuminAdjusted?: boolean;
};

/** Rows for UI: C_population per agent and C_individual at this weight and P_G,base^XR. */
export function clearanceRowsForPatient(
  weightKg: number,
  pgBaseXr: number = DEFAULT_PG_BASE_XR,
  albuminRiskCount: number = 0,
): ClearanceDrugRow[] {
  const row = (
    drug: string,
    indication: string,
    cpopulationLh: number,
  ): ClearanceDrugRow => ({
    drug,
    indication,
    cpopulationLh,
    cindividualLh: roundClearanceLh(
      clearanceIndividualLh(
        cpopulationLh,
        weightKg,
        pgBaseXr,
        albuminRiskCount,
      ),
    ),
    ...(albuminRiskCount > 0 ? { albuminAdjusted: true } : {}),
  });
  return [
    row("Ceftriaxone", "Gonorrhea", CPOPULATION_LH.ceftriaxoneGonorrhea),
    row(
      "Azithromycin",
      "Chlamydia / gonorrhea co-treatment",
      CPOPULATION_LH.azithromycinChlamydiaGonorrhea,
    ),
    row(
      "Doxycycline",
      "Chlamydia / syphilis (alternative)",
      CPOPULATION_LH.doxycyclineChlamydiaSyphilisAlt,
    ),
  ];
}
