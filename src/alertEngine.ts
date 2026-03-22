import { DEFAULT_PGX_PROFILE_ID, getPgxProfileMeta, type PgxProfileId } from "./clearance";

export type ClinicalAlertSeverity = "hard-stop" | "warning" | "info";

export interface ClinicalAlert {
  id: string;
  severity: ClinicalAlertSeverity;
  title: string;
  description: string;
}

export type AllergyProfile = "none" | "low" | "high";

export type PgxProfile = PgxProfileId;
export type GyrAResult = "not-tested" | "wild" | "mutant";

export interface TreatmentInput {
  weightKg: number;
  pregnant: boolean;
  allergy: AllergyProfile;
  pgx: PgxProfile;
  gyrA: GyrAResult;
  zipInput: string;
  residenceState: string;
  dxGono: boolean;
  dxChlam: boolean;
  dxSyph: boolean;
  dxTrich: boolean;
  icu: boolean;
  liver: boolean;
  malnourished: boolean;
  ckd: boolean;
  sdohCost: boolean;
  sdohTransport: boolean;
  sdohHousing: boolean;
  sdohFood: boolean;
}

export function generateAlerts(input: TreatmentInput): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (input.allergy === "high" && input.dxGono) {
    alerts.push({
      id: "hard-stop-gonorrhea-severe-allergy",
      severity: "hard-stop",
      title: "Hard stop",
      description:
        "Pharyngeal gonorrhea + severe allergy. No safe alternative. Consult ID.",
    });
  }

  if (input.pgx !== DEFAULT_PGX_PROFILE_ID) {
    const pgxMeta = getPgxProfileMeta(input.pgx);
    alerts.push({
      id: "pgx-advisory",
      severity: "warning",
      title: "PGx advisory",
      description: `${pgxMeta.label} selected. Demo PGxR = ${pgxMeta.pgBaseXr}.`,
    });
  }

  if (input.sdohTransport) {
    alerts.push({
      id: "sdoh-transport",
      severity: "info",
      title: "SDOH transport flag",
      description:
        "Transportation barrier detected. Single-dose DOT recommended.",
    });
  }

  if (input.sdohCost) {
    alerts.push({
      id: "sdoh-cost",
      severity: "info",
      title: "SDOH cost flag",
      description:
        "Medication cost barrier. Consider generic alternatives and patient assistance programs.",
    });
  }

  // Any one of these flags can signal low albumin and altered total/free exposure.
  if (input.icu || input.liver || input.malnourished || input.ckd) {
    alerts.push({
      id: "albumin-risk",
      severity: "warning",
      title: "Albumin warning",
      description:
        "Albumin risk factors present. Hypoalbuminemia may increase free drug fraction while producing sub-therapeutic total levels.",
    });
  }

  if (input.pregnant) {
    alerts.push({
      id: "pregnancy-contraindicated-drugs",
      severity: "warning",
      title: "Pregnancy contraindication",
      description:
        "Pregnancy: doxycycline and fluoroquinolones contraindicated. Verify regimen safety.",
    });
  }

  if (input.gyrA === "mutant") {
    alerts.push({
      id: "gyra-mutant",
      severity: "warning",
      title: "gyrA mutant",
      description:
        "gyrA mutation detected. Ciprofloxacin resistance likely. Dual therapy recommended.",
    });
  }

  return alerts;
}
