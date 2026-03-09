import fs from 'node:fs'

const endpoint =
  process.argv[2] ??
  'https://services1.arcgis.com/cNVyNtjGVZybOQWZ/arcgis/rest/services/Road_names/FeatureServer/0/query'
const output = process.argv[3] ?? 'src/data/cityRoadNames.json'

const pageSize = 1000
let offset = 0
let hasMore = true
const names = new Set()

while (hasMore) {
  const url = new URL(endpoint)
  url.searchParams.set('where', '1=1')
  url.searchParams.set('outFields', '*')
  url.searchParams.set('returnGeometry', 'false')
  url.searchParams.set('f', 'json')
  url.searchParams.set('resultRecordCount', String(pageSize))
  url.searchParams.set('resultOffset', String(offset))

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`ArcGIS request failed (${response.status}) at offset ${offset}`)
  }

  const data = await response.json()
  const features = data.features ?? []

  for (const feature of features) {
    const attributes = feature.attributes ?? {}
    const candidate =
      attributes.ROAD_NAME ?? attributes.ROADNAME ?? attributes.STREET ?? attributes.NAME ?? attributes.road_name
    if (typeof candidate === 'string' && candidate.trim()) {
      names.add(candidate.trim())
    }
  }

  const exceeded = Boolean(data.exceededTransferLimit)
  hasMore = exceeded || features.length === pageSize
  offset += pageSize

  if (!features.length) break
}

const payload = {
  source: endpoint,
  generatedAt: new Date().toISOString(),
  roadCount: names.size,
  roads: [...names].sort((a, b) => a.localeCompare(b))
}

fs.writeFileSync(output, JSON.stringify(payload, null, 2) + '\n')
console.log(`Wrote ${names.size} road names to ${output}`)
