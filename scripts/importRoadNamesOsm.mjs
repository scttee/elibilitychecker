import fs from 'node:fs'
import { buildOverpassRoadQuery, extractRoadNamesFromOsmElements } from './osmRoadImportUtils.mjs'

const relationId = process.argv[2] ?? '1251066'
const output = process.argv[3] ?? 'src/data/cityRoadNames.json'
const overpassUrl = process.argv[4] ?? 'https://overpass-api.de/api/interpreter'

const response = await fetch(overpassUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain'
  },
  body: buildOverpassRoadQuery({ relationId })
})

if (!response.ok) {
  throw new Error(`Overpass request failed (${response.status}) for relation ${relationId}`)
}

const data = await response.json()
const roads = extractRoadNamesFromOsmElements(data.elements ?? [])

const payload = {
  source: `OpenStreetMap relation ${relationId}`,
  generatedAt: new Date().toISOString(),
  roadCount: roads.length,
  roads
}

fs.writeFileSync(output, JSON.stringify(payload, null, 2) + '\n')
console.log(`Wrote ${roads.length} road names to ${output}`)
