import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Info,
  Pill,
  Users,
} from "lucide-react";
import { type ChangeEvent, useMemo, useState } from "react";
import { AdherenceScreener } from "./AdherenceScreener";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
<<<<<<< HEAD
  CPOPULATION_LH,
=======
  PGX_PROFILE_IDS,
  type PgxProfileId,
>>>>>>> f320e1c (feat: ui update)
  clearanceRowsForPatient,
  getPgxProfileMeta,
} from "./clearance";
import {
  DEFAULT_HOST_PGX_PERSONA_ID,
  HOST_PGX_PERSONAS,
  type HostPgxPersonaId,
  getHostPgxPersona,
  isHostPgxPersonaId,
} from "./hostPgxPersonas";
import {
  US_STATE_CODES,
  calculateMIC90,
  getGonorrheaMicDistribution,
  getRegionForState,
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
import { cn } from "@/lib/utils";

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
type WizardStep = 1 | 2 | 3 | 4 | 5;

type Allergy = "none" | "low" | "high";
type GyrA = "not-tested" | "wild" | "mutant";

type GyrAUploadSummary = {
  mismatches: number;
  mutant: boolean;
  pathogen: PocPathogenId;
};

const WIZARD_STEPS: Array<{
  id: WizardStep;
  title: string;
  subtitle: string;
}> = [
  { id: 1, title: "Patient profile", subtitle: "Baseline context" },
  { id: 2, title: "Diagnosis", subtitle: "Confirmed conditions" },
  { id: 3, title: "Risk and context", subtitle: "Modifiers and barriers" },
  { id: 4, title: "Education and review", subtitle: "Readiness check" },
  { id: 5, title: "Recommendation", subtitle: "Generate output" },
];

const ALLERGY_LABEL: Record<Allergy, string> = {
  none: "None",
  low: "Low-risk PCN / cephalosporin",
  high: "High-risk PCN / cephalosporin",
};

const GYRA_LABEL: Record<GyrA, string> = {
  "not-tested": "Not tested",
  wild: "Wild-type",
  mutant: "Mutant",
};

const HEALTH_LITERACY_LABEL: Record<HealthLiteracyLevel, string> = {
  adequate: "Adequate",
  marginal: "Marginal",
  low: "Low",
};

const DIAGNOSIS_OPTIONS: Array<{
  key: keyof RecommendationInput["diagnoses"];
  title: string;
  description: string;
}> = [
  {
    key: "gonorrhea",
    title: "Gonorrhea",
    description: "Unlocks gyrA and regional MIC context.",
  },
  {
    key: "chlamydia",
    title: "Chlamydia",
    description: "Co-treatment considerations appear in the output.",
  },
  {
    key: "syphilis",
    title: "Syphilis",
    description: "Adds benzathine penicillin pathway checks.",
  },
  {
    key: "trichomoniasis",
    title: "Trichomoniasis",
    description: "Surfaces metronidazole planning.",
  },
];

const ALBUMIN_FLAGS: Array<{
  key: "icu" | "liver" | "malnourished" | "ckd";
  title: string;
  description: string;
}> = [
  {
    key: "icu",
    title: "Recent ICU",
    description: "Recent critical illness can distort protein binding.",
  },
  {
    key: "malnourished",
    title: "Malnourished",
    description: "Low nutrition can change drug distribution and binding.",
  },
  {
    key: "liver",
    title: "Liver disease",
    description: "Hepatic dysfunction can alter total and free exposure.",
  },
  {
    key: "ckd",
    title: "CKD",
    description: "Renal disease can change albumin and clearance assumptions.",
  },
];

const SDOH_FLAGS: Array<{
  key: "sdohCost" | "sdohHousing" | "sdohTransport" | "sdohFood";
  title: string;
  description: string;
}> = [
  {
    key: "sdohCost",
    title: "Medication cost",
    description: "Budget pressure may affect fill rates and adherence.",
  },
  {
    key: "sdohHousing",
    title: "Unstable housing",
    description: "Storage and follow-up planning may need simplification.",
  },
  {
    key: "sdohTransport",
    title: "No transport",
    description: "Follow-up access and multi-dose regimens become harder.",
  },
  {
    key: "sdohFood",
    title: "Food insecurity",
    description: "Counseling may need practical, lower-friction options.",
  },
];

const POC_PATHOGEN_LABEL: Record<PocPathogenId, string> = {
  gonorrhea: "Gonorrhea (demo reference)",
  syphilis: "Syphilis (demo reference)",
  chlamydia: "Chlamydia (demo reference)",
};

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
        className: "border-border bg-muted/70",
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

function SummaryRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-right text-sm font-medium",
          muted && "text-muted-foreground font-normal",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function WizardStepButton({
  step,
  title,
  subtitle,
  active,
  completed,
  disabled,
  onClick,
}: {
  step: number;
  title: string;
  subtitle: string;
  active: boolean;
  completed: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-3 text-left transition",
        active
          ? "bg-background text-foreground shadow-sm ring-1 ring-border"
          : completed
            ? "bg-muted/70 text-foreground hover:bg-muted"
            : "text-muted-foreground hover:bg-muted/50",
        disabled && "cursor-default opacity-100",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : completed
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-border bg-background",
        )}
      >
        {completed && !active ? (
          <CheckCircle2 className="size-4" aria-hidden />
        ) : (
          step
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {subtitle}
        </span>
      </span>
    </button>
  );
}

function DiagnosisOption({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group flex min-h-24 flex-col rounded-2xl border px-4 py-4 text-left transition",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border/70 bg-background hover:border-border hover:bg-muted/30",
      )}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{title}</span>
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full border text-[11px] transition",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-transparent group-hover:border-muted-foreground",
          )}
        >
          <CheckCircle2 className="size-3.5" aria-hidden />
        </span>
      </span>
      <span className="mt-2 text-sm text-muted-foreground">{description}</span>
    </button>
  );
}

