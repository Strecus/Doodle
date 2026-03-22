import { ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";
import {
  adherencePointsFromSviPercentile,
  calculateAdherenceRiskScore,
  type AdherencePatient,
  type AdherenceRegimen,
  type LiteracyLevel,
} from "./adherenceRisk";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { cn } from "@/lib/utils";

const tierStyles: Record<
  string,
  { bar: string; text: string; ring: string }
> = {
  LOW: {
    bar: "bg-emerald-500",
    text: "text-emerald-800 dark:text-emerald-200",
    ring: "ring-emerald-200 dark:ring-emerald-800",
  },
  MODERATE: {
    bar: "bg-amber-500",
    text: "text-amber-900 dark:text-amber-100",
    ring: "ring-amber-200 dark:ring-amber-800",
  },
  HIGH: {
    bar: "bg-red-500",
    text: "text-red-900 dark:text-red-100",
    ring: "ring-red-200 dark:ring-red-800",
  },
};

type AdherenceScreenerProps = {
  sdohCost: boolean;
  sdohTransport: boolean;
  sdohHousing: boolean;
  sdohFood: boolean;
  onSdohCostChange: (value: boolean) => void;
  onSdohTransportChange: (value: boolean) => void;
  onSdohHousingChange: (value: boolean) => void;
  onSdohFoodChange: (value: boolean) => void;
};

export function AdherenceScreener({
  sdohCost,
  sdohTransport,
  sdohHousing,
  sdohFood,
  onSdohCostChange,
  onSdohTransportChange,
  onSdohHousingChange,
  onSdohFoodChange,
}: AdherenceScreenerProps) {
  const [age, setAge] = useState(28);
  const [literacyLevel, setLiteracyLevel] = useState<LiteracyLevel>("Medium");
  const [priorNonAdherence, setPriorNonAdherence] = useState(false);
  /** CDC/ATSDR overall SVI percentile (0–100) for patient’s tract or county. */
  const [sviOverallPercentile, setSviOverallPercentile] = useState(35);

  const [isMultiDay, setIsMultiDay] = useState(false);
  const [isBID, setIsBID] = useState(false);
  const [numMedications, setNumMedications] = useState(1);

  const [sdohUninsured, setSdohUninsured] = useState(false);

  const patient: AdherencePatient = useMemo(
    () => ({
      age,
      literacyLevel,
      priorNonAdherence,
      sviOverallPercentile,
      sdoh: {
        medicationCost: sdohCost,
        transportation: sdohTransport,
        housing: sdohHousing,
        uninsured: sdohUninsured,
        foodInsecurity: sdohFood,
      },
    }),
    [
      age,
      literacyLevel,
      priorNonAdherence,
      sviOverallPercentile,
      sdohCost,
      sdohTransport,
      sdohHousing,
      sdohUninsured,
      sdohFood,
    ],
  );

  const regimen: AdherenceRegimen = useMemo(
    () => ({
      isMultiDay,
      isBID,
      numMedications,
    }),
    [isMultiDay, isBID, numMedications],
  );

  const result = useMemo(
    () => calculateAdherenceRiskScore(patient, regimen),
    [patient, regimen],
  );

  const tier = tierStyles[result.riskTier] ?? tierStyles.LOW;
  const sviAdherencePoints = adherencePointsFromSviPercentile(
    sviOverallPercentile,
  );

  return (
    <div className="space-y-8">
      <Alert>
        <ClipboardList className="size-4" aria-hidden />
        <AlertTitle>How to use this form</AlertTitle>
        <AlertDescription>
          This checklist helps estimate how hard it may be to stick with your
          treatment plan. Community-level{" "}
          <a
            href="https://www.atsdr.cdc.gov/placeandhealth/svi/index.html"
            className="font-medium text-foreground underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            CDC/ATSDR Social Vulnerability Index (SVI)
          </a>{" "}
          is included because higher area vulnerability often correlates with
          barriers to care and adherence. For education only — not a diagnosis.
          Share results with your care team.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About you</CardTitle>
            <CardDescription>
              Demographics, history, and area SVI (CDC) feed the adherence
              support level.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="adh-age">
                Age:{" "}
                <span className="font-normal text-muted-foreground">{age}</span>
              </Label>
              <Slider
                id="adh-age"
                min={16}
                max={90}
                step={1}
                value={[age]}
                onValueChange={(v) => setAge(v[0] ?? 16)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adh-literacy">
                Reading / health literacy (self-report)
              </Label>
              <Select
                value={literacyLevel}
                onValueChange={(v) => setLiteracyLevel(v as LiteracyLevel)}
              >
                <SelectTrigger id="adh-literacy" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">
                    Comfortable reading instructions
                  </SelectItem>
                  <SelectItem value="Medium">Sometimes need help</SelectItem>
                  <SelectItem value="Low">
                    Often need help with written instructions
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/50 p-4">
              <Label htmlFor="adh-prior" className="cursor-pointer">
                Missed or stopped a prescribed treatment before?
              </Label>
              <div className="flex items-center gap-3">
                <Switch
                  id="adh-prior"
                  checked={priorNonAdherence}
                  onCheckedChange={setPriorNonAdherence}
                />
                <span className="text-sm font-medium text-muted-foreground">
                  {priorNonAdherence ? "Yes" : "No"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="adh-svi">
                Area SVI — overall percentile (CDC/ATSDR)
              </Label>
              <p className="text-xs text-muted-foreground">
                Use the overall SVI percentile for the patient’s{" "}
                <span className="font-medium text-foreground/90">
                  census tract or county
                </span>{" "}
                from ATSDR tools.{" "}
                <span className="font-medium">0</span> = least vulnerable,{" "}
                <span className="font-medium">100</span> = most vulnerable. This
                raises adherence support when community stressors are more
                common.
              </p>
              <Slider
                id="adh-svi"
                min={0}
                max={100}
                step={1}
                value={[sviOverallPercentile]}
                onValueChange={(v) => setSviOverallPercentile(v[0] ?? 0)}
              />
              <p className="text-xs text-muted-foreground">
                SVI percentile:{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {sviOverallPercentile}
                </span>
                {" → "}
                <span className="font-medium tabular-nums text-foreground">
                  +{sviAdherencePoints}
                </span>{" "}
                adherence score points (scaled 0–5).
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your treatment plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="adh-multiday"
                  checked={isMultiDay}
                  onCheckedChange={(c) => setIsMultiDay(c === true)}
                />
                <Label htmlFor="adh-multiday" className="cursor-pointer font-normal">
                  Treatment lasts more than one day
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="adh-bid"
                  checked={isBID}
                  onCheckedChange={(c) => setIsBID(c === true)}
                />
                <Label htmlFor="adh-bid" className="cursor-pointer font-normal">
                  Take medicine twice a day (BID)
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adh-nmed">Number of medications</Label>
                <Input
                  id="adh-nmed"
                  type="number"
                  min={1}
                  max={10}
                  value={numMedications}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n))
                      setNumMedications(Math.min(10, Math.max(1, n)));
                  }}
                  className="sm:w-32"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Daily life &amp; access
              </CardTitle>
              <CardDescription>Check all that apply.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {[
                [
                  "Worried about medication cost",
                  sdohCost,
                  onSdohCostChange,
                ],
                [
                  "Hard to get rides / transportation",
                  sdohTransport,
                  onSdohTransportChange,
                ],
                [
                  "Housing unstable or changing often",
                  sdohHousing,
                  onSdohHousingChange,
                ],
                ["No health insurance", sdohUninsured, setSdohUninsured],
                ["Not enough food / skip meals", sdohFood, onSdohFoodChange],
              ].map(([label, checked, set], i) => (
                <div key={i} className="flex items-center gap-2">
                  <Checkbox
                    id={`adh-sdoh-${i}`}
                    checked={checked as boolean}
                    onCheckedChange={(c) =>
                      (set as (b: boolean) => void)(c === true)
                    }
                  />
                  <Label
                    htmlFor={`adh-sdoh-${i}`}
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

      <Separator />

      <Card
        className={cn(
          "ring-2 ring-offset-2 ring-offset-background",
          tier.ring,
        )}
        aria-live="polite"
      >
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your adherence support level
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <CardTitle
              className={cn("text-2xl sm:text-3xl", tier.text)}
            >
              {result.riskTier} risk
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              Score: {result.totalScore}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", tier.bar)}
              style={{
                width: `${Math.min(100, (result.totalScore / 24) * 100)}%`,
              }}
            />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Suggested supports (for your care team)
            </h4>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              {result.activeInterventions.map((line) => (
                <li key={line} className="text-foreground/90">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
