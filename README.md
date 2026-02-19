# Outdoor Dining Eligibility Checker (prototype)

A single-page React prototype that helps City of Sydney businesses understand their **likely** new outdoor dining pathway, likely operating envelope, and what to prepare for a new application.

## Features

- Mobile-first guided question flow with progressive disclosure
- Street address lookup oriented to City of Sydney locations
- Prototype footpath entitlement estimate for each selected location:
  - likely operating hours range
  - likely maximum outdoor area (sqm)
  - pedestrian clearance reminder
- Conservative rules engine driven by editable JSON
- Existing permit pathways are de-emphasised and referred to council
- Result summary with:
  - likely pathway
  - usual checklist
  - what you probably do not need yet
  - high-level next steps
  - official links
- Persistent trust language and prototype disclaimer
- "What we based this on" expandable source section
- "Save / Print summary" clean print view
- Basic Vitest unit tests for rules engine and location/entitlement logic

## Setup

### 1) Check Node and npm versions

This project expects:

- Node.js `>=20`
- npm `>=10`

```bash
node -v
npm -v
```

### 2) Install and run

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (usually `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

## Cloudflare Pages deployment

- Build command: `npm run build`
- Build output directory: `dist`
- Node version: `20+`

## Datasets and location coverage

### Included now

- `src/data/citySuburbs.json`: City of Sydney suburb list used to validate LGA coverage for any user-entered street
- `src/data/footpathGuidance.json`: conservative zone guidance used for likely hours and likely max area outputs

### Footpath/location source note

This environment could not directly scrape external datasets (network requests returned `403 CONNECT tunnel failed`).
So this prototype now includes a locally maintained baseline dataset and explicit source note text in-app.

When you run this in your own environment with internet access, replace `citySuburbs.json` and `footpathGuidance.json` with refreshed extracts from official sources.

Recommended sources:

1. City of Sydney Open Data portal: <https://data.cityofsydney.nsw.gov.au/>
2. City of Sydney outdoor dining guidance: <https://www.cityofsydney.nsw.gov.au/business-permits-approvals-tenders/outdoor-dining>
3. NSW Planning Portal spatial viewer: <https://www.planningportal.nsw.gov.au/spatialviewer>

## How the checker works now

1. User types a street and suburb (for example, `123 Example St, Haymarket`) and selects a matched suburb result.
2. App pre-fills location context (`inCityLga`, `inSpecialPrecinct`).
3. User answers core new-application questions.
4. App outputs:
   - likely pathway
   - likely operating hours and likely max outdoor area
   - practical checklist and next steps for a new application

Questions about permit amendments are shown only if user says they already have approval.

## Run tests

```bash
npm test
```

## Edit the rules

Rules are stored in:

- `src/data/rules.json`

You can edit:

- `pathways`
- `defaultChecklist`, `defaultNotNeededYet`, `defaultWarnings`, `defaultNextSteps`
- `rules[]` matching and outputs

## How to adapt for real Council rules later

1. Replace prototype `citySuburbs.json` with authoritative suburb boundary/address index data.
2. Replace `footpathGuidance.json` with validated, location-level controls.
3. Add geo-based checks (street width, frontage constraints, pedestrian flow hotspots).
4. Add council-maintained versioning for policy text and dataset refresh dates.
5. Add audit logs for policy updates.

## Notes

This prototype is guidance only and does not provide approvals.
