# DOODLE

STI dosing & pathway checks — clinical decision support demo UI.

> **Not for clinical use.** This is a non-probabilistic model-view prototype for demonstration and development purposes only.

---

## Overview

Two tabs:

**Treatment Dosing** — generates a guideline-consistent antibiotic recommendation based on:
- Allergy profile (none / low-risk / high-risk PCN & cephalosporin)
- Host PGx profile (ABCB1 normal / low / high — scales individual drug clearance)
- Weight, pregnancy status, confirmed diagnoses (gonorrhea, chlamydia, syphilis, trichomoniasis)
- POC gyrA test result; regional gonorrhea MIC₉₀ from CDC surveillance data (resolved via ZIP lookup, active only when gonorrhea is selected)
- Albumin risk flags (ICU, liver disease, malnutrition, CKD) and SDOH screener

Outputs a recommendation, hard-stop alerts, PGx advisories, and an allometric clearance table for ceftriaxone, azithromycin, and doxycycline.

**Adherence Check** — patient-facing screener estimating treatment adherence risk (LOW / MODERATE / HIGH) from age, health literacy, prior non-adherence, CDC/ATSDR SVI percentile, regimen complexity, and SDOH barriers.

---

## Stack

React 19, TypeScript, Vite 8, Tailwind CSS v4, shadcn/ui

---

## Setup

```bash
npm install
cp .env.example .env   # fill in values below
npm run dev
```

### Environment variables

| Variable | Description |
|---|---|
| `VITE_GEOCODE_ZIP_URL` | ZIP-to-state REST endpoint. Include `{zip}` as a placeholder. |
| `VITE_OPENAPI_API_KEY` | API key for the geocoder (browser-exposed — use a restricted key). |
| `VITE_OPENAPI_AUTH_STYLE` | `bearer` or `x-api-key` |

If not configured, the app falls back to a bundled demo ZIP table, then manual state selection.

---

## Project structure

```
src/
├── App.tsx                        # Main app, dosing tab
├── AdherenceScreener.tsx          # Adherence check tab
├── adherenceRisk.ts               # Adherence scoring logic
├── clearance.ts                   # Allometric PK clearance model
├── mic90.ts                       # MIC₉₀ calculation, ZIP/state routing
├── zipGeocodeOpenApi.ts           # Optional OpenAPI ZIP geocoder
└── data/
    ├── sti-regional-mic-data.json # Regional MIC distributions + state routing
    └── zip-to-state-demo.json     # Demo ZIP lookup table
```

long