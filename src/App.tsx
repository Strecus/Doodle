import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  Info,
  Pill,
  Users,
} from "lucide-react";
import { type ChangeEvent, useMemo, useState } from "react";
import { AdherenceScreener } from "./AdherenceScreener";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CPOPULATION_LH,
  PGX_PROFILE_IDS,
  type PgxProfileId,
  clearanceRowsForPatient,
  getPgxProfileMeta,
} from "./clearance";
import {
  US_STATE_CODES,
  calculateMIC90,
  getGonorrheaMicDistribution,
  getRegionForState,
  surveillanceMetadata,
  type UsStateCode,
} from "./mic90";
import {
  type PocPathogenId,
  comparePocSampleToRef,
  parseGyrAPocTxt,
} from "./gyrAUpload";
import {
  generateAlerts,
  type ClinicalAlert,
  type TreatmentInput as AlertInput,
} from "./alertEngine";
import {
  type HealthLiteracyLevel,
  type PreferredLanguageId,
  languageCounselingPoints,
  literacyCounselingPoints,
  preferredLanguageDisplayName,
} from "./patientEducationCopy";
import {
  EMPTY_GONORRHEA_SITES,
  GONORRHEA_SITE_META,
  type GonorrheaSiteId,
  type GonorrheaSites,
  formatGonorrheaSitesSummary,
  gonorrheaSiteEducationBullets,
} from "./gonorrheaSites";
import {
  generateRecommendation,
  type TreatmentDrug,
  type TreatmentInput as RecommendationInput,
} from "./treatmentRecommendation";

/** Renders P_G,base^XR (PGx base activity factor). */
function NotationPGbaseXR({ className }: { className?: string }) {
  return (
    <span className={className}>
      P<sub>G,base</sub>
      <sup>XR</sup>
    </span>
  );
}

type AppSection = "dosing" | "adherence";
type View = "intake" | "output";

type Allergy = "none" | "low" | "high";
type GyrA = "not-tested" | "wild" | "mutant";

type GyrAUploadSummary = {
  mismatches: number;
  mutant: boolean;
  pathogen: PocPathogenId;
};

const POC_PATHOGEN_LABEL: Record<PocPathogenId, string> = {
  gonorrhea: "Gonorrhea (gyrA-like demo, 500 bp)",
  syphilis: "Syphilis (synthetic demo, 500 bp)",
  chlamydia: "Chlamydia (synthetic demo, 500 bp)",
};

