import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  ClipboardList,
  FileText,
  Info,
  Loader2,
  Pill,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  resolveStateFromZipDemo,
  DEMO_ZIP_LOOKUP_COUNT,
  normalizeZip5,
  surveillanceMetadata,
  type UsStateCode,
} from "./mic90";
import {
  isOpenApiGeocodeConfigured,
  resolveStateFromZipOpenApi,
} from "./zipGeocodeOpenApi";

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

function ClearanceFormulaPanel({
  weightKg,
  pgBaseXr,
  pgxProfileLabel,
}: {
  weightKg: number;
  pgBaseXr: number;
  pgxProfileLabel: string;
}) {
  const rows = useMemo(
    () => clearanceRowsForPatient(weightKg, pgBaseXr),
    [weightKg, pgBaseXr],
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
          faster true elimination alone.
        </p>
      </CardContent>
    </Card>
  );
}

export default function App() {
  const [section, setSection] = useState<AppSection>("dosing");
  const [view, setView] = useState<View>("intake");
  const [loading, setLoading] = useState(false);

  const [weightKg, setWeightKg] = useState(78);
  const [pregnant, setPregnant] = useState(false);
  const [allergy, setAllergy] = useState<Allergy>("none");
  const [pgx, setPgx] = useState<PgxProfileId>("normal");
  const [gyrA, setGyrA] = useState<GyrA>("not-tested");
  const [zipInput, setZipInput] = useState("");
  const [residenceState, setResidenceState] = useState<UsStateCode>("NY");
  const [zipApiState, setZipApiState] = useState<UsStateCode | null>(null);
  const [zipApiLoading, setZipApiLoading] = useState(false);
  const [zipApiErr, setZipApiErr] = useState<string | null>(null);

  const stateFromZipDemo = useMemo(
    () => resolveStateFromZipDemo(zipInput),
    [zipInput],
  );

  useEffect(() => {
    const z = normalizeZip5(zipInput);
    if (!z || !isOpenApiGeocodeConfigured()) {
      setZipApiState(null);
      setZipApiErr(null);
      setZipApiLoading(false);
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setZipApiLoading(true);
      setZipApiErr(null);
      resolveStateFromZipOpenApi(z)
        .then((st) => {
          if (cancelled) return;
          setZipApiState(st);
          setZipApiErr(
            st ? null : "Geocoder returned no US state — check response shape.",
          );
        })
        .catch(() => {
          if (cancelled) return;
          setZipApiState(null);
          setZipApiErr("Geocoder request failed (CORS, 401, or network).");
        })
        .finally(() => {
          if (!cancelled) setZipApiLoading(false);
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [zipInput]);

  const effectiveState =
    zipApiState ?? stateFromZipDemo ?? residenceState;
  const surveillanceRegion = useMemo(
    () => getRegionForState(effectiveState),
    [effectiveState],
  );
  const gonorrheaMic90 = useMemo(() => {
    if (!surveillanceRegion) return null;
    return calculateMIC90(getGonorrheaMicDistribution(surveillanceRegion));
  }, [surveillanceRegion]);
  const [dxGono, setDxGono] = useState(false);
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

  const pgxMeta = getPgxProfileMeta(pgx);
  const pgBaseXr = pgxMeta.pgBaseXr;

  const ceftriaxoneCindividualLh = useMemo(() => {
    const rows = clearanceRowsForPatient(weightKg, pgBaseXr);
    return rows[0]?.cindividualLh ?? 0;
  }, [weightKg, pgBaseXr]);

  const hardStop = allergy === "high" && dxGono;
  const mainLine = hardStop
    ? "Consult Infectious Diseases — no automated pathway"
    : "✅ Ceftriaxone 500mg IM × 1 dose";

  function reset() {
    setView("intake");
    setLoading(false);
  }

  function generate() {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setView("output");
    }, 1500);
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
          <AdherenceScreener />
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
                      {[
                        ["Gonorrhea", dxGono, setDxGono],
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
                  </fieldset>

                  <fieldset className="space-y-4 rounded-lg border p-4">
                    <legend className="px-1 text-sm font-medium">
                      POC gyrA test &amp; regional MIC context
                    </legend>
                    <p className="text-xs text-muted-foreground">
                      {surveillanceMetadata().source}. MIC<sub>90</sub> is the
                      lowest MIC bin whose cumulative regional probability reaches
                      ≥90%. Routing priority:{" "}
                      {isOpenApiGeocodeConfigured() ? (
                        <>
                          5-digit ZIP → your OpenAPI geocoder (
                          <code className="rounded bg-muted px-1">VITE_GEOCODE_ZIP_URL</code>
                          ), then
                        </>
                      ) : null}{" "}
                      demo ZIP table ({DEMO_ZIP_LOOKUP_COUNT} sample ZIPs), then
                      manual state.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="zip-residence">ZIP code</Label>
                        <Input
                          id="zip-residence"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          placeholder="e.g. 10001"
                          maxLength={10}
                          value={zipInput}
                          onChange={(e) => setZipInput(e.target.value)}
                        />
                        {zipApiLoading &&
                        normalizeZip5(zipInput) &&
                        isOpenApiGeocodeConfigured() ? (
                          <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2
                              className="size-3.5 shrink-0 animate-spin"
                              aria-hidden
                            />
                            OpenAPI ZIP lookup…
                          </p>
                        ) : null}
                        {zipApiState && isOpenApiGeocodeConfigured() ? (
                          <p className="text-xs text-muted-foreground">
                            OpenAPI: ZIP →{" "}
                            <span className="font-medium text-foreground">
                              {zipApiState}
                            </span>
                          </p>
                        ) : null}
                        {zipApiErr &&
                        normalizeZip5(zipInput) &&
                        isOpenApiGeocodeConfigured() &&
                        !zipApiLoading &&
                        !zipApiState ? (
                          <p className="text-xs text-amber-800 dark:text-amber-200">
                            {zipApiErr}
                          </p>
                        ) : null}
                        {!zipApiState && stateFromZipDemo ? (
                          <p className="text-xs text-muted-foreground">
                            Demo table: ZIP →{" "}
                            <span className="font-medium text-foreground">
                              {stateFromZipDemo}
                            </span>
                          </p>
                        ) : null}
                        {!zipApiState &&
                        !stateFromZipDemo &&
                        normalizeZip5(zipInput) &&
                        !zipApiLoading ? (
                          <p className="text-xs text-amber-800 dark:text-amber-200">
                            ZIP not resolved — using manual state below.
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state-residence">
                          State of residence (fallback)
                        </Label>
                        <Select
                          value={residenceState}
                          onValueChange={(v) =>
                            setResidenceState(v as UsStateCode)
                          }
                        >
                          <SelectTrigger id="state-residence" className="w-full">
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
                          Region <span className="font-medium">{surveillanceRegion}</span>{" "}
                          via state{" "}
                          <span className="font-medium">{effectiveState}</span>
                          {zipApiState
                            ? " (ZIP → OpenAPI)"
                            : stateFromZipDemo
                              ? " (ZIP → demo table)"
                              : " (manual state)"}
                          .
                        </p>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor="gyra">POC gyrA test</Label>
                      <Select
                        value={gyrA}
                        onValueChange={(v) => setGyrA(v as GyrA)}
                      >
                        <SelectTrigger id="gyra" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not-tested">Not tested</SelectItem>
                          <SelectItem value="wild">Wild-type</SelectItem>
                          <SelectItem value="mutant">Mutant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </fieldset>
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

            <ClearanceFormulaPanel
              weightKg={weightKg}
              pgBaseXr={pgBaseXr}
              pgxProfileLabel={pgxMeta.label}
            />

            <Button
              type="button"
              size="lg"
              disabled={loading}
              onClick={generate}
              className="h-auto w-full py-4 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="size-6 animate-spin" aria-hidden />
                  Analyzing patient parameters…
                </>
              ) : (
                <>GENERATE RECOMMENDATION →</>
              )}
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
                <CardTitle className="text-2xl sm:text-3xl">{mainLine}</CardTitle>
                <CardDescription className="text-base text-foreground/80">
                  {hardStop ? (
                    "High-risk allergy with gonorrhea diagnosis requires ID-guided therapy."
                  ) : (
                    <>
                      Ceftriaxone C<sub>individual</sub> ≈{" "}
                      {ceftriaxoneCindividualLh} L/h (PGx: {pgxMeta.label}){" "}
                      (C<sub>population</sub> ={" "}
                      {CPOPULATION_LH.ceftriaxoneGonorrhea} L/h,{" "}
                      <NotationPGbaseXR /> = {pgBaseXr}). See allometric table
                      below. Guideline-consistent target attainment; standard
                      dose adequate for this clearance estimate.
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              {(pregnant ||
                gyrA === "mutant" ||
                dxChlam ||
                dxSyph ||
                dxTrich) && (
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    Context captured:{" "}
                    {[
                      pregnant && "pregnancy",
                      gyrA === "mutant" && "gyrA mutant",
                      dxChlam && "chlamydia",
                      dxSyph && "syphilis",
                      dxTrich && "trichomoniasis",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </CardContent>
              )}
            </Card>

            <ClearanceFormulaPanel
              weightKg={weightKg}
              pgBaseXr={pgBaseXr}
              pgxProfileLabel={pgxMeta.label}
            />

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Alert architecture
              </h2>

              <Alert
                variant="destructive"
                className="border-red-200 bg-red-50 text-red-950 dark:bg-red-950/30 dark:text-red-100"
              >
                <AlertTriangle className="size-4" aria-hidden />
                <AlertTitle>Hard stop</AlertTitle>
                <AlertDescription className="text-red-950 dark:text-red-50">
                  ⛔ Pharyngeal gonorrhea + severe allergy. No safe alternative.
                  Consult ID.
                </AlertDescription>
              </Alert>

              <Alert className="border-amber-200 bg-amber-50 text-amber-950 dark:bg-amber-950/25 dark:text-amber-50">
                <AlertCircle className="size-4 text-amber-700" aria-hidden />
                <AlertTitle>PGx advisory</AlertTitle>
                <AlertDescription className="text-amber-950 dark:text-amber-50">
                  ⚠ ABCB1 low-function detected. Expect 2× azithromycin levels.
                  Monitor for toxicity.
                </AlertDescription>
              </Alert>

              <Alert className="border-border bg-muted/80">
                <Info className="size-4" aria-hidden />
                <AlertTitle>SDOH flag</AlertTitle>
                <AlertDescription>
                  Transportation barrier detected. Single-dose DOT recommended.
                </AlertDescription>
              </Alert>
            </div>

            <Separator />

            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Action items
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Partner EPT Rx", Users],
                  ["Patient handout", FileText],
                  ["Retest reminder", Calendar],
                ].map(([label, Icon]) => (
                  <Button
                    key={label as string}
                    type="button"
                    variant="outline"
                    className="h-auto flex-col gap-2 py-4"
                  >
                    <Icon className="size-5" aria-hidden />
                    {label as string}
                  </Button>
                ))}
              </div>
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