function FlagRow({
  id,
  title,
  description,
  checked,
  onChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-3 transition hover:bg-muted/40",
        checked && "bg-primary/5",
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        className="mt-0.5"
      />
      <span className="space-y-1">
        <span className="block text-sm font-medium text-foreground">
          {title}
        </span>
        <span className="block text-xs leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

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
  pocMicState,
  onPocMicStateChange,
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
  pocMicState: UsStateCode;
  onPocMicStateChange: (v: UsStateCode) => void;
}) {
  return (
    <div className="space-y-4 rounded-3xl bg-muted/35 p-4">
      <label
        htmlFor={`${fieldIdPrefix}-poc-done`}
        className="flex cursor-pointer items-start gap-3 rounded-2xl bg-background/80 px-3 py-3"
      >
        <Checkbox
          id={`${fieldIdPrefix}-poc-done`}
          checked={gyrAPocCompleted}
          onCheckedChange={(c) => onGyrAPocCompleted(c === true)}
          className="mt-0.5"
        />
        <span className="space-y-1">
          <span className="block text-sm font-medium">
            POC test completed — I have a result file to compare
          </span>
          <span className="block text-xs leading-relaxed text-muted-foreground">
            Use this when a file is available. If not, keep manual gyrA status
            below.
          </span>
        </span>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${fieldIdPrefix}-manual`} className="text-sm">
            Manual gyrA status
          </Label>
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

        <div className="space-y-2">
          <Label htmlFor={`${fieldIdPrefix}-poc-pathogen`} className="text-sm">
            POC file reference
          </Label>
          <Select
            value={pocPathogen}
            onValueChange={(v) => onPocPathogenChange(v as PocPathogenId)}
          >
            <SelectTrigger id={`${fieldIdPrefix}-poc-pathogen`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(POC_PATHOGEN_LABEL) as PocPathogenId[]).map((id) => (
                <SelectItem key={id} value={id}>
                  {POC_PATHOGEN_LABEL[id]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {gyrAPocCompleted ? (
        <div className="space-y-3 rounded-2xl bg-background/80 p-4">
          <div className="space-y-1">
            <Label htmlFor={`${fieldIdPrefix}-file`} className="text-sm">
              Upload result file
            </Label>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Accepted format: plain text, one row per position 1-500 with base
              calls. Compare against the demo reference for{" "}
              {POC_PATHOGEN_LABEL[pocPathogen]}.
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
              className="text-primary underline underline-offset-2"
              href={`/poc-examples/${pocPathogen}_poc_wild.txt`}
              download
            >
              Example file: wild
            </a>
            <a
              className="text-primary underline underline-offset-2"
              href={`/poc-examples/${pocPathogen}_poc_resistant.txt`}
              download
            >
              Example file: resistant
            </a>
          </div>
          {uploadError ? (
            <p className="text-sm text-destructive">{uploadError}</p>
          ) : uploadSummary ? (
            <p className="text-sm text-muted-foreground">
              {uploadSummary.mismatches === 0
                ? `Matches the demo reference for ${POC_PATHOGEN_LABEL[uploadSummary.pathogen]}.`
                : uploadSummary.pathogen === "gonorrhea"
                  ? `${uploadSummary.mismatches} SNP(s) vs gonorrhea demo reference.`
                  : `${uploadSummary.mismatches} SNP(s) vs ${POC_PATHOGEN_LABEL[uploadSummary.pathogen]}.`}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Upload a file to compare against the selected reference.
            </p>
          )}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${fieldIdPrefix}-mic-state`} className="text-sm">
          State for regional MIC routing
        </Label>
        <Select value={pocMicState} onValueChange={(v) => onPocMicStateChange(v as UsStateCode)}>
          <SelectTrigger id={`${fieldIdPrefix}-mic-state`} className="w-full">
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
        <p className="text-xs text-muted-foreground">
          Used only for gonorrhea MIC context in the demo model.
        </p>
      </div>
    </div>
  );
}