function GyrAPocSection({
  fieldIdPrefix,
  gyrAPocCompleted,
  onGyrAPocCompleted,
  pocPathogen,
  onPocPathogenChange,
  gyrA,
  onGyrA,
  fileInputKey,
  onFileChange,
  uploadError,
  uploadSummary,
}: {
  fieldIdPrefix: string;
  gyrAPocCompleted: boolean;
  onGyrAPocCompleted: (v: boolean) => void;
  pocPathogen: PocPathogenId;
  onPocPathogenChange: (v: PocPathogenId) => void;
  gyrA: GyrA;
  onGyrA: (v: GyrA) => void;
  fileInputKey: number;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  uploadError: string | null;
  uploadSummary: GyrAUploadSummary | null;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-3">
        <Checkbox
          id={`${fieldIdPrefix}-poc-done`}
          checked={gyrAPocCompleted}
          onCheckedChange={(c) => onGyrAPocCompleted(c === true)}
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label
            htmlFor={`${fieldIdPrefix}-poc-done`}
            className="cursor-pointer font-medium leading-snug"
          >
            POC test completed — I have a result file to compare
          </Label>
          <p className="text-xs text-muted-foreground">
            Pick which organism the file belongs to; upload compares to that
            demo reference. Uncheck to enter gonorrhea gyrA wild / mutant /
            not tested manually.
          </p>
        </div>
      </div>

      {gyrAPocCompleted ? (
        <div className="space-y-3 rounded-md border p-3">
          <div className="space-y-2">
            <Label htmlFor={`${fieldIdPrefix}-poc-pathogen`}>
              POC file is for
            </Label>
            <Select
              value={pocPathogen}
              onValueChange={(v) => onPocPathogenChange(v as PocPathogenId)}
            >
              <SelectTrigger
                id={`${fieldIdPrefix}-poc-pathogen`}
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(POC_PATHOGEN_LABEL) as PocPathogenId[]).map(
                  (id) => (
                    <SelectItem key={id} value={id}>
                      {POC_PATHOGEN_LABEL[id]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${fieldIdPrefix}-file`}>POC text file</Label>
            <p className="text-xs text-muted-foreground">
              One row per position 1–500:{" "}
              <span className="font-mono text-foreground/80">pos</span>, tab or
              space, then{" "}
              <span className="font-mono text-foreground/80">A|T|G|C</span>.
              Extra columns are ignored. Compared to the in-app reference for{" "}
              <span className="font-medium text-foreground/90">
                {POC_PATHOGEN_LABEL[pocPathogen]}
              </span>
              .
            </p>
          </div>
          <Input
            key={fileInputKey}
            id={`${fieldIdPrefix}-file`}
            type="file"
            accept=".txt,text/plain"
            onChange={onFileChange}
            className="cursor-pointer"
          />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <a
              className="text-primary underline"
              href={`/poc-examples/${pocPathogen}_poc_wild.txt`}
              download
            >
              Example — wild (no SNPs vs ref)
            </a>
            <a
              className="text-primary underline"
              href={`/poc-examples/${pocPathogen}_poc_resistant.txt`}
              download
            >
              Example — resistant (10 SNPs vs ref)
            </a>
          </div>
          {uploadError ? (
            <p className="text-sm text-destructive">{uploadError}</p>
          ) : null}
          {uploadSummary ? (
            <p className="text-sm text-muted-foreground">
              {uploadSummary.mismatches === 0
                ? `Matches in-app reference for ${POC_PATHOGEN_LABEL[uploadSummary.pathogen]} — no SNPs in this window.`
                : uploadSummary.pathogen === "gonorrhea"
                  ? `${uploadSummary.mismatches} SNP(s) vs gonorrhea demo ref — variant; primary line switches to dual therapy (demo).`
                  : `${uploadSummary.mismatches} SNP(s) vs ${POC_PATHOGEN_LABEL[uploadSummary.pathogen]} — demo “resistant” file; gonorrhea regimen still follows manual gyrA below.`}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Upload a .txt to compare to the selected reference.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor={`${fieldIdPrefix}-manual`}>POC gyrA (manual)</Label>
          <Select value={gyrA} onValueChange={(v) => onGyrA(v as GyrA)}>
            <SelectTrigger id={`${fieldIdPrefix}-manual`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not-tested">Not tested</SelectItem>
              <SelectItem value="wild">Wild-type</SelectItem>
              <SelectItem value="mutant">Mutant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function formatDrugLabel(drug: TreatmentDrug) {
  const details = [
    drug.dose !== "N/A" ? drug.dose : null,
    drug.route !== "N/A" ? drug.route : null,
    drug.frequency,
  ].filter((value): value is string => Boolean(value));

  return [drug.name, ...details].join(" · ");
}

function alertAppearance(severity: ClinicalAlert["severity"]) {
  switch (severity) {
    case "hard-stop":
      return {
        variant: "destructive" as const,
        className:
          "border-red-200 bg-red-50 text-red-950 dark:bg-red-950/30 dark:text-red-100",
        descriptionClassName: "text-red-950 dark:text-red-50",
        Icon: AlertTriangle,
      };
    case "warning":
      return {
        variant: "default" as const,
        className:
          "border-amber-200 bg-amber-50 text-amber-950 dark:bg-amber-950/25 dark:text-amber-50",
        descriptionClassName: "text-amber-950 dark:text-amber-50",
        Icon: AlertCircle,
      };
    default:
      return {
        variant: "default" as const,
        className: "border-border bg-muted/80",
        descriptionClassName: "",
        Icon: Info,
      };
  }
}

function resolveAlertDescription(
  alert: ClinicalAlert,
  gonorrheaSites: GonorrheaSites,
) {
  if (alert.id !== "hard-stop-gonorrhea-severe-allergy") {
    return alert.description;
  }

  return gonorrheaSites.pharyngeal
    ? "Pharyngeal gonorrhea with high-risk beta-lactam allergy needs ID-guided treatment planning."
    : "Gonorrhea with high-risk penicillin or cephalosporin allergy may be unsafe for ceftriaxone-based pathways. Consult Infectious Diseases.";
}

function ClearanceFormulaPanel({
  weightKg,
  pgBaseXr,
  pgxProfileLabel,
  albuminRiskCount,
}: {
  weightKg: number;
  pgBaseXr: number;
  pgxProfileLabel: string;
  albuminRiskCount: number;
}) {
  const albuminAdjustmentPercent = albuminRiskCount * 15;
  const rows = useMemo(
    () => clearanceRowsForPatient(weightKg, pgBaseXr, albuminRiskCount),
    [weightKg, pgBaseXr, albuminRiskCount],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Allometric clearance (C<sub>individual</sub>)
        </CardTitle>
        <CardDescription className="text-foreground/85">
          <span className="font-mono text-foreground/90">
            C<sub>individual</sub> = C<sub>population</sub> × (W / 70)
            <sup>0.75</sup> × <NotationPGbaseXR />
          </span>{" "}
          with W in kg. Host PGx profile:{" "}
          <span className="font-medium text-foreground">{pgxProfileLabel}</span>{" "}
          — <NotationPGbaseXR className="font-medium text-foreground" /> ={" "}
          <span className="font-medium text-foreground">{pgBaseXr}</span>.
          {albuminRiskCount > 0 ? (
            <>
              {" "}
              Albumin adjustment applied from{" "}
              <span className="font-medium text-foreground">
                {albuminRiskCount}
              </span>{" "}
              risk flag(s), increasing modeled clearance by{" "}
              <span className="font-medium text-foreground">
                {albuminAdjustmentPercent}%
              </span>
              .
            </>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-3 py-2 font-medium">Drug</th>
                <th className="px-3 py-2 font-medium">Context</th>
                <th className="px-3 py-2 font-medium tabular-nums">
                  C<sub>population</sub> (L/h)
                </th>
                <th className="px-3 py-2 font-medium tabular-nums">
                  C<sub>individual</sub> (L/h)
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.drug} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{r.drug}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.indication}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{r.cpopulationLh}</td>
                  <td className="px-3 py-2 tabular-nums">{r.cindividualLh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          At W = {weightKg} kg. Higher C<sub>population</sub> for azithromycin
          reflects extensive tissue distribution (apparent clearance), not
          faster true elimination alone.{" "}
          {albuminRiskCount > 0
            ? `Albumin-adjusted clearance is shown for all rows.`
            : "No albumin adjustment is applied."}
        </p>
      </CardContent>
    </Card>
  );
}

export default function App() {
  const [section, setSection] = useState<AppSection>("dosing");
  const [view, setView] = useState<View>("intake");

  const [weightKg, setWeightKg] = useState(78);
  const [pregnant, setPregnant] = useState(false);
  const [allergy, setAllergy] = useState<Allergy>("none");
  const [pgx, setPgx] = useState<PgxProfileId>("normal");
  const [gyrA, setGyrA] = useState<GyrA>("not-tested");
  const [gyrAPocCompleted, setGyrAPocCompleted] = useState(false);
  const [gyrAUploadError, setGyrAUploadError] = useState<string | null>(null);
  const [gyrAUploadSummary, setGyrAUploadSummary] =
    useState<GyrAUploadSummary | null>(null);
  const [gyrAFileKey, setGyrAFileKey] = useState(0);
  const [pocPathogen, setPocPathogen] = useState<PocPathogenId>("gonorrhea");
  /** US state for gonorrhea regional MIC routing (no ZIP in this UI). */
  const [pocMicState, setPocMicState] = useState<UsStateCode>("NY");

  const [dxGono, setDxGono] = useState(false);
  const [gonorrheaSites, setGonorrheaSites] = useState<GonorrheaSites>(
    EMPTY_GONORRHEA_SITES,
  );
  const [dxChlam, setDxChlam] = useState(false);
  const [dxSyph, setDxSyph] = useState(false);
  const [dxTrich, setDxTrich] = useState(false);

  const surveillanceRegion = useMemo(
    () => (dxGono ? getRegionForState(pocMicState) : null),
    [dxGono, pocMicState],
  );
  const gonorrheaMic90 = useMemo(() => {
    if (!dxGono || !surveillanceRegion) return null;
    return calculateMIC90(getGonorrheaMicDistribution(surveillanceRegion));
  }, [dxGono, surveillanceRegion]);

  const [icu, setIcu] = useState(false);
  const [liver, setLiver] = useState(false);
  const [malnourished, setMalnourished] = useState(false);
  const [ckd, setCkd] = useState(false);

  const [sdohCost, setSdohCost] = useState(false);
  const [sdohTransport, setSdohTransport] = useState(false);
  const [sdohHousing, setSdohHousing] = useState(false);
  const [sdohFood, setSdohFood] = useState(false);

  const [healthLiteracy, setHealthLiteracy] =
    useState<HealthLiteracyLevel>("adequate");
  const [preferredLanguage, setPreferredLanguage] =
    useState<PreferredLanguageId>("english");
  const [languageOtherSpecify, setLanguageOtherSpecify] = useState("");

  const pgxMeta = getPgxProfileMeta(pgx);
  const pgBaseXr = pgxMeta.pgBaseXr;
  const albuminRiskCount = [icu, liver, malnourished, ckd].filter(Boolean).length;

  const effectiveGyrA = useMemo((): GyrA => {
    if (
      gyrAPocCompleted &&
      gyrAUploadSummary &&
      gyrAUploadSummary.pathogen === "gonorrhea"
    ) {
      return gyrAUploadSummary.mutant ? "mutant" : "wild";
    }
    return gyrA;
  }, [gyrAPocCompleted, gyrAUploadSummary, gyrA]);

  const recommendationInput: RecommendationInput = {
    allergyProfile: allergy,
    pgxProfile: pgx,
    weightKg,
    pregnant,
    diagnoses: {
      gonorrhea: dxGono,
      chlamydia: dxChlam,
      syphilis: dxSyph,
      trichomoniasis: dxTrich,
    },
    gyrAResult: effectiveGyrA,
    regionalGonorrheaMic90: gonorrheaMic90,
  };

  const recommendation = generateRecommendation(recommendationInput);
  const primaryRecommendationLine = formatDrugLabel(recommendation.primaryDrug);

  const alertInput: AlertInput = {
    weightKg,
    pregnant,
    allergy,
    pgx,
    gyrA: effectiveGyrA,
    zipInput: "",
    residenceState: pocMicState,
    dxGono,
    dxChlam,
    dxSyph,
    dxTrich,
    icu,
    liver,
    malnourished,
    ckd,
    sdohCost,
    sdohTransport,
    sdohHousing,
    sdohFood,
  };

  const alerts = generateAlerts(alertInput);
  const handoutSummaryLine = recommendation.hardStop.active
    ? recommendation.hardStop.reason ?? primaryRecommendationLine
    : primaryRecommendationLine;
  const capturedContext = [
    pregnant && "pregnancy",
    effectiveGyrA === "mutant" && "gyrA variant (POC vs ref)",
    dxGono && formatGonorrheaSitesSummary(gonorrheaSites),
    dxChlam && "chlamydia",
    dxSyph && "syphilis",
    dxTrich && "trichomoniasis",
  ].filter((value): value is string => Boolean(value));

  const ceftriaxoneCindividualLh = useMemo(() => {
    const rows = clearanceRowsForPatient(weightKg, pgBaseXr, albuminRiskCount);
    return rows[0]?.cindividualLh ?? 0;
  }, [weightKg, pgBaseXr, albuminRiskCount]);

  const literacyEducationBullets = useMemo(
    () => literacyCounselingPoints(healthLiteracy),
    [healthLiteracy],
  );
  const languageEducationBullets = useMemo(
    () => languageCounselingPoints(preferredLanguage, languageOtherSpecify),
    [preferredLanguage, languageOtherSpecify],
  );

  function onGyrAPocCompletedChange(v: boolean) {
    setGyrAPocCompleted(v);
    if (!v) {
      setGyrAUploadError(null);
      setGyrAUploadSummary(null);
      setGyrAFileKey((k) => k + 1);
    }
  }

  function onPocPathogenChange(v: PocPathogenId) {
    setPocPathogen(v);
    setGyrAUploadError(null);
    setGyrAUploadSummary(null);
    setGyrAFileKey((k) => k + 1);
  }

  function onGyrAFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setGyrAUploadError(null);
    setGyrAUploadSummary(null);
    void file
      .text()
      .then((text) => {
        const parsed = parseGyrAPocTxt(text);
        if (!parsed.ok) {
          setGyrAUploadError(parsed.error);
          return;
        }
        const { mismatchCount } = comparePocSampleToRef(
          parsed.bases,
          pocPathogen,
        );
        setGyrAUploadSummary({
          mismatches: mismatchCount,
          mutant: mismatchCount > 0,
          pathogen: pocPathogen,
        });
      })
      .catch(() => setGyrAUploadError("Could not read file."));
  }

  function reset() {
    setView("intake");
    setGyrAPocCompleted(false);
    setGyrAUploadError(null);
    setGyrAUploadSummary(null);
    setGyrAFileKey((k) => k + 1);
    setPocPathogen("gonorrhea");
    setHealthLiteracy("adequate");
    setPreferredLanguage("english");
    setLanguageOtherSpecify("");
    setGonorrheaSites(EMPTY_GONORRHEA_SITES);
  }

  function generate() {
    setView("output");
  }

  function showPlannedFeature(label: string) {
    window.alert(`Feature coming soon: ${label}`);
  }

  async function handlePartnerEptHandoutPdf() {
    const { downloadPartnerEptHandoutPdf } = await import(
      "./partnerEptHandoutPdf"
    );
    downloadPartnerEptHandoutPdf({
      generatedAt: new Date(),
      dxGono,
      gonoSites: gonorrheaSites,
      dxChlam,
      dxSyph,
      dxTrich,
      preferredLanguageLabel: preferredLanguageDisplayName(
        preferredLanguage,
        languageOtherSpecify,
      ),
    });
  }

  async function handlePatientHandoutPdf() {
    const { downloadPatientHandoutPdf } = await import("./patientHandoutPdf");
    downloadPatientHandoutPdf({
      generatedAt: new Date(),
      hardStop: recommendation.hardStop.active,
      effectiveGyrA,
      mainLine: handoutSummaryLine,
      dxGono,
      gonoSites: gonorrheaSites,
      dxChlam,
      dxSyph,
      dxTrich,
      pregnant,
      weightKg,
      ceftriaxoneCindividualLh,
      pgxLabel: pgxMeta.label,
      preferredLanguageLabel: preferredLanguageDisplayName(
        preferredLanguage,
        languageOtherSpecify,
      ),
    });
  }

  return (
    <Tabs
      value={section}
      onValueChange={(v) => setSection(v as AppSection)}
      className="flex min-h-screen flex-col"
    >
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Clinical decision support
            </p>
            <h1 className="text-2xl font-bold tracking-tight">DOODLE</h1>
            <p className="text-sm text-muted-foreground">
              STI dosing &amp; pathway checks (non-probabilistic model view)
            </p>
          </div>
          <div className="hidden text-right text-xs text-muted-foreground sm:block">
            <Card className="border py-3 shadow-none">
              <CardContent className="px-3 py-0">
                <p>Demo UI — not for clinical use</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <div className="border-b bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <TabsList className="h-auto w-full max-w-xl flex-wrap p-1 sm:w-fit">
            <TabsTrigger value="dosing" className="gap-2">
              <Pill className="size-4 shrink-0" aria-hidden />
              Treatment dosing
            </TabsTrigger>
            <TabsTrigger value="adherence" className="gap-2">
              <ClipboardList className="size-4 shrink-0" aria-hidden />
              Adherence check (patient)
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <TabsContent value="adherence" className="mt-0 outline-none">
          <AdherenceScreener
            sdohCost={sdohCost}
            sdohTransport={sdohTransport}
            sdohHousing={sdohHousing}
            sdohFood={sdohFood}
            onSdohCostChange={setSdohCost}
            onSdohTransportChange={setSdohTransport}
            onSdohHousingChange={setSdohHousing}
            onSdohFoodChange={setSdohFood}
          />
        </TabsContent>

        <TabsContent value="dosing" className="mt-0 outline-none">
        {view === "intake" && (
          <div className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Patient parameters</CardTitle>
                  <CardDescription>
                    Allergy and PGx profiles (P_G,base^XR), weight, pregnancy,
                    and diagnosis context.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="allergy">Allergy profile</Label>
                    <Select
                      value={allergy}
                      onValueChange={(v) => setAllergy(v as Allergy)}
                    >
                      <SelectTrigger id="allergy" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="low">Low-risk PCN / Ceph</SelectItem>
                        <SelectItem value="high">
                          HIGH-RISK PCN / Ceph
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pgx">Host PGx profile</Label>
                    <Select
                      value={pgx}
                      onValueChange={(v) => setPgx(v as PgxProfileId)}
                    >
                      <SelectTrigger id="pgx" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PGX_PROFILE_IDS.map((id) => {
                          const m = getPgxProfileMeta(id);
                          return (
                            <SelectItem key={id} value={id}>
                              {m.label} — P_G,base^XR = {m.pgBaseXr}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      <NotationPGbaseXR className="font-medium text-foreground/80" />{" "}
                      is set from this profile and scales{" "}
                      C<sub>individual</sub> in{" "}
                      <span className="font-mono text-foreground/80">
                        C<sub>individual</sub> = C<sub>population</sub> ×
                        (W/70)<sup>0.75</sup> × <NotationPGbaseXR />.
                      </span>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="weight-slider">
                      Weight (kg):{" "}
                      <span className="font-normal text-muted-foreground">
                        {weightKg} kg
                      </span>
                    </Label>
                    <Slider
                      id="weight-slider"
                      min={40}
                      max={200}
                      step={1}
                      value={[weightKg]}
                      onValueChange={(v) => setWeightKg(v[0] ?? 40)}
                    />
                    <Input
                      type="number"
                      min={40}
                      max={200}
                      value={weightKg}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n))
                          setWeightKg(Math.min(200, Math.max(40, n)));
                      }}
                      className="sm:w-28"
                      aria-label="Weight in kilograms"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/50 p-4">
                    <Label htmlFor="preg" className="cursor-pointer">
                      Pregnancy status
                    </Label>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="preg"
                        checked={pregnant}
                        onCheckedChange={setPregnant}
                      />
                      <span className="text-sm font-medium text-muted-foreground">
                        {pregnant ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>

                  <fieldset className="rounded-lg border p-4">
                    <legend className="px-1 text-sm font-medium">
                      Confirmed diagnosis
                    </legend>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="dx-Gonorrhea"
                          checked={dxGono}
                          onCheckedChange={(c) => {
                            const on = c === true;
                            setDxGono(on);
                            if (!on) setGonorrheaSites(EMPTY_GONORRHEA_SITES);
                          }}
                        />
                        <Label
                          htmlFor="dx-Gonorrhea"
                          className="cursor-pointer font-normal"
                        >
                          Gonorrhea
                        </Label>
                      </div>
                      {[
                        ["Chlamydia", dxChlam, setDxChlam],
                        ["Syphilis", dxSyph, setDxSyph],
                        ["Trichomoniasis", dxTrich, setDxTrich],
                      ].map(([label, checked, set]) => (
                        <div
                          key={label as string}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            id={`dx-${label}`}
                            checked={checked as boolean}
                            onCheckedChange={(c) =>
                              (set as (b: boolean) => void)(c === true)
                            }
                          />
                          <Label
                            htmlFor={`dx-${label}`}
                            className="cursor-pointer font-normal"
                          >
                            {label as string}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {dxGono ? (
                      <div className="mt-4 space-y-3 rounded-md border border-dashed border-primary/30 bg-primary/5 p-3">
                        <p className="text-sm font-medium text-foreground">
                          Gonorrhea anatomic site
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Select every site with exposure or symptoms. Education,
                          MIC context, and PDF handouts use this to stress the
                          right swabs and partner testing.
                        </p>
                        <div className="grid gap-2 sm:grid-cols-1">
                          {(
                            [
                              "urogenital",
                              "rectal",
                              "pharyngeal",
                            ] as GonorrheaSiteId[]
                          ).map((id) => (
                            <div key={id} className="flex items-start gap-2">
                              <Checkbox
                                id={`gono-site-${id}`}
                                checked={gonorrheaSites[id]}
                                onCheckedChange={(c) =>
                                  setGonorrheaSites((prev) => ({
                                    ...prev,
                                    [id]: c === true,
                                  }))
                                }
                                className="mt-0.5"
                              />
                              <Label
                                htmlFor={`gono-site-${id}`}
                                className="cursor-pointer font-normal leading-snug"
                              >
                                {GONORRHEA_SITE_META[id].label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </fieldset>

                  {dxGono ? (
                    <fieldset className="space-y-4 rounded-lg border p-4">
                      <legend className="px-1 text-sm font-medium">
                        POC gyrA test &amp; regional MIC context
                      </legend>
                      <p className="text-xs text-muted-foreground">
                        Shown when <span className="font-medium">Gonorrhea</span>{" "}
                        is selected. {surveillanceMetadata().source}. MIC
                        <sub>90</sub> is the lowest MIC bin whose cumulative
                        regional probability reaches ≥90%. Choose the patient’s{" "}
                        <span className="font-medium">state of care / residence</span>{" "}
                        to map into the regional MIC archetype (no ZIP entry in
                        this screen).
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Extra-genital gonorrhea (rectal or throat) is not
                        detected by urine alone—match NAAT swabs to the sites you
                        checked under{" "}
                        <span className="font-medium">Confirmed diagnosis</span>
                        .
                      </p>

                      <div className="space-y-2">
                        <Label htmlFor="poc-mic-state">
                          State for regional MIC routing
                        </Label>
                        <Select
                          value={pocMicState}
                          onValueChange={(v) =>
                            setPocMicState(v as UsStateCode)
                          }
                        >
                          <SelectTrigger id="poc-mic-state" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {US_STATE_CODES.map((code) => (
                              <SelectItem key={code} value={code}>
                                {code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {gonorrheaMic90 != null && surveillanceRegion ? (
                        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                          <p className="font-medium">
                            Gonorrhea MIC<sub>90</sub> (ceftriaxone surrogate):{" "}
                            <span className="tabular-nums">
                              {gonorrheaMic90} µg/mL
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Region{" "}
                            <span className="font-medium">
                              {surveillanceRegion}
                            </span>{" "}
                            from state{" "}
                            <span className="font-medium">{pocMicState}</span>.
                          </p>
                        </div>
                      ) : null}

                      <GyrAPocSection
                        fieldIdPrefix="gono"
                        gyrAPocCompleted={gyrAPocCompleted}
                        onGyrAPocCompleted={onGyrAPocCompletedChange}
                        pocPathogen={pocPathogen}
                        onPocPathogenChange={onPocPathogenChange}
                        gyrA={gyrA}
                        onGyrA={setGyrA}
                        fileInputKey={gyrAFileKey}
                        onFileChange={onGyrAFileChange}
                        uploadError={gyrAUploadError}
                        uploadSummary={gyrAUploadSummary}
                      />
                    </fieldset>
                  ) : (
                    <fieldset className="space-y-3 rounded-lg border p-4">
                      <legend className="px-1 text-sm font-medium">
                        POC gyrA test
                      </legend>
                      <p className="text-xs text-muted-foreground">
                        Regional MIC context appears when{" "}
                        <span className="font-medium">Gonorrhea</span> is checked
                        under Confirmed diagnosis.
                      </p>
                      <GyrAPocSection
                        fieldIdPrefix="simple"
                        gyrAPocCompleted={gyrAPocCompleted}
                        onGyrAPocCompleted={onGyrAPocCompletedChange}
                        pocPathogen={pocPathogen}
                        onPocPathogenChange={onPocPathogenChange}
                        gyrA={gyrA}
                        onGyrA={setGyrA}
                        fileInputKey={gyrAFileKey}
                        onFileChange={onGyrAFileChange}
                        uploadError={gyrAUploadError}
                        uploadSummary={gyrAUploadSummary}
                      />
                    </fieldset>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Albumin risk flags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["Recent ICU", icu, setIcu],
                      ["Liver disease", liver, setLiver],
                      ["Malnourished", malnourished, setMalnourished],
                      ["CKD", ckd, setCkd],
                    ].map(([label, checked, set]) => (
                      <div
                        key={label as string}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          id={`alb-${label}`}
                          checked={checked as boolean}
                          onCheckedChange={(c) =>
                            (set as (b: boolean) => void)(c === true)
                          }
                        />
                        <Label
                          htmlFor={`alb-${label}`}
                          className="cursor-pointer font-normal"
                        >
                          {label as string}
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SDOH screener</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["Medication cost", sdohCost, setSdohCost],
                      ["No transport", sdohTransport, setSdohTransport],
                      ["Unstable housing", sdohHousing, setSdohHousing],
                      ["Food insecurity", sdohFood, setSdohFood],
                    ].map(([label, checked, set]) => (
                      <div
                        key={label as string}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          id={`sdoh-${label}`}
                          checked={checked as boolean}
                          onCheckedChange={(c) =>
                            (set as (b: boolean) => void)(c === true)
                          }
                        />
                        <Label
                          htmlFor={`sdoh-${label}`}
                          className="cursor-pointer font-normal"
                        >
                          {label as string}
                        </Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="size-4 shrink-0" aria-hidden />
                  Patient education
                </CardTitle>
                <CardDescription>
                  Health literacy and preferred language shape how you explain
                  the plan, choose handouts, and arrange interpretation.
                  {dxGono
                    ? " With gonorrhea checked, site-specific counseling is previewed below."
                    : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="health-literacy">Health literacy level</Label>
                  <Select
                    value={healthLiteracy}
                    onValueChange={(v) =>
                      setHealthLiteracy(v as HealthLiteracyLevel)
                    }
                  >
                    <SelectTrigger id="health-literacy" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adequate">
                        Adequate — routine materials
                      </SelectItem>
                      <SelectItem value="marginal">
                        Marginal — simplify + teach-back
                      </SelectItem>
                      <SelectItem value="low">
                        Low — minimal print, spoken + visual
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Estimate from conversation, teach-back, or a brief screen;
                    used only to prompt counseling style here.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred-language">Preferred language</Label>
                  <Select
                    value={preferredLanguage}
                    onValueChange={(v) =>
                      setPreferredLanguage(v as PreferredLanguageId)
                    }
                  >
                    <SelectTrigger id="preferred-language" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="mandarin">Mandarin Chinese</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="tagalog">Tagalog</SelectItem>
                      <SelectItem value="vietnamese">Vietnamese</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {preferredLanguage === "other" ? (
                    <Input
                      id="language-other"
                      value={languageOtherSpecify}
                      onChange={(e) => setLanguageOtherSpecify(e.target.value)}
                      placeholder="Specify language"
                      aria-label="Specify preferred language"
                    />
                  ) : null}
                </div>
                </div>
                {dxGono ? (
                  <div className="rounded-md border border-primary/20 bg-muted/30 p-4">
                    <p className="mb-2 text-sm font-medium text-foreground">
                      Gonorrhea sites (feeds handouts &amp; output education)
                    </p>
                    <p className="mb-2 text-xs text-muted-foreground">
                      {formatGonorrheaSitesSummary(gonorrheaSites)}
                    </p>
                    <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                      {gonorrheaSiteEducationBullets(gonorrheaSites).map(
                        (line) => (
                          <li key={line}>{line}</li>
                        ),
                      )}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <ClearanceFormulaPanel
              weightKg={weightKg}
              pgBaseXr={pgBaseXr}
              pgxProfileLabel={pgxMeta.label}
              albuminRiskCount={albuminRiskCount}
            />

            <Button
              type="button"
              size="lg"
              onClick={generate}
              className="h-auto w-full py-4 text-lg"
            >
              GENERATE RECOMMENDATION →
            </Button>
          </div>
        )}

        {view === "output" && (
          <div className="space-y-8">
            <Button type="button" variant="outline" onClick={reset}>
              ← Start over
            </Button>

            <Card
              className="border-emerald-200/80 bg-gradient-to-br from-sky-50 to-emerald-50 shadow-sm dark:from-sky-950/30 dark:to-emerald-950/30"
              aria-live="polite"
            >
              <CardHeader>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active recommendation
                </p>
                <CardTitle className="text-2xl sm:text-3xl">
                  {primaryRecommendationLine}
                </CardTitle>
                <CardDescription className="text-base text-foreground/80">
                  {recommendation.hardStop.active ? (
                    recommendation.hardStop.reason
                  ) : (
                    <>
                      Ceftriaxone C<sub>individual</sub> ≈{" "}
                      {ceftriaxoneCindividualLh} L/h (PGx: {pgxMeta.label}){" "}
                      (C<sub>population</sub> ={" "}
                      {CPOPULATION_LH.ceftriaxoneGonorrhea} L/h,{" "}
                      <NotationPGbaseXR /> = {pgBaseXr}
                      {albuminRiskCount > 0
                        ? `, albumin risk flags = ${albuminRiskCount}`
                        : ""}
                      ). See the allometric table below for the adjusted
                      regimen context.
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-0">
                {capturedContext.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Context captured:{" "}
                    {capturedContext.join(" · ")}
                  </p>
                ) : null}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Primary drug
                    </h3>
                    <p className="font-medium text-foreground">
                      {primaryRecommendationLine}
                    </p>
                    {recommendation.hardStop.active &&
                    recommendation.hardStop.reason ? (
                      <p className="text-sm text-destructive">
                        {recommendation.hardStop.reason}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Co-treatments
                    </h3>
                    {recommendation.coTreatments.length > 0 ? (
                      <ul className="space-y-2 text-sm text-foreground/90">
                        {recommendation.coTreatments.map((drug) => (
                          <li key={formatDrugLabel(drug)}>
                            {formatDrugLabel(drug)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No additional co-treatments generated.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Warnings
                    </h3>
                    {recommendation.warnings.length > 0 ? (
                      <ul className="space-y-2 text-sm text-foreground/90">
                        {recommendation.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No active warnings from the treatment engine.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Context notes
                    </h3>
                    {recommendation.contextNotes.length > 0 ? (
                      <ul className="space-y-2 text-sm text-foreground/90">
                        {recommendation.contextNotes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No extra context notes were generated.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <ClearanceFormulaPanel
              weightKg={weightKg}
              pgBaseXr={pgBaseXr}
              pgxProfileLabel={pgxMeta.label}
              albuminRiskCount={albuminRiskCount}
            />

            {alerts.length > 0 ? (
              <>
                <div className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Alert architecture
                  </h2>

                  {alerts.map((alert) => {
                    const { Icon, variant, className, descriptionClassName } =
                      alertAppearance(alert.severity);

                    return (
                      <Alert
                        key={alert.id}
                        variant={variant}
                        className={className}
                      >
                        <Icon className="size-4" aria-hidden />
                        <AlertTitle>{alert.title}</AlertTitle>
                        <AlertDescription className={descriptionClassName}>
                          {resolveAlertDescription(alert, gonorrheaSites)}
                        </AlertDescription>
                      </Alert>
                    );
                  })}
                </div>

                <Separator />
              </>
            ) : null}

            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Action items
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto flex-col gap-2 border-primary/40 bg-primary/5 py-4 hover:bg-primary/10"
                  onClick={handlePartnerEptHandoutPdf}
                >
                  <Users className="size-5" aria-hidden />
                  Partner EPT (PDF)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto flex-col gap-2 border-primary/40 bg-primary/5 py-4 hover:bg-primary/10"
                  onClick={handlePatientHandoutPdf}
                >
                  <FileText className="size-5" aria-hidden />
                  Patient handout (PDF)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => showPlannedFeature("Retest reminder")}
                >
                  <Calendar className="size-5" aria-hidden />
                  Retest reminder
                </Button>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <BookOpen className="size-4" aria-hidden />
                Patient education (conclusion)
              </h2>
              <Card className="border-primary/20 bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Counseling &amp; materials checklist
                  </CardTitle>
                  <CardDescription>
                    Based on the literacy and language selections from intake.
                    {dxGono
                      ? " Gonorrhea site choices below tailor testing and counseling language."
                      : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  {dxGono ? (
                    <div className="sm:col-span-2 rounded-md border border-primary/25 bg-background/80 p-4">
                      <p className="mb-2 text-sm font-medium text-foreground">
                        Gonorrhea — anatomic site counseling
                      </p>
                      <p className="mb-2 text-xs text-muted-foreground">
                        {formatGonorrheaSitesSummary(gonorrheaSites)}
                      </p>
                      <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                        {gonorrheaSiteEducationBullets(gonorrheaSites).map(
                          (line) => (
                            <li key={line}>{line}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  ) : null}
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">
                      Preferred language:{" "}
                      <span className="font-semibold">
                        {preferredLanguageDisplayName(
                          preferredLanguage,
                          languageOtherSpecify,
                        )}
                      </span>
                    </p>
                    <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                      {languageEducationBullets.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">
                      Health literacy:{" "}
                      <span className="font-semibold capitalize">
                        {healthLiteracy}
                      </span>
                    </p>
                    <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
                      {literacyEducationBullets.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        )}
        </TabsContent>
      </main>

      <footer className="border-t bg-background py-6 text-center text-xs text-muted-foreground">
        DOODLE · derived from PrecisionSTI CDSS spec · no Monte Carlo layer
      </footer>
    </Tabs>
  );
}
