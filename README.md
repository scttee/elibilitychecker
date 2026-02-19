# Outdoor Dining Eligibility Checker (prototype)

A single-page React prototype that helps City of Sydney businesses understand their **likely** outdoor dining pathway and prepare the right level of information early.

## Features

- Mobile-first guided question flow (progressive disclosure)
- Conservative rules engine driven by editable JSON
- Business/address lookup prototype that can pre-fill location context answers
- Result summary with:
  - likely pathway
  - usual checklist
  - what you probably do not need yet
  - high-level next steps
  - official links
- Persistent trust language and prototype disclaimer
- "What we based this on" expandable source section
- "Save / Print summary" clean print view
- Basic Vitest unit tests for rules engine and address lookup

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

## If you can't run it locally (quick fixes)

If `npm install` fails, run these checks in order:

1. Force npm registry to public npm:

```bash
npm config set registry https://registry.npmjs.org/
npm config delete proxy || true
npm config delete https-proxy || true
npm config list
```

2. Clean install state:

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

3. If your workplace network blocks npm, try from a different network or ask IT to allow `registry.npmjs.org`.

### Common error: `vite: not found`

This means dependencies did not install correctly. Re-run `npm install` after fixing registry/proxy settings.

## Build for production

```bash
npm run build
npm run preview
```

## Cloudflare Pages deployment

This app can be hosted on Cloudflare Pages as a static Vite site:

- Build command: `npm run build`
- Build output directory: `dist`
- Node version: `20+`

## Datasets you can plug in

Current prototype lookup uses local sample data in:

- `src/data/businessAddresses.json`

Recommended production datasets/services:

1. City of Sydney Open Data portal: <https://data.cityofsydney.nsw.gov.au/>
2. NSW Planning Portal spatial viewer datasets: <https://www.planningportal.nsw.gov.au/spatialviewer>
3. data.gov.au catalogue (address/business references): <https://data.gov.au/>
4. ABR ABN Lookup web services (business identity fields): <https://abr.business.gov.au/Help/WebServices>

## How address pre-fill works

- The lookup component searches business name/street strings.
- On select, it pre-fills likely:
  - `inCityLga`
  - `inSpecialPrecinct`
  - `locationType` (if not already answered)
- Users can still manually adjust answers.

Main files:

- `src/components/AddressLookup.tsx`
- `src/lib/addressLookup.ts`
- `src/data/businessAddresses.json`

## Run tests

```bash
npm test
```

## Edit the rules

Rules are stored in:

- `src/data/rules.json`

You can edit:

- `pathways`: labels shown to users
- `defaultChecklist`, `defaultNotNeededYet`, `defaultWarnings`, `defaultNextSteps`
- `rules[]`: matching conditions and rule-specific outputs

### Rule format

Each rule has:

- `priority`: higher number wins first
- `when`: answer conditions to match
- `pathway`: one of the keys under `pathways`
- `checklist`, `notNeededYet`, `warnings`, `nextSteps`

## How to adapt for real Council rules later

1. Replace prototype copy in `sourceSummary` with exact policy references.
2. Replace local lookup dataset with a City of Sydney dataset/API adapter.
3. Add rule conditions for precinct-level controls and alcohol/licensing dependencies.
4. Add validation constraints (for example, minimum pedestrian clearance thresholds).
5. Add an admin workflow for policy updates and dataset refresh.

## Notes

This prototype is guidance only and does not provide approvals.
