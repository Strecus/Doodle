import {
  POC_REF_CHLAMYDIA_500,
  POC_REF_GONORRHEA_500,
  POC_REF_SYPHILIS_500,
} from "./pocRefs.generated";

/**
 * Gonorrhea demo window (500 nt) — same as gonorrhea-gene-compare Ng ref fasta.
 * Syphilis / chlamydia are separate synthetic demo references for POC compare.
 */
export const GYR_A_REF_500 = POC_REF_GONORRHEA_500;

export type PocPathogenId = "gonorrhea" | "syphilis" | "chlamydia";

const POC_REFS: Record<PocPathogenId, string> = {
  gonorrhea: POC_REF_GONORRHEA_500,
  syphilis: POC_REF_SYPHILIS_500,
  chlamydia: POC_REF_CHLAMYDIA_500,
};

export function getPocRef(pathogen: PocPathogenId): string {
  return POC_REFS[pathogen];
}

export type GyrAParseResult =
  | { ok: true; bases: string }
  | { ok: false; error: string };

/**
 * Parses POC text: skip # and blank lines; lines are pos + whitespace + base (+ optional third column).
 */
export function parseGyrAPocTxt(content: string): GyrAParseResult {
  const byPos = new Map<number, string>();
  const lines = content.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^(\d{1,3})[\t ]+([ATGC])(?:[\t ].*)?$/i);
    if (!m) {
      return {
        ok: false,
        error: `Unrecognized line (use "pos<TAB>base", optional third column): ${line.slice(0, 60)}${line.length > 60 ? "…" : ""}`,
      };
    }
    const pos = Number(m[1]);
    const base = m[2].toUpperCase();
    if (pos < 1 || pos > 500) {
      return { ok: false, error: `Position out of range (1–500): ${pos}` };
    }
    if (byPos.has(pos)) {
      return { ok: false, error: `Duplicate position: ${pos}` };
    }
    byPos.set(pos, base);
  }
  if (byPos.size !== 500) {
    return {
      ok: false,
      error: `Need 500 positions; found ${byPos.size}.`,
    };
  }
  let bases = "";
  for (let i = 1; i <= 500; i++) {
    const b = byPos.get(i);
    if (!b) return { ok: false, error: `Missing position ${i}` };
    bases += b;
  }
  return { ok: true, bases };
}

export function comparePocSampleToRef(
  sample: string,
  pathogen: PocPathogenId,
): {
  mismatchCount: number;
  positions: { pos: number; ref: string; sample: string }[];
} {
  const ref = POC_REFS[pathogen];
  const positions: { pos: number; ref: string; sample: string }[] = [];
  let mismatchCount = 0;
  const n = Math.min(ref.length, sample.length);
  for (let i = 0; i < n; i++) {
    const r = ref[i]!;
    const s = sample[i]!;
    if (r !== s) {
      mismatchCount++;
      if (positions.length < 24) positions.push({ pos: i + 1, ref: r, sample: s });
    }
  }
  if (sample.length !== ref.length) {
    mismatchCount += Math.abs(sample.length - ref.length);
  }
  return { mismatchCount, positions };
}

/** @deprecated use comparePocSampleToRef(sample, "gonorrhea") */
export function compareGyrSampleToRef(sample: string) {
  return comparePocSampleToRef(sample, "gonorrhea");
}
