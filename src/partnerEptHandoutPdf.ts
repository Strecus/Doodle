import { jsPDF } from "jspdf";
import {
  type GonorrheaSites,
  formatGonorrheaSitesInline,
  gonorrheaPartnerPdfSiteLayer,
} from "./gonorrheaSites";

export type PartnerEptInput = {
  generatedAt: Date;
  dxGono: boolean;
  gonoSites: GonorrheaSites;
  dxChlam: boolean;
  dxSyph: boolean;
  dxTrich: boolean;
  preferredLanguageLabel: string;
};

const MARGIN = 18;
const PAGE_W = 216;
const PAGE_H = 279;
const CONTENT_W = PAGE_W - MARGIN * 2;

const TEAL: [number, number, number] = [13, 148, 136];
const TEAL_LIGHT: [number, number, number] = [224, 242, 241];
const AMBER_LIGHT: [number, number, number] = [254, 243, 199];
const SLATE: [number, number, number] = [51, 65, 85];
const MUTED: [number, number, number] = [100, 116, 139];

function drawWrapped(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineHeight: number,
  fontSize: number,
): number {
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function needNewPage(y: number, space: number): boolean {
  return y + space > PAGE_H - MARGIN;
}

function sectionBar(doc: jsPDF, y: number, title: string): number {
  const h = 8;
  doc.setFillColor(...TEAL_LIGHT);
  doc.roundedRect(MARGIN, y - 5, CONTENT_W, h, 1, 1, "F");
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y - 5, MARGIN, y - 5 + h);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...SLATE);
  doc.text(title, MARGIN + 3, y + 0.5);
  return y + h + 4;
}

