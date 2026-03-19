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

- `src/data/cityLocations.json`: specific street register records used for address certainty
- `src/data/businessAddresses.json`: specific business address records used for business-level matching
- `src/data/footpathGuidance.json`: conservative zone guidance used for likely hours and likely max area outputs

### Footpath/location source note

This environment could not directly scrape external datasets (network requests returned `403 CONNECT tunnel failed`).
So this prototype now includes a locally maintained baseline dataset and explicit source note text in-app.

When you run this in your own environment with internet access, replace `cityLocations.json and businessAddresses.json` and `footpathGuidance.json` with refreshed extracts from official sources.

Recommended sources:

1. City of Sydney Open Data portal: <https://data.cityofsydney.nsw.gov.au/>
2. City of Sydney outdoor dining guidance: <https://www.cityofsydney.nsw.gov.au/business-permits-approvals-tenders/outdoor-dining>
3. NSW Planning Portal spatial viewer: <https://www.planningportal.nsw.gov.au/spatialviewer>

Note: in this execution environment, direct fetch of external sources may fail due network policy (403 CONNECT tunnel).

## How the checker works now

1. User searches for an exact street/business record and selects a matched address result.
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

1. Replace prototype `cityLocations.json` and `businessAddresses.json` with authoritative full address and business extracts.
2. Replace `footpathGuidance.json` with validated, location-level controls.
3. Add geo-based checks (street width, frontage constraints, pedestrian flow hotspots).
4. Add council-maintained versioning for policy text and dataset refresh dates.
5. Add audit logs for policy updates.

## Notes

This prototype is guidance only and does not provide approvals.


## Recent improvements

- Road reallocation pathway now triggers when users select on-street or both on-street + footpath locations.
- If users request pedestrian-clearance help, the app now links to City of Sydney guidance pages and shows the duty planner contact number.

## Additional guidance to consider adding

- Frontage width and minimum continuous pedestrian corridor checks by street segment.
- Nearby bus stop, crossing, loading zone, and fire egress constraints.
- Neighbour notification/consultation timing hints for road reallocation cases.
- Clear split between likely baseline controls and site-specific assessment items.

## Geocoding + LGA boundary CSV quickstart

If you have an LGA boundary CSV locally, you can convert it into JSON points for use in a spatial pre-check:

```bash
node scripts/convertLgaBoundaryCsv.mjs /path/to/your/lga-boundary.csv src/data/lgaBoundaryPoints.json
```

Expected CSV columns include either:
- `lat` + `lon` (or `latitude` + `longitude`), or
- `y` + `x`

Then you can wire a point-in-polygon check in the lookup layer to hard-confirm whether a geocoded address is inside City of Sydney LGA before rules are evaluated.

### Suggested free geocoding stack

1. Use a free geocoder (e.g. Nominatim) for address normalization/autocomplete.
2. Run a boundary containment check against your LGA polygon/boundary points.
3. Map the confirmed location to your local street/business register for deterministic certainty.
4. Feed the result into the existing rules engine.

## New UI guidance enhancements included

- Readiness status band (green/amber/red) to show likely proceedability.
- Constraint summary cards based on selected address/pathway (road, precinct, alcohol, clearance help).
- Address-specific evidence checklist generated from selected record + pathway.
- Data freshness and confidence labels shown in coverage section.

## Geocoding is embedded (free provider default)

Geocoding suggestions are now embedded by default using Nominatim.
No setup is required for standard usage.

Optional overrides (if needed):

```bash
VITE_ENABLE_GEOCODING=false   # disable geocoding
VITE_GEOCODER_PROVIDER=nominatim
VITE_GEOCODER_BASE_URL=https://nominatim.openstreetmap.org
VITE_GEOCODER_COUNTRY_CODE=au
```

How it works:
1. Local register results are searched first.
2. Nominatim suggestions are fetched and merged when available.
3. Suggestions are filtered to known City of Sydney suburbs before display.

Notes:
- The live geocoder path uses OpenStreetMap's Nominatim search API, bounded to the City of Sydney viewbox, in addition to the local prototype datasets.
- If a street such as Bourke Street does not appear locally, the usual reason is that `src/data/cityRoadNames.json` has not yet been refreshed from the full City dataset; the checked-in file is still only a prototype subset.
- If geocoder requests fail, the app falls back to local register and road-name register results.
- Nominatim usage limits apply; for production use a hosted geocoder/proxy and send identifying request metadata where required.

## Import full City of Sydney road-name register (ArcGIS)

To pull the City of Sydney road-name dataset (target ~1,187 streets), run:

```bash
npm run import:roads
```

or directly:

```bash
node scripts/importRoadNamesArcgis.mjs \
  "https://services1.arcgis.com/cNVyNtjGVZybOQWZ/arcgis/rest/services/Road_names/FeatureServer/0/query" \
  src/data/cityRoadNames.json
```

What this now does:
1. Pages through ArcGIS records in batches (`resultOffset`/`resultRecordCount`).
2. Normalises and deduplicates road names from known attribute fields.
3. Writes `src/data/cityRoadNames.json`, which is now used both for coverage reporting and as a wider street-name fallback in lookup.

## Import City of Sydney road names from OpenStreetMap

If you want to seed the wider road-name register from OpenStreetMap instead, use the City of Sydney relation (`1251066`):

```bash
npm run import:roads:osm
```

or directly:

```bash
node scripts/importRoadNamesOsm.mjs 1251066 src/data/cityRoadNames.json
```

That script:
1. Queries Overpass for named highway ways inside relation `1251066`.
2. Deduplicates and normalises street names.
3. Rewrites `src/data/cityRoadNames.json` so the checker can suggest many more City streets even when they are not in the small prototype address sample.

Important limitation:
- A road-name register improves street discovery, but it does **not** prove an exact property-level match. For full address certainty, you still need an address-point dataset such as G-NAF or a council-maintained address register joined to the LGA boundary.

