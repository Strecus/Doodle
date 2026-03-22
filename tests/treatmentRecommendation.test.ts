import assert from "node:assert/strict";
import test from "node:test";

import {
  generateRecommendation,
  type TreatmentInput,
} from "../src/treatmentRecommendation.ts";

function createInput(
  overrides: Partial<TreatmentInput> = {},
): TreatmentInput {
  return {
    allergyProfile: "none",
    pgxProfile: "normal",
    weightKg: 78,
    pregnant: false,
    diagnoses: {
      gonorrhea: false,
      chlamydia: false,
      syphilis: false,
      trichomoniasis: false,
    },
    gyrAResult: "not-tested",
    regionalGonorrheaMic90: null,
    ...overrides,
  };
}

test("returns a neutral response when no diagnosis is selected", () => {
  const recommendation = generateRecommendation(createInput());

  assert.equal(recommendation.primaryDrug.name, "No recommendation");
  assert.equal(recommendation.primaryDrug.frequency, "Select at least one diagnosis");
  assert.equal(recommendation.coTreatments.length, 0);
  assert.equal(recommendation.hardStop.active, false);
  assert.deepEqual(recommendation.contextNotes, [
    "No recommendation - select at least one diagnosis.",
  ]);
});

test("hard-stops gonorrhea treatment for high-risk cephalosporin allergy", () => {
  const recommendation = generateRecommendation(
    createInput({
      allergyProfile: "high",
      diagnoses: {
        gonorrhea: true,
        chlamydia: true,
        syphilis: false,
        trichomoniasis: false,
      },
    }),
  );

  assert.equal(recommendation.hardStop.active, true);
  assert.match(
    recommendation.hardStop.reason ?? "",
    /High-risk cephalosporin allergy/,
  );
  assert.equal(recommendation.primaryDrug.name, "No recommendation");
  assert.deepEqual(recommendation.coTreatments, [
    {
      name: "Doxycycline",
      dose: "100 mg",
      route: "PO",
      frequency: "BID x 7 days",
    },
  ]);
});

test("uses pregnancy-safe substitutions and warnings", () => {
  const recommendation = generateRecommendation(
    createInput({
      pregnant: true,
      diagnoses: {
        gonorrhea: false,
        chlamydia: true,
        syphilis: false,
        trichomoniasis: true,
      },
    }),
  );

  assert.deepEqual(recommendation.primaryDrug, {
    name: "Azithromycin",
    dose: "1 g",
    route: "PO",
    frequency: "x 1",
  });
  assert.deepEqual(recommendation.coTreatments, [
    {
      name: "Metronidazole",
      dose: "500 mg",
      route: "PO",
      frequency: "BID x 7 days",
    },
  ]);
  assert.ok(
    recommendation.warnings.includes(
      "Pregnancy noted; avoid doxycycline and fluoroquinolones in this ruleset.",
    ),
  );
});

test("returns gonorrhea-first recommendations with genotype and MIC context", () => {
  const recommendation = generateRecommendation(
    createInput({
      allergyProfile: "low",
      diagnoses: {
        gonorrhea: true,
        chlamydia: false,
        syphilis: false,
        trichomoniasis: false,
      },
      gyrAResult: "wild",
      regionalGonorrheaMic90: 0.125,
    }),
  );

  assert.deepEqual(recommendation.primaryDrug, {
    name: "Ceftriaxone",
    dose: "500 mg",
    route: "IM",
    frequency: "x 1",
  });
  assert.ok(
    recommendation.contextNotes.includes(
      "Low-risk cephalosporin allergy noted - proceed with ceftriaxone and monitor after administration.",
    ),
  );
  assert.ok(
    recommendation.contextNotes.includes(
      "gyrA wild-type detected - ciprofloxacin-eligible if local practice supports genotype-directed therapy.",
    ),
  );
  assert.ok(
    recommendation.contextNotes.includes(
      "Regional gonorrhea MIC90 0.125 ug/mL recorded for local susceptibility context.",
    ),
  );
});

test("adds syphilis and trichomoniasis co-treatment advisories", () => {
  const recommendation = generateRecommendation(
    createInput({
      allergyProfile: "low",
      diagnoses: {
        gonorrhea: false,
        chlamydia: false,
        syphilis: true,
        trichomoniasis: true,
      },
    }),
  );

  assert.deepEqual(recommendation.primaryDrug, {
    name: "Penicillin G benzathine",
    dose: "2.4 million units",
    route: "IM",
    frequency: "x 1",
  });
  assert.deepEqual(recommendation.coTreatments, [
    {
      name: "Metronidazole",
      dose: "2 g",
      route: "PO",
      frequency: "x 1",
    },
  ]);
  assert.ok(
    recommendation.warnings.includes(
      "Allergy risk is present; confirm penicillin allergy history. If penicillin allergy is confirmed, consult ID for desensitization.",
    ),
  );
});
