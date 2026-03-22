import { jsPDF } from "jspdf";
import {
  type GonorrheaSites,
  formatGonorrheaSitesInline,
  gonorrheaSitesPatientPdfAddendum,
} from "./gonorrheaSites";

export type HandoutGyrA = "not-tested" | "wild" | "mutant";

export type PatientHandoutInput = {
  generatedAt: Date;
  hardStop: boolean;
  effectiveGyrA: HandoutGyrA;
  mainLine: string;
  dxGono: boolean;
  gonoSites: GonorrheaSites;
  dxChlam: boolean;
  dxSyph: boolean;
  dxTrich: boolean;
  pregnant: boolean;
  weightKg: number;
  ceftriaxoneCindividualLh: number;
  /** When set, overrides the default "500 mg" ceftriaxone line in the wild-type schedule. */
  ceftriaxoneDoseLabel?: string;
  pgxLabel: string;
  preferredLanguageLabel: string;
};

const MARGIN = 18;
const PAGE_W = 216;
const PAGE_H = 279;
const CONTENT_W = PAGE_W - MARGIN * 2;

const TEAL: [number, number, number] = [13, 148, 136];
const TEAL_LIGHT: [number, number, number] = [224, 242, 241];
const SLATE: [number, number, number] = [51, 65, 85];
const MUTED: [number, number, number] = [100, 116, 139];