function ClearanceTable({
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
    <Card className="border-border/60 bg-white/90 shadow-none">
      <CardHeader className="space-y-2">
        <CardTitle className="text-base">Allometric clearance snapshot</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          <details className="group">
            <summary className="flex cursor-pointer items-center gap-2 text-sm text-foreground/80">
              <Info className="size-4 shrink-0 text-muted-foreground" />
              How this is calculated
            </summary>
            <div className="mt-2 max-w-3xl text-sm text-muted-foreground">
              C<sub>individual</sub> = C<sub>population</sub> × (W / 70)
              <sup>0.75</sup> × <NotationPGbaseXR />. PGx profile:
              <span className="font-medium text-foreground">
                {" "}
                {pgxProfileLabel}
              </span>
              .{" "}
              {albuminRiskCount > 0
                ? `Albumin adjustment is applied from ${albuminRiskCount} risk flag(s), increasing modeled clearance by ${albuminAdjustmentPercent}%.`
                : "No albumin adjustment is applied."}
            </div>
          </details>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/35 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Drug</th>
                <th className="px-4 py-3 text-left font-medium">Context</th>
                <th className="px-4 py-3 text-right font-medium tabular-nums">
                  C<sub>population</sub>
                </th>
                <th className="px-4 py-3 text-right font-medium tabular-nums">
                  C<sub>individual</sub>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((row) => (
                <tr key={row.drug} className="align-top">
                  <td className="px-4 py-4">
                    <div className="text-sm font-semibold text-foreground">
                      {row.drug}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {row.indication}
                  </td>
                  <td className="px-4 py-4 text-right text-sm tabular-nums text-muted-foreground">
                    {row.cpopulationLh} L/h
                  </td>
                  <td className="px-4 py-4 text-right text-base font-semibold tabular-nums text-foreground">
                    {row.cindividualLh} L/h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function formatSelectedDiagnoses(diagnoses: RecommendationInput["diagnoses"]) {
  return DIAGNOSIS_OPTIONS.filter((option) => diagnoses[option.key]).map(
    (option) => option.title,
  );
}

function formatFlagSummary(flags: string[]) {
  return flags.length > 0 ? flags.join(" · ") : "None selected";
}

function getGyrAStatusSummary({
  dxGono,
  gyrAPocCompleted,
  gyrAUploadSummary,
  gyrA,
}: {
  dxGono: boolean;
  gyrAPocCompleted: boolean;
  gyrAUploadSummary: GyrAUploadSummary | null;
  gyrA: GyrA;
}) {
  if (!dxGono) return "Not relevant";
  if (gyrAPocCompleted) {
    if (gyrAUploadSummary) {
      return gyrAUploadSummary.mismatches === 0
        ? "POC file matched demo reference"
        : `${gyrAUploadSummary.mismatches} SNP(s) vs demo reference`;
    }
    return "Awaiting file upload";
  }
  return GYRA_LABEL[gyrA];
}

function getRecommendationBlockers({
  dxGono,
  dxChlam,
  dxSyph,
  dxTrich,
  gyrAPocCompleted,
  gyrAUploadError,
  gyrAUploadSummary,
  preferredLanguage,
  languageOtherSpecify,
}: {
  dxGono: boolean;
  dxChlam: boolean;
  dxSyph: boolean;
  dxTrich: boolean;
  gyrAPocCompleted: boolean;
  gyrAUploadError: string | null;
  gyrAUploadSummary: GyrAUploadSummary | null;
  preferredLanguage: PreferredLanguageId;
  languageOtherSpecify: string;
}) {
  const blockers: string[] = [];
  if (!dxGono && !dxChlam && !dxSyph && !dxTrich) {
    blockers.push("Select at least one confirmed diagnosis.");
  }
  if (preferredLanguage === "other" && !languageOtherSpecify.trim()) {
    blockers.push("Specify the preferred language.");
  }
  if (gyrAPocCompleted && !gyrAUploadSummary && !gyrAUploadError) {
    blockers.push("Upload a POC result file or uncheck the file-comparison option.");
  }
  if (gyrAUploadError) {
    blockers.push("Resolve the POC upload error before generating.");
  }
  return blockers;
}

export default function App() {
  const [section, setSection] = useState<AppSection>("dosing");
  const [step, setStep] = useState<WizardStep>(1);
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);
  const [generated, setGenerated] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const [weightKg, setWeightKg] = useState(78);
  const [pregnant, setPregnant] = useState(false);
  const [allergy, setAllergy] = useState<Allergy>("none");
  const [hostPgxPersonaId, setHostPgxPersonaId] = useState<HostPgxPersonaId>(
    DEFAULT_HOST_PGX_PERSONA_ID,
  );
  const hostPersona = useMemo(
    () => getHostPgxPersona(hostPgxPersonaId),
    [hostPgxPersonaId],
  );
  const pgx = hostPersona.pgxProfile;
  const [gyrA, setGyrA] = useState<GyrA>("not-tested");
  const [gyrAPocCompleted, setGyrAPocCompleted] = useState(false);
  const [gyrAUploadError, setGyrAUploadError] = useState<string | null>(null);
  const [gyrAUploadSummary, setGyrAUploadSummary] =
    useState<GyrAUploadSummary | null>(null);
  const [gyrAFileKey, setGyrAFileKey] = useState(0);
  const [pocPathogen, setPocPathogen] = useState<PocPathogenId>("gonorrhea");
  /** State of care/residence for gonorrhea MIC routing in this demo. */
  const [pocMicState, setPocMicState] = useState<UsStateCode>("NY");

  const [dxGono, setDxGono] = useState(false);
  const [gonorrheaSites, setGonorrheaSites] = useState<GonorrheaSites>(
    EMPTY_GONORRHEA_SITES,
  );
  const [dxChlam, setDxChlam] = useState(false);
  const [dxSyph, setDxSyph] = useState(false);
  const [dxTrich, setDxTrich] = useState(false);

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

  const surveillanceRegion = useMemo(
    () => (dxGono ? getRegionForState(pocMicState) : null),
    [dxGono, pocMicState],
  );
  const gonorrheaMic90 = useMemo(() => {
    if (!dxGono || !surveillanceRegion) return null;
    return calculateMIC90(getGonorrheaMicDistribution(surveillanceRegion));
  }, [dxGono, surveillanceRegion]);

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
  const clearanceRows = useMemo(
    () => clearanceRowsForPatient(weightKg, pgBaseXr, albuminRiskCount),
    [weightKg, pgBaseXr, albuminRiskCount],
  );
  const ceftriaxoneCindividualLh = clearanceRows[0]?.cindividualLh ?? 0;

  const alertsInput: AlertInput = {
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
  const alerts = generateAlerts(alertsInput);

  const literacyEducationBullets = useMemo(
    () => literacyCounselingPoints(healthLiteracy),
    [healthLiteracy],
  );
  const languageEducationBullets = useMemo(
    () => languageCounselingPoints(preferredLanguage, languageOtherSpecify),
    [preferredLanguage, languageOtherSpecify],
  );
  const blockers = useMemo(
    () =>
      getRecommendationBlockers({
        dxGono,
        dxChlam,
        dxSyph,
        dxTrich,
        gyrAPocCompleted,
        gyrAUploadError,
        gyrAUploadSummary,
        preferredLanguage,
        languageOtherSpecify,
      }),
    [
      dxGono,
      dxChlam,
      dxSyph,
      dxTrich,
      gyrAPocCompleted,
      gyrAUploadError,
      gyrAUploadSummary,
      preferredLanguage,
      languageOtherSpecify,
    ],
  );
  const readyToGenerate = blockers.length === 0;

  function markStepComplete(currentStep: WizardStep) {
    setCompletedSteps((prev) =>
      prev.includes(currentStep) ? prev : [...prev, currentStep],
    );
  }

  function validateStep(currentStep: WizardStep) {
    const issues: string[] = [];
    if (currentStep === 2 && !dxGono && !dxChlam && !dxSyph && !dxTrich) {
      issues.push("Pick at least one confirmed diagnosis.");
    }
    if (currentStep === 4 && preferredLanguage === "other" && !languageOtherSpecify.trim()) {
      issues.push("Specify the preferred language.");
    }
    if (currentStep === 2 && gyrAPocCompleted && !gyrAUploadSummary && gyrAUploadError) {
      issues.push("Fix the POC upload before continuing.");
    }
    return issues;
  }

  function moveNext() {
    if (step === 5) {
      if (!readyToGenerate) {
        setStepError(blockers[0] ?? "Complete the remaining required items.");
        return;
      }
      setStepError(null);
      setGenerated(true);
      markStepComplete(5);
      return;
    }

    const issues = validateStep(step);
    if (issues.length > 0) {
      setStepError(issues[0]);
      return;
    }

    setStepError(null);
    markStepComplete(step);
    setStep((current) => Math.min(5, current + 1) as WizardStep);
  }

  function moveBack() {
    setStepError(null);
    setStep((current) => Math.max(1, current - 1) as WizardStep);
  }

  function selectStep(nextStep: WizardStep) {
    if (nextStep <= step) {
      setStepError(null);
      setStep(nextStep);
    }
  }

  function onGyrAPocCompletedChange(value: boolean) {
    setGyrAPocCompleted(value);
    if (!value) {
      setGyrAUploadError(null);
      setGyrAUploadSummary(null);
      setGyrAFileKey((current) => current + 1);
    }
  }

  function onPocPathogenChange(value: PocPathogenId) {
    setPocPathogen(value);
    setGyrAUploadError(null);
    setGyrAUploadSummary(null);
    setGyrAFileKey((current) => current + 1);
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

        const { mismatchCount } = comparePocSampleToRef(parsed.bases, pocPathogen);
        setGyrAUploadSummary({
          mismatches: mismatchCount,
          mutant: mismatchCount > 0,
          pathogen: pocPathogen,
        });
      })
      .catch(() => setGyrAUploadError("Could not read file."));
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
      mainLine: recommendation.hardStop.active
        ? recommendation.hardStop.reason ?? primaryRecommendationLine
        : primaryRecommendationLine,
      dxGono,
      gonoSites: gonorrheaSites,
      dxChlam,
      dxSyph,
      dxTrich,
      pregnant,
      weightKg,
      ceftriaxoneCindividualLh,
      ceftriaxoneDoseLabel:
        !recommendation.hardStop.active &&
        dxGono &&
        recommendation.primaryDrug.name === "Ceftriaxone"
          ? recommendation.primaryDrug.dose
          : undefined,
      pgxLabel: `${hostPersona.name} — ${pgxMeta.label}`,
      preferredLanguageLabel: preferredLanguageDisplayName(
        preferredLanguage,
        languageOtherSpecify,
      ),
    });
  }

  const diagnosisSummary = formatSelectedDiagnoses(recommendationInput.diagnoses);
  const albuminSummary = formatFlagSummary(
    ALBUMIN_FLAGS.filter((flag) => alertsInput[flag.key]).map((flag) => flag.title),
  );
  const sdohSummary = formatFlagSummary(
    SDOH_FLAGS.filter((flag) => alertsInput[flag.key]).map((flag) => flag.title),
  );
  const readinessLabel = readyToGenerate ? "Ready to generate" : "Needs review";
  const selectedLanguage = preferredLanguageDisplayName(
    preferredLanguage,
    languageOtherSpecify,
  );
  const currentStepMeta = WIZARD_STEPS[step - 1];

  return (
    <Tabs
      value={section}
      onValueChange={(value) => setSection(value as AppSection)}
      className="min-h-screen"
    >
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(224,242,254,0.8),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(236,253,245,0.55),_transparent_26%),linear-gradient(180deg,_hsl(var(--background)),_hsl(210_40%_98%))]">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Clinical decision support
                  </p>
                  <Badge
                    variant="outline"
                    className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-amber-800"
                  >
                    Demo UI — not for clinical use
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    DOODLE
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    STI dosing and pathway checks in a guided five-step workflow
                    that keeps inputs, modifiers, and recommendations easy to
                    scan.
                  </p>
                </div>
              </div>

              <TabsList className="h-auto w-full rounded-full bg-muted/70 p-1 shadow-sm lg:w-auto">
                <TabsTrigger
                  value="dosing"
                  className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Pill className="size-4" aria-hidden />
                  Treatment dosing
                </TabsTrigger>
                <TabsTrigger
                  value="adherence"
                  className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <ClipboardList className="size-4" aria-hidden />
                  Adherence check (patient)
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <TabsContent value="adherence" className="mt-0 outline-none">
            <div className="mx-auto max-w-5xl">
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
            </div>
          </TabsContent>

          <TabsContent value="dosing" className="mt-0 outline-none">
            <div className="space-y-6">
              <div className="sticky top-24 z-20 rounded-3xl border border-border/60 bg-background/85 p-4 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.32)] backdrop-blur-xl">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Workflow progress
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Step {step} of 5
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full px-3 py-1",
                        readyToGenerate
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700",
                      )}
                    >
                      {step === 5 && generated ? "Recommendation generated" : readinessLabel}
                    </Badge>
                  </div>
