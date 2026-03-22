export type HealthLiteracyLevel = "adequate" | "marginal" | "low";

export type PreferredLanguageId =
  | "english"
  | "spanish"
  | "mandarin"
  | "french"
  | "tagalog"
  | "vietnamese"
  | "other";

export function preferredLanguageDisplayName(
  id: PreferredLanguageId,
  otherSpecify: string,
): string {
  if (id === "other") {
    const t = otherSpecify.trim();
    return t || "Other (specify)";
  }
  switch (id) {
    case "english":
      return "English";
    case "spanish":
      return "Spanish";
    case "mandarin":
      return "Mandarin Chinese";
    case "french":
      return "French";
    case "tagalog":
      return "Tagalog";
    case "vietnamese":
      return "Vietnamese";
  }
}

export function literacyCounselingPoints(
  level: HealthLiteracyLevel,
): string[] {
  switch (level) {
    case "adequate":
      return [
        "Standard written instructions and routine teach-back are appropriate.",
        "Offer CDC or clinic STI handouts at usual reading level.",
      ];
    case "marginal":
      return [
        "Use short sentences, define terms once in plain language, and avoid acronyms without explanation.",
        "Limit handout length; pair print with verbal review.",
        "Use teach-back on medicine name, dose, timing, and when to seek care.",
      ];
    case "low":
      return [
        "Prioritize spoken instruction, demonstrations, and pictorial aids; avoid dense blocks of text.",
        "Schedule extra time; consider health educator or navigator if available.",
        "Teach-back on every critical step (what to take, when, partner notification, follow-up testing).",
      ];
  }
}

export function languageCounselingPoints(
  id: PreferredLanguageId,
  otherSpecify: string,
): string[] {
  const base = [
    "Chart preferred language and offer matching patient materials when your system stocks them.",
  ];
  if (id === "english") {
    return [
      ...base,
      "Confirm understanding with teach-back; offer low-literacy or translated variants if literacy is marginal or low.",
    ];
  }
  const name = preferredLanguageDisplayName(id, otherSpecify);
  return [
    `Document preferred language: ${name}.`,
    "Use a qualified medical interpreter for consent, results, and medication counseling — not untrained staff or minors.",
    "If translated STI materials are unavailable, use interpreter-assisted teach-back and written English only as a supplement when the patient agrees.",
  ];
}