function calloutBox(
  doc: jsPDF,
  y: number,
  title: string,
  body: string,
): number {
  const innerX = MARGIN + 4;
  const innerW = CONTENT_W - 8;
  const lh = 4.1;
  doc.setFontSize(9.5);
  const nBody = doc.splitTextToSize(body, innerW).length;
  const boxH = 6 + 5 + nBody * lh + 6;
  if (needNewPage(y, boxH + 6)) {
    doc.addPage();
    y = MARGIN;
  }
  const y0 = y;
  doc.setFillColor(...AMBER_LIGHT);
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(MARGIN, y0 - 1, CONTENT_W, boxH, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(146, 64, 14);
  doc.text(title, innerX, y0 + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...SLATE);
  const yy = drawWrapped(doc, body, innerX, y0 + 9, innerW, lh, 9.5);
  return yy + 6;
}

type StiKey = "gonorrhea" | "chlamydia" | "syphilis" | "trich";

const PARTNER_STI: Record<
  StiKey,
  {
    title: string;
    symptoms: string;
    where: string;
    avoid: string;
    timelineDoDont: string;
    partnerShortTerm: string;
    partnerLongTerm: string;
  }
> = {
  gonorrhea: {
    title: "Gonorrhea (partner angle)",
    symptoms:
      "Often no symptoms. Possible burning with urination; yellow/green discharge from penis or vagina; anal discharge or pain; sore throat after oral sex. Symptoms may start within a few days but can be delayed.",
    where:
      "Infection can live in the urethra, cervix, rectum, and throat depending on the type of sex you had. Testing should match the sites exposed (urine, swabs).",
    avoid:
      "Correct, consistent condoms and dental dams reduce risk but do not eliminate it. Limiting partners, mutual testing before stopping condoms, and prompt treatment after exposure help. There is no vaccine for gonorrhea.",
    timelineDoDont:
      "First days after sex: tests can be falsely negative if bacteria have not multiplied enough—ask when to retest. Do not assume one negative test clears you if exposure was very recent. After treatment: typically no sex for at least 7 days and until partners are treated. Do not share antibiotics; wrong dose or incomplete course drives resistance.",
    partnerShortTerm:
      "Partners should be tested and treated, often with the same antibiotics you received, or through EPT if legal where you live. Single-dose regimens are common for uncomplicated cases; follow the exact prescription. Treat all partners from the time frame your clinic names (often recent weeks).",
    partnerLongTerm:
      "Retest as recommended (e.g., ~3 months if at risk). Watch for pelvic or testicular pain, fever, or pregnancy—seek care urgently if those occur. Untreated gonorrhea can contribute to infertility and arthritis-like complications over time.",
  },
  chlamydia: {
    title: "Chlamydia (partner angle)",
    symptoms:
      "Frequently silent. Possible mild discharge, burning with urination, bleeding after sex, lower belly pain. Throat and rectal infections are often without symptoms.",
    where:
      "Cervix, urethra, rectum, throat. NAAT testing on the right specimen is important; urine alone may miss rectal infection in some people.",
    avoid:
      "Condoms/dams lower risk. Annual or more frequent screening is recommended for many sexually active adults under 25 and others at risk. Treat partners to prevent ping-pong reinfection.",
    timelineDoDont:
      "Testing too early after exposure can miss infection—your clinic will tell you when to test or retest. After antibiotics: usually avoid sex for 7 days after you and partners finish therapy (single-dose rules differ slightly—confirm). Do not use leftover pills from someone else; dosing may be wrong.",
    partnerShortTerm:
      "EPT may provide azithromycin or partners may need doxycycline courses—only what a clinician or pharmacist authorizes. All exposed partners in the lookback window need evaluation or documented therapy.",
    partnerLongTerm:
      "Repeat testing in ~3 months is common after chlamydia because reinfection is frequent. Chronic untreated infection raises risk of pelvic inflammatory disease and tubal infertility—long-term follow your clinic's exam and test schedule.",
  },
  syphilis: {
    title: "Syphilis (partner angle)",
    symptoms:
      "Primary: painless sore (chancre) on genitals, anus, or mouth. Secondary: rash (often palms/soles), swollen glands, fever, hair loss. Latent stages may have no outward signs while the germ remains in the body.",
    where:
      "Spread by direct contact with a sore or rash during sex. Blood tests track infection over months to years; physical exam looks for sores you might not notice.",
    avoid:
      "Condoms reduce risk where they cover sores but sores can be on uncovered skin. Honest disclosure, testing with new partners, and early treatment protect you and others. Pregnant patients need special pathways to protect the baby.",
    timelineDoDont:
      "Sores can appear roughly 10–90 days after exposure (wide range). Do not have sex when any sore or rash is present until a clinician clears you. Partners from the prior months may need blood tests even without symptoms. Do not skip follow-up blood draws—syphilis can relapse or progress silently.",
    partnerShortTerm:
      "Partners are often treated based on exposure and test results; sometimes injection penicillin in clinic, sometimes other regimens if allergic—only clinician-directed. Public health may assist with confidential partner notification.",
    partnerLongTerm:
      "Blood tests continue for up to two years in many protocols to prove cure. Late syphilis can affect heart, brain, and nerves if never treated—early partner treatment prevents this cascade.",
  },
  trich: {
    title: "Trichomoniasis (partner angle)",
    symptoms:
      "Frothy or increased discharge, genital itching, burning with urination or sex, fishy odor. Many carriers, especially men, have no symptoms.",
    where:
      "Vagina, urethra. Diagnosis is often swab or urine NAAT. Both partners should be treated even if one tests negative, per many guidelines, to stop reinfection.",
    avoid:
      "Condoms lower transmission. Treating both partners at once and abstaining until therapy is finished breaks the cycle. Avoid sharing unwashed sex toys.",
    timelineDoDont:
      "Symptoms can appear within days to weeks. After metronidazole or tinidazole: no alcohol during treatment and for 48–72 hours after the last dose (typical warning—read your label). No sex until you and partners complete treatment and symptoms resolve—often ~7 days guidance. Do not stop early when symptoms improve.",
    partnerShortTerm:
      "Single-dose or multi-day oral medication for both partners. Pregnant patients need clinician-specific regimens.",
    partnerLongTerm:
      "If symptoms return, both partners need re-evaluation—reinfection is common. Long-term, routine safer-sex habits and testing with new relationships reduce repeat episodes.",
  },
};

function dxSummary(input: PartnerEptInput): string {
  const parts: string[] = [];
  if (input.dxGono) {
    parts.push(
      `gonorrhea (sites: ${formatGonorrheaSitesInline(input.gonoSites)})`,
    );
  }
  if (input.dxChlam) parts.push("chlamydia");
  if (input.dxSyph) parts.push("syphilis");
  if (input.dxTrich) parts.push("trichomoniasis");
  if (parts.length === 0) return "No single STI was checked in the demo form—the sections below still apply as general partner guidance.";
  return `This visit was tagged in the demo for: ${parts.join(", ")}. Read all sections that apply to your situation.`;
}

export function downloadPartnerEptHandoutPdf(input: PartnerEptInput): void {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  let y = MARGIN;

  doc.setFillColor(...TEAL);
  doc.rect(0, 0, PAGE_W, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("DOODLE", MARGIN, 13);
  doc.setFontSize(12);
  doc.text("Partner notification & EPT guide", MARGIN, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const dateStr = input.generatedAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  doc.text(`Prepared: ${dateStr}`, PAGE_W - MARGIN, 22, { align: "right" });
  doc.text(`Chart language note: ${input.preferredLanguageLabel}`, MARGIN, 30);

  y = 44;
  doc.setTextColor(...SLATE);

  y = sectionBar(doc, y, "Context from this DOODLE session");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = drawWrapped(doc, dxSummary(input), MARGIN, y, CONTENT_W, 4.5, 10);
  y += 6;

  y = sectionBar(doc, y, "What is EPT (expedited partner therapy)?");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = drawWrapped(
    doc,
    "EPT means your sexual partner may receive prescription treatment for certain STIs without their own clinic visit first—where state law and your clinician allow it. Goals: fewer reinfections, faster treatment, and less spread in the community. EPT does not replace a full exam if your partner has pain, fever, pregnancy, or symptoms that need urgent care.",
    MARGIN,
    y,
    CONTENT_W,
    4.6,
    10,
  );
  y += 6;

  y = calloutBox(
    doc,
    y,
    "Risks if partners are not treated",
    "You can get the same infection again right after you finish antibiotics (ping-pong reinfection). Untreated chlamydia and gonorrhea can lead to pelvic inflammatory disease, chronic pain, ectopic pregnancy, and infertility. Syphilis can progress silently and damage the heart, brain, eyes, and nerves. Trich causes discomfort and raises the risk of passing or getting other STIs. Anyone untreated can unknowingly spread infection to new partners.",
  );

  y = sectionBar(doc, y, "Timeline: what you can and cannot do");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const timelineBullets = [
    "0–3 days after sex: Bacterial STI tests are often too early to trust as final—ask your clinic when to test or retest. You can still ask about emergency prevention for HIV (PEP) in a separate pathway if relevant.",
    "Roughly 1–2 weeks: Many gonorrhea/chlamydia tests are more reliable; symptoms may begin. Still follow clinic timing—window periods vary by test and body site.",
    "2 weeks to 3 months: Syphilis blood tests and sores follow their own calendar; a negative test soon after exposure does not always mean you are clear.",
    "Until you and partners finish prescribed therapy: Do not have sex, or follow your clinician's stricter rules. Typical guidance for gonorrhea/chlamydia includes no sex for at least 7 days after treatment and until partners are treated.",
    "After EPT pickup: Partners must take the full dose or full course on schedule. Do not split one person's pills between two people. Check the medication guide for alcohol restrictions (common with trich medicines).",
    "When resuming sex: Condoms/dams, fewer partners, and periodic testing reduce repeat infections. Ask how often you should retest based on your risk.",
  ];
  for (const b of timelineBullets) {
    if (needNewPage(y, 20)) {
      doc.addPage();
      y = MARGIN;
    }
    y = drawWrapped(doc, `• ${b}`, MARGIN, y, CONTENT_W, 4.4, 9.5);
    y += 2;
  }
  y += 4;

  y = sectionBar(doc, y, "Common symptoms & where infections hide");
  y = drawWrapped(
    doc,
    "Below is a partner-focused summary for each STI. Symptoms differ by person; many infections are silent. Testing sites (urine, vaginal/cervical, urethral, rectal, throat swabs) should match how you have sex.",
    MARGIN,
    y,
    CONTENT_W,
    4.4,
    9.5,
  );
  y += 5;

  const keys: StiKey[] = ["gonorrhea", "chlamydia", "syphilis", "trich"];
  for (const key of keys) {
    const block = PARTNER_STI[key];
    const highlight =
      (key === "gonorrhea" && input.dxGono) ||
      (key === "chlamydia" && input.dxChlam) ||
      (key === "syphilis" && input.dxSyph) ||
      (key === "trich" && input.dxTrich);

    const gonoLayer =
      key === "gonorrhea" && input.dxGono
        ? gonorrheaPartnerPdfSiteLayer(input.gonoSites)
        : { symptomsExtra: "", whereExtra: "", timelineExtra: "" };

    const est = highlight ? 72 : 58;
    if (needNewPage(y, est)) {
      doc.addPage();
      y = MARGIN;
    }

    if (highlight) {
      const extraGono =
        key === "gonorrhea" && input.dxGono
          ? ` Anatomic sites recorded: ${formatGonorrheaSitesInline(input.gonoSites)}.`
          : "";
      y = calloutBox(
        doc,
        y,
        "Matches a diagnosis you checked in DOODLE",
        `Pay extra attention to this ${block.title.replace(/\s*\(partner angle\)\s*/i, "")} block—you flagged it on the form.${extraGono} If you selected more than one STI, read each matching section.`,
      );
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...TEAL);
    doc.text(block.title, MARGIN, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...SLATE);
    doc.text("Common symptoms:", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    y = drawWrapped(
      doc,
      block.symptoms + gonoLayer.symptomsExtra,
      MARGIN + 2,
      y,
      CONTENT_W - 2,
      4.2,
      9.5,
    );
    y += 3;

    doc.setFont("helvetica", "bold");
    doc.text("Where it lives / how testing works:", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    y = drawWrapped(
      doc,
      block.where + gonoLayer.whereExtra,
      MARGIN + 2,
      y,
      CONTENT_W - 2,
      4.2,
      9.5,
    );
    y += 3;

    doc.setFont("helvetica", "bold");
    doc.text("How to lower your chances of getting it:", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    y = drawWrapped(doc, block.avoid, MARGIN + 2, y, CONTENT_W - 2, 4.2, 9.5);
    y += 3;

    doc.setFont("helvetica", "bold");
    doc.text("Timeline: do / do not (summary):", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    y = drawWrapped(
      doc,
      block.timelineDoDont + gonoLayer.timelineExtra,
      MARGIN + 2,
      y,
      CONTENT_W - 2,
      4.2,
      9.5,
    );
    y += 3;

    doc.setFont("helvetica", "bold");
    doc.text("If your partner is diagnosed — short-term treatment:", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    y = drawWrapped(
      doc,
      block.partnerShortTerm,
      MARGIN + 2,
      y,
      CONTENT_W - 2,
      4.2,
      9.5,
    );
    y += 3;

    doc.setFont("helvetica", "bold");
    doc.text("Longer-term follow-up:", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    y = drawWrapped(
      doc,
      block.partnerLongTerm,
      MARGIN + 2,
      y,
      CONTENT_W - 2,
      4.2,
      9.5,
    );
    y += 8;
  }

  if (needNewPage(y, 36)) {
    doc.addPage();
    y = MARGIN;
  }
  y = sectionBar(doc, y, "Partner look-back windows (general)");
  y = drawWrapped(
    doc,
    "Clinics often ask about partners from the past 60 days for gonorrhea/chlamydia, longer for syphilis (sometimes 3–12 months depending on stage). Exact rules are set by public health and your provider—use their list, not this handout alone.",
    MARGIN,
    y,
    CONTENT_W,
    4.4,
    9.5,
  );
  y += 8;

  y = calloutBox(
    doc,
    y,
    "Important",
    "This handout is general education from a demo app. Laws on EPT, exact drugs, partner lists, and testing schedules vary by state and clinic. Interpreters, translated materials, and in-person care should be used when English or literacy is a barrier.",
  );

  y += 4;
  if (needNewPage(y, 28)) {
    doc.addPage();
    y = MARGIN;
  }
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  drawWrapped(
    doc,
    "DOODLE — demonstration only. Not medical or legal advice. For emergencies, call your local emergency number.",
    MARGIN,
    y,
    CONTENT_W,
    3.6,
    8,
  );

  const fname = `DOODLE-partner-EPT-handout-${input.generatedAt.toISOString().slice(0, 10)}.pdf`;
  doc.save(fname);
}