<<<<<<< HEAD

                  <div className="space-y-2">
                    <Label htmlFor="host-pgx-persona">Host (PGx)</Label>
                    <Select
                      value={hostPgxPersonaId}
                      onValueChange={(v) => {
                        if (isHostPgxPersonaId(v)) setHostPgxPersonaId(v);
                      }}
                    >
                      <SelectTrigger id="host-pgx-persona" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOST_PGX_PERSONAS.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/90">
                        {hostPersona.name}
                      </span>
                      : {pgxMeta.label}.{" "}
                      <NotationPGbaseXR className="font-medium text-foreground/80" />{" "}
                      = {pgBaseXr}, scaling C<sub>individual</sub> in{" "}
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
=======
                  <Progress value={((step - 1) / 4) * 100} className="h-2" />
                  <div className="grid gap-2 md:grid-cols-5">
                    {WIZARD_STEPS.map((wizardStep) => (
                      <WizardStepButton
                        key={wizardStep.id}
                        step={wizardStep.id}
                        title={wizardStep.title}
                        subtitle={wizardStep.subtitle}
                        active={step === wizardStep.id}
                        completed={completedSteps.includes(wizardStep.id) || step > wizardStep.id}
                        disabled={wizardStep.id > step}
                        onClick={() => selectStep(wizardStep.id)}
>>>>>>> f320e1c (feat: ui update)
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="space-y-6">
                  <Card className="border-border/60 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.36)]">
                    <CardHeader className="space-y-3 border-b border-border/50 pb-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-2">
                          <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                            Step {step}
                          </Badge>
                          <CardTitle className="text-2xl tracking-tight">
                            {currentStepMeta.title}
                          </CardTitle>
                          <CardDescription className="max-w-2xl text-base leading-6">
                            {currentStepMeta.subtitle}
                          </CardDescription>
                        </div>

                        {step === 5 ? (
                          <CardAction className="self-start">
                            <Button
                              type="button"
                              size="lg"
                              onClick={moveNext}
                              className="gap-2 rounded-full px-5"
                              disabled={!readyToGenerate}
                            >
                              {generated ? "Regenerate recommendation" : "Generate recommendation"}
                              <ChevronRight className="size-4" aria-hidden />
                            </Button>
                          </CardAction>
                        ) : null}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-8 pt-6">
                      {stepError ? (
                        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
                          <AlertTriangle className="size-4" aria-hidden />
                          <AlertTitle>Review needed</AlertTitle>
                          <AlertDescription className="text-amber-900">
                            {stepError}
                          </AlertDescription>
                        </Alert>
                      ) : null}

                      {step === 1 ? (
                        <div className="grid gap-6">
                          <section className="grid gap-5">
                            <div className="space-y-2">
                              <Label htmlFor="allergy" className="text-sm font-medium">
                                Allergy profile
                              </Label>
                              <Select
                                value={allergy}
                                onValueChange={(value) => setAllergy(value as Allergy)}
                              >
                                <SelectTrigger id="allergy" className="w-full rounded-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  <SelectItem value="low">
                                    Low-risk PCN / cephalosporin
                                  </SelectItem>
                                  <SelectItem value="high">
                                    High-risk PCN / cephalosporin
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <Label htmlFor="pgx" className="text-sm font-medium">
                                  Host PGx profile
                                </Label>
                                <details className="group text-right">
                                  <summary className="cursor-pointer text-xs font-medium text-primary">
                                    How this is calculated
                                  </summary>
                                  <div className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">
                                    The PGx profile sets <NotationPGbaseXR /> in the
                                    clearance model. Lower values reduce modeled
                                    clearance; higher values shift it upward.
                                  </div>
                                </details>
                              </div>
                              <Select
                                value={pgx}
                                onValueChange={(value) => setPgx(value as PgxProfileId)}
                              >
                                <SelectTrigger id="pgx" className="w-full rounded-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PGX_PROFILE_IDS.map((id) => {
                                    const meta = getPgxProfileMeta(id);
                                    return (
                                      <SelectItem key={id} value={id}>
                                        {meta.label} · <NotationPGbaseXR /> = {meta.pgBaseXr}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid gap-4 rounded-3xl bg-muted/35 p-4">
                              <div className="flex items-baseline justify-between gap-3">
                                <Label htmlFor="weight-slider" className="text-sm font-medium">
                                  Weight
                                </Label>
                                <span className="text-sm font-semibold tabular-nums text-foreground">
                                  {weightKg} kg
                                </span>
                              </div>
                              <Slider
                                id="weight-slider"
                                min={40}
                                max={200}
                                step={1}
                                value={[weightKg]}
                                onValueChange={(values) => setWeightKg(values[0] ?? 40)}
                              />
                              <Input
                                type="number"
                                min={40}
                                max={200}
                                value={weightKg}
                                onChange={(event) => {
                                  const nextValue = Number(event.target.value);
                                  if (Number.isFinite(nextValue)) {
                                    setWeightKg(Math.min(200, Math.max(40, nextValue)));
                                  }
                                }}
                                className="w-32 rounded-xl"
                                aria-label="Weight in kilograms"
                              />
                            </div>

                            <div className="flex items-center justify-between rounded-3xl bg-muted/35 px-4 py-4">
                              <div className="space-y-1">
                                <Label htmlFor="preg" className="cursor-pointer text-sm font-medium">
                                  Pregnancy status
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  Drives pathway cautions and counseling language.
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <Switch id="preg" checked={pregnant} onCheckedChange={setPregnant} />
                                <span className="text-sm font-medium text-muted-foreground">
                                  {pregnant ? "Yes" : "No"}
                                </span>
                              </div>
                            </div>
                          </section>
                        </div>
                      ) : null}

                      {step === 2 ? (
                        <div className="space-y-6">
                          <section className="space-y-4">
                            <div className="space-y-1">
                              <h3 className="text-lg font-semibold tracking-tight">
                                Confirmed diagnosis
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Select every confirmed diagnosis. Gonorrhea opens the
                                POC gyrA section below.
                              </p>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              {DIAGNOSIS_OPTIONS.map((option) => (
                                <DiagnosisOption
                                  key={option.key}
                                  title={option.title}
                                  description={option.description}
                                  selected={recommendationInput.diagnoses[option.key]}
                                  onClick={() => {
                                    const setterMap: Record<
                                      keyof RecommendationInput["diagnoses"],
                                      (value: boolean) => void
                                    > = {
                                      gonorrhea: (value) => {
                                        setDxGono(value);
                                        if (!value) setGonorrheaSites(EMPTY_GONORRHEA_SITES);
                                      },
                                      chlamydia: setDxChlam,
                                      syphilis: setDxSyph,
                                      trichomoniasis: setDxTrich,
                                    };

                                    setterMap[option.key](
                                      !recommendationInput.diagnoses[option.key],
                                    );
                                  }}
                                />
                              ))}
                            </div>
                          </section>

                          {dxGono ? (
                            <section className="space-y-4 rounded-3xl border border-border/60 bg-muted/20 p-4">
                              <div className="space-y-1">
                                <h3 className="text-base font-semibold tracking-tight">
                                  Gonorrhea support data
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Keep this section visually separate from the primary
                                  diagnosis chips.
                                </p>
                              </div>

                              <div className="grid gap-4">
                                <div className="space-y-2 rounded-2xl bg-background/80 p-4">
                                  <p className="text-sm font-medium text-foreground">
                                    Anatomical sites
                                  </p>
                                  <div className="grid gap-2 sm:grid-cols-3">
                                    {(
                                      [
                                        "urogenital",
                                        "rectal",
                                        "pharyngeal",
                                      ] as GonorrheaSiteId[]
                                    ).map((site) => (
                                      <label
                                        key={site}
                                        htmlFor={`gono-site-${site}`}
                                        className="flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-3 hover:bg-muted/40"
                                      >
                                        <Checkbox
                                          id={`gono-site-${site}`}
                                          checked={gonorrheaSites[site]}
                                          onCheckedChange={(value) =>
                                            setGonorrheaSites((prev) => ({
                                              ...prev,
                                              [site]: value === true,
                                            }))
                                          }
                                          className="mt-0.5"
                                        />
                                        <span className="space-y-1">
                                          <span className="block text-sm font-medium">
                                            {GONORRHEA_SITE_META[site].label}
                                          </span>
                                          <span className="block text-xs text-muted-foreground">
                                            {site === "pharyngeal"
                                              ? "Higher-scrutiny site for counseling."
                                              : "Useful for targeted counseling and swab planning."}
                                          </span>
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

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
                                  pocMicState={pocMicState}
                                  onPocMicStateChange={setPocMicState}
                                />
                              </div>
                            </section>
                          ) : null}
                        </div>
                      ) : null}

                      {step === 3 ? (
                        <div className="grid gap-6 lg:grid-cols-2">
                          <section className="space-y-4 rounded-3xl bg-muted/25 p-4">
                            <div className="space-y-1">
                              <h3 className="text-lg font-semibold tracking-tight">
                                Albumin risk flags
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                These modifiers can change modeled exposure and
                                interpretation.
                              </p>
                            </div>
                            <div className="grid gap-1">
                              {ALBUMIN_FLAGS.map((flag) => (
                                <FlagRow
                                  key={flag.key}
                                  id={`alb-${flag.key}`}
                                  title={flag.title}
                                  description={flag.description}
                                  checked={alertsInput[flag.key]}
                                  onChange={(value) => {
                                    const setterMap = {
                                      icu: setIcu,
                                      liver: setLiver,
                                      malnourished: setMalnourished,
                                      ckd: setCkd,
                                    } as const;
                                    setterMap[flag.key](value);
                                  }}
                                />
                              ))}
                            </div>
                          </section>

                          <section className="space-y-4 rounded-3xl bg-muted/25 p-4">
                            <div className="space-y-1">
                              <h3 className="text-lg font-semibold tracking-tight">
                                SDOH screener
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                These flags help the demo model highlight barriers
                                that may affect completion.
                              </p>
                            </div>
                            <div className="grid gap-1">
                              {SDOH_FLAGS.map((flag) => (
                                <FlagRow
                                  key={flag.key}
                                  id={`sdoh-${flag.key}`}
                                  title={flag.title}
                                  description={flag.description}
                                  checked={alertsInput[flag.key]}
                                  onChange={(value) => {
                                    const setterMap = {
                                      sdohCost: setSdohCost,
                                      sdohHousing: setSdohHousing,
                                      sdohTransport: setSdohTransport,
                                      sdohFood: setSdohFood,
                                    } as const;
                                    setterMap[flag.key](value);
                                  }}
                                />
                              ))}
                            </div>
                          </section>
                        </div>
                      ) : null}

                      {step === 4 ? (
                        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                          <section className="space-y-4">
                            <div className="space-y-1">
                              <h3 className="text-lg font-semibold tracking-tight">
                                Education preferences
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Keep this step short. It mainly shapes how the final
                                counseling copy reads.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="health-literacy" className="text-sm font-medium">
                                Health literacy
                              </Label>
                              <Select
                                value={healthLiteracy}
                                onValueChange={(value) =>
                                  setHealthLiteracy(value as HealthLiteracyLevel)
                                }
                              >
                                <SelectTrigger
                                  id="health-literacy"
                                  className="w-full rounded-xl"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="adequate">
                                    Adequate - routine materials
                                  </SelectItem>
                                  <SelectItem value="marginal">
                                    Marginal - simplify + teach-back
                                  </SelectItem>
                                  <SelectItem value="low">
                                    Low - minimal print, spoken + visual
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="preferred-language" className="text-sm font-medium">
                                Preferred language
                              </Label>
                              <Select
                                value={preferredLanguage}
                                onValueChange={(value) =>
                                  setPreferredLanguage(value as PreferredLanguageId)
                                }
                              >
                                <SelectTrigger
                                  id="preferred-language"
                                  className="w-full rounded-xl"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="english">English</SelectItem>
                                  <SelectItem value="spanish">Spanish</SelectItem>
                                  <SelectItem value="mandarin">
                                    Mandarin Chinese
                                  </SelectItem>
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
                                  onChange={(event) =>
                                    setLanguageOtherSpecify(event.target.value)
                                  }
                                  placeholder="Specify language"
                                  aria-label="Specify preferred language"
                                  className="rounded-xl"
                                />
                              ) : null}
                            </div>
                          </section>

                          <section className="space-y-4 rounded-3xl bg-muted/25 p-4">
                            <div className="space-y-1">
                              <h3 className="text-lg font-semibold tracking-tight">
                                Review
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Confirm what is already in the chart before you
                                generate.
                              </p>
                            </div>

                            <dl className="divide-y divide-border/60 rounded-2xl bg-background/80 px-4">
                              <SummaryRow label="Allergy profile" value={ALLERGY_LABEL[allergy]} />
                              <SummaryRow label="PGx profile" value={pgxMeta.label} />
                              <SummaryRow label="Weight" value={`${weightKg} kg`} />
                              <SummaryRow
                                label="Pregnancy"
                                value={pregnant ? "Yes" : "No"}
                              />
                              <SummaryRow
                                label="Diagnoses"
                                value={
                                  diagnosisSummary.length > 0
                                    ? diagnosisSummary.join(" · ")
                                    : "None selected"
                                }
                                muted={diagnosisSummary.length === 0}
                              />
                              <SummaryRow
                                label="POC gyrA"
                                value={getGyrAStatusSummary({
                                  dxGono,
                                  gyrAPocCompleted,
                                  gyrAUploadSummary,
                                  gyrA,
                                })}
                              />
                              <SummaryRow label="Albumin flags" value={albuminSummary} />
                              <SummaryRow label="SDOH flags" value={sdohSummary} />
                              <SummaryRow label="Language" value={selectedLanguage} />
                              <SummaryRow
                                label="Readiness"
                                value={readyToGenerate ? "Ready" : "Needs review"}
                              />
                            </dl>

                            <div className="space-y-3">
                              <p className="text-sm font-medium text-foreground">
                                Special considerations
                              </p>
                              {alerts.length > 0 ? (
                                <div className="space-y-3">
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
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No active warnings surfaced yet.
                                </p>
                              )}
                            </div>

                            {blockers.length > 0 ? (
                              <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-950">
                                <p className="font-medium">Missing items</p>
                                <ul className="mt-2 space-y-1.5">
                                  {blockers.map((blocker) => (
                                    <li key={blocker}>{blocker}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </section>
                        </div>
                      ) : null}

                      {step === 5 ? (
                        <div className="space-y-6">
                          <section className="grid gap-4">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Destination
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Generate when the review is complete. The output
                                updates live if you change upstream inputs.
                              </p>
                            </div>

                            <div className="rounded-3xl border border-border/60 bg-[linear-gradient(180deg,_rgba(236,253,245,0.8),_rgba(255,255,255,0.96))] p-5 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.32)]">
                              <div className="space-y-5">
                                <div className="flex flex-wrap items-center gap-3">
                                  <Badge
                                    variant="outline"
                                    className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700"
                                  >
                                    {generated ? "Recommendation generated" : "Awaiting generation"}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {readyToGenerate
                                      ? "All required items are present."
                                      : "Resolve the missing items before generating."}
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  <h3 className="text-3xl font-semibold tracking-tight text-foreground">
                                    {generated
                                      ? primaryRecommendationLine
                                      : "Recommendation preview"}
                                  </h3>
                                  <p className="max-w-3xl text-base leading-7 text-slate-700">
                                    {generated
                                      ? recommendation.hardStop.active
                                        ? recommendation.hardStop.reason
                                        : `Ceftriaxone modeled clearance is ${ceftriaxoneCindividualLh} L/h at ${weightKg} kg using ${pgxMeta.label}.`
                                      : "The generated recommendation will appear here once you confirm the review."}
                                  </p>
                                </div>

                                {generated ? (
                                  <div className="grid gap-4 lg:grid-cols-2">
                                    <section className="rounded-2xl bg-white/80 p-4">
                                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                        Primary regimen
                                      </p>
                                      <p className="mt-2 text-lg font-semibold text-foreground">
                                        {primaryRecommendationLine}
                                      </p>
                                      {recommendation.hardStop.active ? (
                                        <p className="mt-2 text-sm text-destructive">
                                          {recommendation.hardStop.reason}
                                        </p>
                                      ) : null}
                                    </section>

                                    <section className="rounded-2xl bg-white/80 p-4">
                                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                        Rationale
                                      </p>
                                      <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                                        {recommendation.contextNotes.length > 0 ? (
                                          recommendation.contextNotes.map((note) => (
                                            <li key={note}>{note}</li>
                                          ))
                                        ) : (
                                          <li>No additional rationale returned.</li>
                                        )}
                                      </ul>
                                    </section>

                                    <section className="rounded-2xl bg-white/80 p-4">
                                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                        Alternatives
                                      </p>
                                      {recommendation.coTreatments.length > 0 ? (
                                        <ul className="mt-2 space-y-2 text-sm text-slate-700">
                                          {recommendation.coTreatments.map((drug) => (
                                            <li key={formatDrugLabel(drug)}>
                                              {formatDrugLabel(drug)}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                          No additional co-treatments generated.
                                        </p>
                                      )}
                                    </section>

                                    <section className="rounded-2xl bg-white/80 p-4">
                                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                        Cautions / flags
                                      </p>
                                      {recommendation.warnings.length > 0 ? (
                                        <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                                          {recommendation.warnings.map((warning) => (
                                            <li key={warning}>{warning}</li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                          No active warnings from the engine.
                                        </p>
                                      )}
                                    </section>
                                  </div>
                                ) : (
                                  <div className="rounded-2xl bg-white/80 p-4 text-sm text-muted-foreground">
                                    The recommendation card will populate after you
                                    press <span className="font-medium text-foreground">Generate recommendation</span>.
                                  </div>
                                )}
                              </div>
                            </div>
                          </section>

                          <ClearanceTable
                            weightKg={weightKg}
                            pgBaseXr={pgBaseXr}
                            pgxProfileLabel={pgxMeta.label}
                            albuminRiskCount={albuminRiskCount}
                          />

                          <section className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Patient counseling notes
                              </h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="rounded-full px-3 py-1">
                                  {selectedLanguage}
                                </Badge>
                                <Badge variant="outline" className="rounded-full px-3 py-1">
                                  {HEALTH_LITERACY_LABEL[healthLiteracy]}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                              <Card className="border-border/60 bg-white/90 shadow-none">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base">
                                    Language support
                                  </CardTitle>
                                  <CardDescription>
                                    Counseling language is shaped by the preferred
                                    language selection.
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                                    {languageEducationBullets.map((line) => (
                                      <li key={line}>{line}</li>
                                    ))}
                                  </ul>
                                </CardContent>
                              </Card>

                              <Card className="border-border/60 bg-white/90 shadow-none">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base">
                                    Literacy support
                                  </CardTitle>
                                  <CardDescription>
                                    Match the counseling format to the literacy
                                    level chosen in step 4.
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                                    {literacyEducationBullets.map((line) => (
                                      <li key={line}>{line}</li>
                                    ))}
                                  </ul>
                                </CardContent>
                              </Card>
                            </div>

                            {dxGono ? (
                              <Card className="border-border/60 bg-white/90 shadow-none">
                                <CardHeader className="pb-3">
                                  <CardTitle className="text-base">
                                    Gonorrhea site counseling
                                  </CardTitle>
                                  <CardDescription>
                                    {formatGonorrheaSitesSummary(gonorrheaSites)}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <ul className="list-inside list-disc space-y-2 text-sm leading-6 text-muted-foreground">
                                    {gonorrheaSiteEducationBullets(gonorrheaSites).map(
                                      (line) => (
                                        <li key={line}>{line}</li>
                                      ),
                                    )}
                                  </ul>
                                </CardContent>
                              </Card>
                            ) : null}
                          </section>

                          <section className="space-y-3">
                            <div className="flex flex-wrap gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handlePartnerEptHandoutPdf}
                                className="rounded-full"
                              >
                                <Users className="size-4" aria-hidden />
                                Partner EPT PDF
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handlePatientHandoutPdf}
                                className="rounded-full"
                              >
                                <FileText className="size-4" aria-hidden />
                                Patient handout PDF
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => showPlannedFeature("Retest reminder")}
                                className="rounded-full"
                              >
                                <Calendar className="size-4" aria-hidden />
                                Retest reminder
                              </Button>
                            </div>
                          </section>
                        </div>
                      ) : null}
                    </CardContent>

                    <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={moveBack}
                        disabled={step === 1}
                        className="rounded-full"
                      >
                        Back
                      </Button>

                      {step < 5 ? (
                        <Button
                          type="button"
                          onClick={moveNext}
                          className="rounded-full"
                        >
                          {step === 4 ? "Review recommendation" : "Next"}
                          <ChevronRight className="size-4" aria-hidden />
                        </Button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-muted-foreground">
                            {readyToGenerate
                              ? "Generate when the review feels complete."
                              : "Resolve the missing items first."}
                          </p>
                          <Button
                            type="button"
                            onClick={moveNext}
                            disabled={!readyToGenerate}
                            className="rounded-full"
                          >
                            {generated ? "Regenerate recommendation" : "Generate recommendation"}
                            <ChevronRight className="size-4" aria-hidden />
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                </div>

                <aside className="lg:sticky lg:top-24 lg:self-start">
                  <Card className="border-border/60 bg-white/92 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.32)]">
                    <CardHeader className="space-y-2 border-b border-border/50 pb-5">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base">Live summary</CardTitle>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full px-3 py-1",
                            readyToGenerate
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700",
                          )}
                        >
                          {readinessLabel}
                        </Badge>
                      </div>
                      <CardDescription>
                        Always-on summary of the selected chart values and output
                        readiness.
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-5 pt-5">
                      <dl className="divide-y divide-border/60 rounded-2xl bg-muted/25 px-4">
                        <SummaryRow label="Allergy profile" value={ALLERGY_LABEL[allergy]} />
                        <SummaryRow label="PGx profile" value={pgxMeta.label} />
                        <SummaryRow label="Weight" value={`${weightKg} kg`} />
                        <SummaryRow
                          label="Pregnancy"
                          value={pregnant ? "Yes" : "No"}
                        />
                        <SummaryRow
                          label="Diagnoses"
                          value={
                            diagnosisSummary.length > 0
                              ? diagnosisSummary.join(" · ")
                              : "None selected"
                          }
                          muted={diagnosisSummary.length === 0}
                        />
                        <SummaryRow
                          label="POC gyrA"
                          value={getGyrAStatusSummary({
                            dxGono,
                            gyrAPocCompleted,
                            gyrAUploadSummary,
                            gyrA,
                          })}
                        />
                        <SummaryRow label="Albumin risk flags" value={albuminSummary} />
                        <SummaryRow label="SDOH flags" value={sdohSummary} />
                        <SummaryRow label="Preferred language" value={selectedLanguage} />
                      </dl>

                      <div className="rounded-2xl bg-muted/25 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-foreground">
                            Clearance snapshot
                          </p>
                          <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs">
                            {pgxMeta.label}
                          </Badge>
                        </div>
                        <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
                          {ceftriaxoneCindividualLh} L/h
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Ceftriaxone C<sub>individual</sub> at {weightKg} kg
                          with {albuminRiskCount} albumin risk flag(s).
                        </p>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-medium text-foreground">
                          Recommendation readiness
                        </p>
                        <div className="rounded-2xl bg-muted/25 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm text-muted-foreground">
                              Status
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-full px-3 py-1",
                                readyToGenerate
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700",
                              )}
                            >
                              {readinessLabel}
                            </Badge>
                          </div>
                          {blockers.length > 0 ? (
                            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
                              {blockers.map((blocker) => (
                                <li key={blocker}>{blocker}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-3 text-sm text-muted-foreground">
                              All required items are captured. The final step is
                              ready to generate.
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </aside>
              </div>
            </div>
          </TabsContent>
        </main>

<<<<<<< HEAD
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
              pgxProfileLabel={`${hostPersona.name} — ${pgxMeta.label}`}
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
                      {ceftriaxoneCindividualLh} L/h (
                      {hostPersona.name}; PGx: {pgxMeta.label}){" "}
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
              pgxProfileLabel={`${hostPersona.name} — ${pgxMeta.label}`}
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
=======
        <footer className="border-t border-border/60 bg-background/75 py-6 text-center text-xs text-muted-foreground backdrop-blur">
          DOODLE · demo decision support workflow
        </footer>
      </div>
>>>>>>> f320e1c (feat: ui update)
    </Tabs>
  );
}
