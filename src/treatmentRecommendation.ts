import {
  type PgxProfileId,
  CPOPULATION_LH,
  getPgxProfileMeta,
} from "./clearance";
import {
  ceftriaxoneGonorrheaDoseMg,
  formatCeftriaxoneDoseMg,
} from "./ceftriaxoneGonorrheaDose";

export type AllergyProfile = "none" | "low" | "high";
export type GyrAResult = "not-tested" | "wild" | "mutant";

export type TreatmentDrug = {
  name: string;
  dose: string;
  route: string;
  frequency: string;
};

export type ConfirmedDiagnoses = {
  gonorrhea: boolean;
  chlamydia: boolean;
  syphilis: boolean;
  trichomoniasis: boolean;
};

export type TreatmentInput = {
  allergyProfile: AllergyProfile;
  pgxProfile: PgxProfileId;
  weightKg: number;
  pregnant: boolean;
  diagnoses: ConfirmedDiagnoses;
  gyrAResult: GyrAResult;
  regionalGonorrheaMic90: number | null;
};

export type TreatmentRecommendation = {
  primaryDrug: TreatmentDrug;
  coTreatments: TreatmentDrug[];
  hardStop: {
    active: boolean;
    reason?: string;
  };
  warnings: string[];
  contextNotes: string[];
};

const NO_RECOMMENDATION: TreatmentDrug = {
  name: "No recommendation",
  dose: "N/A",
  route: "N/A",
  frequency: "Select at least one diagnosis",
};

function createDrug(
  name: string,
  dose: string,
  route: string,
  frequency: string,
): TreatmentDrug {
  return { name, dose, route, frequency };
}

function pushUnique(target: string[], message: string) {
  if (!target.includes(message)) {
    target.push(message);
  }
}

function hasAnyDiagnosis(diagnoses: ConfirmedDiagnoses): boolean {
  return Object.values(diagnoses).some(Boolean);
}

function formatMic90(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(3);
}

export function generateRecommendation(
  input: TreatmentInput,
): TreatmentRecommendation {
  const warnings: string[] = [];
  const contextNotes: string[] = [];
  const regimens: TreatmentDrug[] = [];

  if (!hasAnyDiagnosis(input.diagnoses)) {
    return {
      primaryDrug: NO_RECOMMENDATION,
      coTreatments: [],
      hardStop: { active: false },
      warnings: [],
      contextNotes: ["No recommendation - select at least one diagnosis."],
    };
  }

  if (input.pgxProfile !== "normal" && input.pgxProfile !== "unknown") {
    pushUnique(
      contextNotes,
      `PGx profile ${input.pgxProfile} recorded; no guideline-driven regimen change is applied here.`,
    );
  }

  if (input.pregnant) {
    pushUnique(
      warnings,
      "Pregnancy noted; avoid doxycycline and fluoroquinolones in this ruleset.",
    );
    pushUnique(
      contextNotes,
      "Pregnancy noted - prefer azithromycin for chlamydia treatment.",
    );
  }

  let hardStopReason: string | undefined;

  if (input.diagnoses.gonorrhea) {
    if (input.allergyProfile === "high") {
      hardStopReason =
        "High-risk cephalosporin allergy with gonorrhea selected. Consult infectious diseases before treatment.";
      pushUnique(
        warnings,
        "High-risk cephalosporin allergy precludes standard ceftriaxone treatment.",
      );
    } else {
      const pgxr = getPgxProfileMeta(input.pgxProfile).pgBaseXr;
      const ceftriaxoneDose = formatCeftriaxoneDoseMg(
        ceftriaxoneGonorrheaDoseMg({
          weightKg: input.weightKg,
          pgBaseXr: pgxr,
          regionalGonorrheaMic90: input.regionalGonorrheaMic90,
        }),
      );
      regimens.push(createDrug("Ceftriaxone", ceftriaxoneDose, "IM", "x 1"));
      pushUnique(
        contextNotes,
        `Ceftriaxone dose (demo): C_pop (${CPOPULATION_LH.ceftriaxoneGonorrhea} L/h) × (W/70)^0.75 × PGxR (${pgxr}) × regional MIC factor, anchored to 500 mg at 70 kg / PGxR 1 / baseline MIC.`,
      );

      if (input.allergyProfile === "low") {
        pushUnique(
          contextNotes,
          "Low-risk cephalosporin allergy noted - proceed with ceftriaxone and monitor after administration.",
        );
      }
    }

    if (input.gyrAResult === "wild") {
      pushUnique(
        contextNotes,
        input.pregnant
          ? "gyrA wild-type detected, but pregnancy keeps ciprofloxacin off the table."
          : "gyrA wild-type detected - ciprofloxacin-eligible if local practice supports genotype-directed therapy.",
      );
    }

    if (input.gyrAResult === "mutant") {
      pushUnique(
        warnings,
        "gyrA mutant detected - dual therapy planning is needed and fluoroquinolones should be avoided.",
      );
    }

    if (input.regionalGonorrheaMic90 !== null) {
      pushUnique(
        contextNotes,
        `Regional gonorrhea MIC90 ${formatMic90(input.regionalGonorrheaMic90)} ug/mL recorded for local susceptibility context.`,
      );
    }
  }

  // Keep one stable headline regimen for the UI while preserving all
  // concurrently indicated treatments in coTreatments.
  if (input.diagnoses.syphilis) {
    regimens.push(createDrug("Penicillin G benzathine", "2.4 million units", "IM", "x 1"));

    if (input.allergyProfile !== "none") {
      pushUnique(
        warnings,
        "Allergy risk is present; confirm penicillin allergy history. If penicillin allergy is confirmed, consult ID for desensitization.",
      );
    }
  }

  if (input.diagnoses.chlamydia) {
    regimens.push(
      input.pregnant
        ? createDrug("Azithromycin", "1 g", "PO", "x 1")
        : createDrug("Doxycycline", "100 mg", "PO", "BID x 7 days"),
    );

    if (input.pregnant) {
      pushUnique(
        contextNotes,
        "Pregnancy noted - avoid doxycycline for chlamydia co-treatment.",
      );
    }
  }

  if (input.diagnoses.trichomoniasis) {
    regimens.push(
      input.pregnant
        ? createDrug("Metronidazole", "500 mg", "PO", "BID x 7 days")
        : createDrug("Metronidazole", "2 g", "PO", "x 1"),
    );
  }

  if (hardStopReason) {
    return {
      primaryDrug: {
        ...NO_RECOMMENDATION,
        frequency: "Consult infectious diseases",
      },
      coTreatments: regimens,
      hardStop: {
        active: true,
        reason: hardStopReason,
      },
      warnings,
      contextNotes,
    };
  }

  const [primaryDrug = NO_RECOMMENDATION, ...coTreatments] = regimens;

  return {
    primaryDrug,
    coTreatments,
    hardStop: { active: false },
    warnings,
    contextNotes,
  };
}
