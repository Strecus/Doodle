/** Anatomic sites for gonorrhea (multi-select). */
export type GonorrheaSiteId = "urogenital" | "rectal" | "pharyngeal";

export type GonorrheaSites = {
  urogenital: boolean;
  rectal: boolean;
  pharyngeal: boolean;
};

export const EMPTY_GONORRHEA_SITES: GonorrheaSites = {
  urogenital: false,
  rectal: false,
  pharyngeal: false,
};

export const GONORRHEA_SITE_META: Record<
  GonorrheaSiteId,
  { label: string; shortLabel: string }
> = {
  urogenital: {
    label: "Urogenital (vaginal / cervical / urethral)",
    shortLabel: "Urogenital",
  },
  rectal: {
    label: "Rectal (anal)",
    shortLabel: "Rectal",
  },
  pharyngeal: {
    label: "Pharyngeal (throat)",
    shortLabel: "Pharyngeal",
  },
};

export function hasAnyGonorrheaSite(s: GonorrheaSites): boolean {
  return s.urogenital || s.rectal || s.pharyngeal;
}

/** One-line for context chips / headers. */
export function formatGonorrheaSitesSummary(s: GonorrheaSites): string {
  if (!hasAnyGonorrheaSite(s)) return "Gonorrhea — site not specified";
  const parts = (Object.keys(GONORRHEA_SITE_META) as GonorrheaSiteId[])
    .filter((id) => s[id])
    .map((id) => GONORRHEA_SITE_META[id].shortLabel);
  return `Gonorrhea: ${parts.join(", ")}`;
}

/** Lowercase list for inline sentences (e.g. PDF intro). */
export function formatGonorrheaSitesInline(s: GonorrheaSites): string {
  if (!hasAnyGonorrheaSite(s)) return "anatomic site not specified";
  return (["urogenital", "rectal", "pharyngeal"] as const)
    .filter((id) => s[id])
    .map((id) => GONORRHEA_SITE_META[id].shortLabel.toLowerCase())
    .join(", ");
}

/** Counseling bullets for in-app patient education card. */
export function gonorrheaSiteEducationBullets(s: GonorrheaSites): string[] {
  if (!hasAnyGonorrheaSite(s)) {
    return [
      "Select anatomic sites above (urogenital, rectal, and/or pharyngeal) so education, testing reminders, and handouts match where infection may be.",
      "Many guidelines recommend testing each site that had sexual exposure—urine alone can miss rectal or throat gonorrhea.",
    ];
  }
  const out: string[] = [];
  if (s.urogenital) {
    out.push(
      "Urogenital gonorrhea: urine or genital swab testing is typical. Watch for burning with urination, discharge, or pelvic pain—even mild symptoms deserve follow-up.",
    );
  }
  if (s.rectal) {
    out.push(
      "Rectal gonorrhea: ask for a rectal NAAT swab if you had receptive anal sex; symptoms may be absent or include anal discharge, pain, or bleeding.",
    );
  }
  if (s.pharyngeal) {
    out.push(
      "Pharyngeal (throat) gonorrhea: throat swab testing matters after oral sex; infection is often silent. Severe beta-lactam allergy with throat involvement needs special planning—your clinician may involve ID.",
    );
  }
  if (out.length > 1) {
    out.push(
      "Multiple sites can be infected at once. Partners may need testing at matching sites based on the sex you have together.",
    );
  }
  return out;
}

/** Extra paragraph for patient PDF gonorrhea section. */
export function gonorrheaSitesPatientPdfAddendum(s: GonorrheaSites): string {
  if (!hasAnyGonorrheaSite(s)) {
    return "Anatomic site was not marked on the form. Tell your clinician every place you had symptoms or sexual exposure so the correct swabs or urine tests are collected.";
  }
  const bits: string[] = [];
  if (s.urogenital) {
    bits.push(
      "Urogenital: complete urine or genital testing as directed; finish all treatment even if discharge stops.",
    );
  }
  if (s.rectal) {
    bits.push(
      "Rectal: rectal swab NAAT is often required in addition to urine—do not skip it if you had anal sex.",
    );
  }
  if (s.pharyngeal) {
    bits.push(
      "Throat: pharyngeal testing may be needed; avoid performing oral sex until your clinician clears you after therapy.",
    );
  }
  return bits.join(" ");
}

/** Tailor partner/EPT gonorrhea strings by site. */
export function gonorrheaPartnerPdfSiteLayer(s: GonorrheaSites): {
  symptomsExtra: string;
  whereExtra: string;
  timelineExtra: string;
} {
  if (!hasAnyGonorrheaSite(s)) {
    return {
      symptomsExtra:
        " Partners should disclose all exposure sites so clinics order throat, rectal, and urine/genital tests as appropriate.",
      whereExtra:
        " Without knowing the sites, providers may under-test—encourage partners to report oral, anal, and genital exposures honestly.",
      timelineExtra:
        " Testing windows can differ slightly by site; follow the clinic's retest dates for each specimen type collected.",
    };
  }
  const sym: string[] = [];
  const wh: string[] = [];
  const tl: string[] = [];
  if (s.urogenital) {
    sym.push("Urogenital: discharge, dysuria, pelvic pain.");
    wh.push("Urine NAAT and/or genital swabs.");
  }
  if (s.rectal) {
    sym.push("Rectal: often asymptomatic; possible anal discharge or pain.");
    wh.push("Rectal NAAT swab (not replaced by urine alone).");
    tl.push("If rectal infection is treated, avoid receptive anal sex until your clinician's abstinence window ends.");
  }
  if (s.pharyngeal) {
    sym.push("Throat: usually silent; sore throat is possible.");
    wh.push("Pharyngeal swab NAAT.");
    tl.push("Avoid oral sex during treatment and for the no-sex window your clinic gives after therapy.");
  }
  return {
    symptomsExtra: " Site focus for this summary: " + sym.join(" "),
    whereExtra: " Testing emphasis: " + wh.join(" "),
    timelineExtra: " " + tl.join(" "),
  };
}