function stripForPdf(s: string): string {
  return s
    .replace(/✅/g, "")
    .replace(/×/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

type ScheduleRow = {
  medicine: string;
  dose: string;
  how: string;
  when: string;
};

function buildSchedule(input: PatientHandoutInput): ScheduleRow[] | null {
  if (input.hardStop) return null;
  if (input.effectiveGyrA === "mutant") {
    return [
      {
        medicine: "Ceftriaxone",
        dose: "1 g (1000 mg)",
        how: "Injection into a large muscle (buttock or thigh) by your nurse or clinician.",
        when: "Once, during your clinic visit.",
      },
      {
        medicine: "Azithromycin",
        dose: "1 g total (often four 250 mg tablets)",
        how: "Swallow with water. If your stomach is upset, a small snack is usually fine unless your clinician says otherwise.",
        when: "Same day as the shot, or exactly when your prescription label says.",
      },
    ];
  }
  return [
    {
      medicine: "Ceftriaxone",
      dose: input.ceftriaxoneDoseLabel ?? "500 mg",
      how: "Injection into a large muscle (buttock or thigh) by your nurse or clinician.",
      when: "Once, during your clinic visit.",
    },
  ];
}

const STI_EDU: Record<
  "gonorrhea" | "chlamydia" | "syphilis" | "trich",
  {
    title: string;
    dayToDay: string;
    spread: string;
    /** Abstinence, partners, retesting, condoms—patient-facing. */
    afterTreatment: string;
  }
> = {
  gonorrhea: {
    title: "Gonorrhea",
    dayToDay:
      "Many people have no symptoms. Some notice burning with urination, discharge, or pelvic discomfort. Without treatment it can lead to more serious problems over time.",
    spread:
      "Passed through sexual contact, including oral, anal, and vaginal sex. Using barriers (condoms) lowers risk but does not remove it completely.",
    afterTreatment:
      "Do not have sex (oral, vaginal, or anal) for at least 7 days after you finish your treatment and until your sexual partner(s) have been treated too—otherwise you can get infected again or pass the bacteria back and forth. Your clinic may give you a different number of days; follow their instructions. Use condoms correctly when you resume sex. Return for repeat testing if your clinician recommends it (often in about 3 months for some people at ongoing risk).",
  },
  chlamydia: {
    title: "Chlamydia",
    dayToDay:
      "Often silent. When symptoms appear they may include discharge, burning with urination, or pelvic pain. Treating it helps prevent long-term complications such as fertility issues.",
    spread:
      "Spread through vaginal, anal, or oral sex with someone who has the infection. Regular testing and partner treatment help break the chain.",
    afterTreatment:
      "Avoid all sex for at least 7 days after you and your partner(s) have completed the antibiotics your clinician prescribed (with single-dose medicines, that often means 7 days from treatment day—confirm with your clinic). Do not share or save pills for a partner; partners need their own prescription or visit. When you start having sex again, condoms reduce risk. Get retested as advised, especially if you are under 25 or have a new partner.",
  },
  syphilis: {
    title: "Syphilis",
    dayToDay:
      "Early on you might see a painless sore or rash; later stages can involve the whole body if untreated. Even if symptoms fade, the bacteria can still be there—follow-up blood tests matter.",
    spread:
      "Direct contact with a syphilis sore during sex. It can also pass from a pregnant person to a baby, which is why prenatal care and testing are important.",
    afterTreatment:
      "Avoid any sexual contact—including oral sex—while sores or rashes are present and until your clinician tells you it is safe. Partners from the past several months may need testing and treatment; public health or your clinic can help with partner notification. You will need follow-up blood tests on the schedule your clinician gives you (missing them can let the disease progress silently). After you are cleared to resume activity, condoms still help prevent other STIs.",
  },
  trich: {
    title: "Trichomoniasis (\"trich\")",
    dayToDay:
      "May cause genital itching, burning, odor, or discharge. Some people feel fine but can still carry the parasite.",
    spread:
      "Passed through sexual contact. Sexual partners should be evaluated and treated so you are not passing it back and forth.",
    afterTreatment:
      "Do not have sex until you and your partner(s) have finished treatment and symptoms have gone away—many clinics use about 7 days after treatment as a guide, but follow what your clinician tells you. If you have sex too soon, you can reinfect each other. Avoid alcohol while taking metronidazole or tinidazole if your prescription says so. Condoms help prevent spread once you are cleared to resume sex.",
  },
};

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

function sectionBar(
  doc: jsPDF,
  y: number,
  title: string,
): number {
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

export function downloadPatientHandoutPdf(input: PatientHandoutInput): void {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  let y = MARGIN;

  // Header band
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, PAGE_W, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("DOODLE", MARGIN, 14);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Your treatment summary", MARGIN, 22);
  doc.setFontSize(9);
  const dateStr = input.generatedAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  doc.text(`Prepared: ${dateStr}`, PAGE_W - MARGIN, 22, { align: "right" });
  doc.text(`Preferred language (chart): ${input.preferredLanguageLabel}`, MARGIN, 28);

  y = 40;
  doc.setTextColor(...SLATE);

  // Summary
  y = sectionBar(doc, y, "Your plan in plain language");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const summary = stripForPdf(input.mainLine);
  y = drawWrapped(doc, summary, MARGIN, y, CONTENT_W, 4.8, 10.5);
  y += 5;
  if (input.dxGono) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    y = drawWrapped(
      doc,
      `Gonorrhea anatomic sites recorded: ${formatGonorrheaSitesInline(input.gonoSites)}.`,
      MARGIN,
      y,
      CONTENT_W,
      4.2,
      9,
    );
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE);
    y += 5;
  } else {
    y += 1;
  }

  if (input.pregnant) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...MUTED);
    y = drawWrapped(
      doc,
      "Pregnancy was noted in your visit—your clinician will choose regimens that are appropriate for pregnancy.",
      MARGIN,
      y,
      CONTENT_W,
      4.5,
      9.5,
    );
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE);
    y += 5;
  }

  // Schedule
  y = sectionBar(doc, y, "Medicines and schedule");
  const schedule = buildSchedule(input);
  if (!schedule) {
    y = drawWrapped(
      doc,
      "Because of allergy and diagnosis details in this demo, dosing is not listed here. Your infectious disease or primary team will prescribe the right antibiotics and explain how to take them.",
      MARGIN,
      y,
      CONTENT_W,
      4.8,
      10,
    );
    y += 8;
  } else {
    doc.setTextColor(...SLATE);
    const innerX = MARGIN + 4;
    const innerW = CONTENT_W - 8;
    const lh = 4.1;
    for (const row of schedule) {
      doc.setFontSize(9.5);
      const nDose = doc.splitTextToSize(`Dose: ${row.dose}`, innerW).length;
      const nHow = doc.splitTextToSize(`How: ${row.how}`, innerW).length;
      const nWhen = doc.splitTextToSize(`When: ${row.when}`, innerW).length;
      const boxH = 5 + 6 + (nDose + nHow + nWhen) * lh + 6;
      if (needNewPage(y, boxH + 4)) {
        doc.addPage();
        y = MARGIN;
      }
      const y0 = y;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(MARGIN, y0 - 1, CONTENT_W, boxH, 2.5, 2.5, "FD");
      let yy = y0 + 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...TEAL);
      doc.text(row.medicine, innerX, yy);
      yy += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...SLATE);
      yy = drawWrapped(
        doc,
        `Dose: ${row.dose}`,
        innerX,
        yy,
        innerW,
        lh,
        9.5,
      );
      yy = drawWrapped(doc, `How: ${row.how}`, innerX, yy, innerW, lh, 9.5);
      yy = drawWrapped(doc, `When: ${row.when}`, innerX, yy, innerW, lh, 9.5);
      y = y0 + boxH + 4;
    }
    y += 4;
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    y = drawWrapped(
      doc,
      "Tip: Bring this sheet to the pharmacy and ask the pharmacist to match it to your actual prescription label. The label always wins if anything differs.",
      MARGIN,
      y,
      CONTENT_W,
      4.2,
      9,
    );
    doc.setTextColor(...SLATE);
    y += 5;
    if (schedule.length === 1 && input.dxChlam) {
      y = drawWrapped(
        doc,
        "Chlamydia was checked in your visit. If your clinician added another antibiotic (for example doxycycline or azithromycin) for dual coverage, take that too exactly as prescribed.",
        MARGIN,
        y,
        CONTENT_W,
        4.2,
        9,
      );
    }
    y += 6;
  }

  // Clearance footnote (concise)
  if (!input.hardStop) {
    if (needNewPage(y, 20)) {
      doc.addPage();
      y = MARGIN;
    }
    y = sectionBar(doc, y, "Why this dose (brief)");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const clr = `Your weight (${input.weightKg} kg) and genetics profile (${input.pgxLabel}) were used in this demo to estimate ceftriaxone clearance (about ${input.ceftriaxoneCindividualLh} L/h). Your clinician confirms the final dose.`;
    y = drawWrapped(doc, clr, MARGIN, y, CONTENT_W, 4.3, 9.5);
    y += 8;
  }

  // STI education
  const stiKeys: (keyof typeof STI_EDU)[] = [];
  if (input.dxGono) stiKeys.push("gonorrhea");
  if (input.dxChlam) stiKeys.push("chlamydia");
  if (input.dxSyph) stiKeys.push("syphilis");
  if (input.dxTrich) stiKeys.push("trich");

  if (stiKeys.length > 0) {
    if (needNewPage(y, 28)) {
      doc.addPage();
      y = MARGIN;
    }
    y = sectionBar(doc, y, "General information about your diagnosis(es)");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    y = drawWrapped(
      doc,
      "This is general education only—not a substitute for talking with your clinician. Habits, testing, and treatment differ by person.",
      MARGIN,
      y,
      CONTENT_W,
      4,
      9,
    );
    y += 5;
    doc.setTextColor(...SLATE);

    for (const key of stiKeys) {
      const block = STI_EDU[key];
      const estH = 55;
      if (needNewPage(y, estH)) {
        doc.addPage();
        y = MARGIN;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...TEAL);
      doc.text(block.title, MARGIN, y);
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...SLATE);
      doc.text("Day to day:", MARGIN, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      y = drawWrapped(doc, block.dayToDay, MARGIN + 2, y, CONTENT_W - 2, 4.2, 9.5);
      y += 3;
      doc.setFont("helvetica", "bold");
      doc.text("How it spreads:", MARGIN, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      y = drawWrapped(doc, block.spread, MARGIN + 2, y, CONTENT_W - 2, 4.2, 9.5);
      y += 3;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...TEAL);
      doc.text("After treatment, partners, and sex:", MARGIN, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...SLATE);
      y = drawWrapped(
        doc,
        block.afterTreatment,
        MARGIN + 2,
        y,
        CONTENT_W - 2,
        4.2,
        9.5,
      );
      y += 4;
      if (key === "gonorrhea" && input.dxGono) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...TEAL);
        doc.text("Anatomic sites (from your form):", MARGIN, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...SLATE);
        doc.setFontSize(9.5);
        y = drawWrapped(
          doc,
          gonorrheaSitesPatientPdfAddendum(input.gonoSites),
          MARGIN + 2,
          y,
          CONTENT_W - 2,
          4.2,
          9.5,
        );
        y += 4;
      }
      y += 4;
    }
  } else {
    if (needNewPage(y, 24)) {
      doc.addPage();
      y = MARGIN;
    }
    y = sectionBar(doc, y, "STI education");
    y = drawWrapped(
      doc,
      "No specific STI was checked in the demo form. Ask your clinician which infections you were tested or treated for, and request a handout tailored to those.",
      MARGIN,
      y,
      CONTENT_W,
      4.3,
      10,
    );
    y += 6;
  }

  // Follow-up
  if (needNewPage(y, 30)) {
    doc.addPage();
    y = MARGIN;
  }
  y = sectionBar(doc, y, "Follow-up");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = drawWrapped(
    doc,
    "Finish all medicine exactly as prescribed—even if you feel better. For many gonorrhea and chlamydia treatments, clinics commonly advise no sex for at least 7 days after treatment and until all partners have been treated; syphilis and trich have different rules about sores, symptoms, and partners—use the sections above and your clinician's exact dates.",
    MARGIN,
    y,
    CONTENT_W,
    4.5,
    10,
  );
  y += 6;
  y = drawWrapped(
    doc,
    "Return for retesting if your clinic schedules it (often 1–2 weeks after treatment for some infections, and again later for gonorrhea/chlamydia if you are at ongoing risk). Tell your partners they may need testing or treatment; partner services or EPT (expedited partner therapy) may be available where you live.",
    MARGIN,
    y,
    CONTENT_W,
    4.5,
    10,
  );

  // Footer disclaimer
  y = Math.max(y + 10, PAGE_H - 28);
  if (y > PAGE_H - 22) {
    doc.addPage();
    y = PAGE_H - 28;
  }
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  drawWrapped(
    doc,
    "DOODLE is a demonstration clinical decision support tool. It is not medical advice and not a substitute for a licensed clinician. Emergency? Call your local emergency number.",
    MARGIN,
    y,
    CONTENT_W,
    3.6,
    8,
  );

  const fname = `DOODLE-patient-handout-${input.generatedAt.toISOString().slice(0, 10)}.pdf`;
  doc.save(fname);
}
