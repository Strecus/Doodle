export type LiteracyLevel = "Low" | "Medium" | "High";

export type AdherenceRiskTier = "LOW" | "MODERATE" | "HIGH";

export interface PatientSdoh {
  medicationCost: boolean;
  transportation: boolean;
  housing: boolean;
  uninsured: boolean;
  foodInsecurity: boolean;
}

export interface AdherencePatient {
  age: number;
  literacyLevel: LiteracyLevel;
  priorNonAdherence: boolean;
  /**
   * CDC/ATSDR Social Vulnerability Index — overall percentile for the patient’s
   * area (tract or county, 0–100). Higher = more vulnerable; see ATSDR SVI docs.
   */
  sviOverallPercentile: number;
  sdoh: PatientSdoh;
}

export interface AdherenceRegimen {
  isMultiDay: boolean;
  isBID: boolean;
  numMedications: number;
}

export interface AdherenceRiskResult {
  totalScore: number;
  riskTier: AdherenceRiskTier;
  activeInterventions: string[];
}

/**
 * Maps overall SVI percentile (0–100) to points added to the adherence risk score (0–5).
 * Linear scale: higher community vulnerability → higher support tier pressure.
 */
export function adherencePointsFromSviPercentile(percentile: number): number {
  const p = Math.max(0, Math.min(100, percentile));
  return Math.round((p / 100) * 5);
}

/** Estimates probability of finishing treatment from regimen complexity, demographics, and SDOH flags. */
export function calculateAdherenceRiskScore(
  patient: AdherencePatient,
  regimen: AdherenceRegimen,
): AdherenceRiskResult {
  let score = 0;
  const interventions: string[] = [];

  if (regimen.isMultiDay) score += 2;
  if (regimen.isBID) score += 1;
  if (regimen.numMedications > 1) score += 1;

  if (patient.age < 25) score += 2;
  if (patient.literacyLevel === "Low") score += 2;
  if (patient.priorNonAdherence) score += 3;

  const sviPoints = adherencePointsFromSviPercentile(
    patient.sviOverallPercentile,
  );
  if (sviPoints > 0) {
    score += sviPoints;
    if (sviPoints >= 3) {
      interventions.push(
        "CDC SVI (area): Higher tract/county social vulnerability — align adherence plan with SVI themes (socioeconomic, disability, minority/language, housing/transport) and stronger navigation.",
      );
    } else if (sviPoints >= 1) {
      interventions.push(
        "CDC SVI (area): Moderate community vulnerability percentile — confirm local resources and simplify access where possible.",
      );
    }
  }

  if (patient.sdoh.medicationCost) {
    score += 2;
    interventions.push(
      "Medication Cost: Display generic alternatives; link to patient assistance programs.",
    );
  }
  if (patient.sdoh.transportation) {
    score += 2;
    interventions.push(
      "Transportation: Prefer single-dose DOT; generate Expedited Partner Therapy (EPT) prescription.",
    );
  }
  if (patient.sdoh.housing) {
    score += 2;
    interventions.push(
      "Housing: Flag high loss-to-follow-up risk; use phone-based test-of-cure reminders.",
    );
  }
  if (patient.sdoh.uninsured) {
    score += 1;
    interventions.push(
      "Uninsured: Link to 340B pharmacy programs; flag free local STI clinics.",
    );
  }
  if (patient.sdoh.foodInsecurity) {
    score += 1;
    interventions.push(
      "Food Insecurity: Flag if prescribing medications requiring food (e.g., metronidazole).",
    );
  }

  let riskTier: AdherenceRiskTier = "LOW";
  if (score >= 8) riskTier = "HIGH";
  else if (score >= 4) riskTier = "MODERATE";

  if (riskTier === "LOW") {
    interventions.unshift(
      "Action: Standard handout + 3-month retest reminder via SMS/email.",
    );
  } else if (riskTier === "MODERATE") {
    interventions.unshift(
      "Action: SMS pill reminders (Day 1-7) + visual pill calendar + pharmacist counseling flag.",
    );
  } else {
    interventions.unshift(
      "Action: Prompt to consider single-dose DOT alternative + social work referral + auto-scheduled test-of-cure.",
    );
  }

  return {
    totalScore: score,
    riskTier,
    activeInterventions: interventions,
  };
}
