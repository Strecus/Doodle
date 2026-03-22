import fs from "fs";

const B = "ATGC";
function synth(a, b, c, len = 500) {
  let s = "";
  for (let i = 0; i < len; i++) s += B[(i * a + i * i * b + c) % 4];
  return s;
}

function mutate(ref, zeroBasedPositions) {
  const v = ref.split("");
  for (const i of zeroBasedPositions) {
    const cur = v[i];
    const alts = B.split("").filter((x) => x !== cur);
    v[i] = alts[i % alts.length];
  }
  return v.join("");
}

const refG = synth(7, 1, 13);
const refS = synth(11, 3, 19);
const refC = synth(5, 13, 23);

const snpG = [42, 91, 148, 149, 203, 256, 301, 351, 400, 467].map((x) => x - 1);
const snpS = [55, 88, 120, 166, 210, 255, 300, 344, 388, 455].map((x) => x - 1);
const snpC = [33, 77, 111, 199, 222, 288, 333, 377, 411, 489].map((x) => x - 1);

const varG = mutate(refG, snpG);
const varS = mutate(refS, snpS);
const varC = mutate(refC, snpC);

const out = "public/poc-examples";
fs.mkdirSync(out, { recursive: true });

function toTxtV(header, seqVar, ref) {
  const lines = [header, "# pos<TAB>base<TAB>. or ref>alt", ""];
  for (let i = 0; i < 500; i++) {
    const p = i + 1;
    const base = seqVar[i];
    const r = ref[i];
    const note = base === r ? "." : `${r}>${base}`;
    lines.push(String(p).padStart(3, "0") + "\t" + base + "\t" + note);
  }
  return lines.join("\n");
}

function toTxtW(header, ref) {
  const lines = [header, "# pos<TAB>base", ""];
  for (let i = 0; i < 500; i++) {
    lines.push(String(i + 1).padStart(3, "0") + "\t" + ref[i]);
  }
  return lines.join("\n");
}

const meta = [
  [
    "gonorrhea_poc_wild.txt",
    toTxtW(
      "# DOODLE POC — Neisseria gonorrhoeae demo window (matches app ref)",
      refG,
    ),
  ],
  [
    "gonorrhea_poc_resistant.txt",
    toTxtV(
      "# DOODLE POC — Gonorrhea demo, 10 SNPs vs app ref (resistant demo)",
      varG,
      refG,
    ),
  ],
  [
    "syphilis_poc_wild.txt",
    toTxtW(
      "# DOODLE POC — Treponema pallidum–like synthetic 500 bp (wild vs app syphilis ref)",
      refS,
    ),
  ],
  [
    "syphilis_poc_resistant.txt",
    toTxtV(
      "# DOODLE POC — Syphilis demo, 10 SNPs vs app ref (resistant demo)",
      varS,
      refS,
    ),
  ],
  [
    "chlamydia_poc_wild.txt",
    toTxtW(
      "# DOODLE POC — Chlamydia trachomatis–like synthetic 500 bp (wild vs app chlamydia ref)",
      refC,
    ),
  ],
  [
    "chlamydia_poc_resistant.txt",
    toTxtV(
      "# DOODLE POC — Chlamydia demo, 10 SNPs vs app ref (resistant demo)",
      varC,
      refC,
    ),
  ],
];

for (const [name, body] of meta) {
  fs.writeFileSync(`${out}/${name}`, body, "utf8");
}

const tsRefs = `// auto-generated strings from scripts/gen-poc-refs.mjs
export const POC_REF_GONORRHEA_500 = ${JSON.stringify(refG)};
export const POC_REF_SYPHILIS_500 = ${JSON.stringify(refS)};
export const POC_REF_CHLAMYDIA_500 = ${JSON.stringify(refC)};
`;
fs.writeFileSync("src/pocRefs.generated.ts", tsRefs, "utf8");
console.log("wrote", meta.length, "files + src/pocRefs.generated.ts");
