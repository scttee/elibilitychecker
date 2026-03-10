import fs from 'node:fs'

const input = process.argv[2]
const output = process.argv[3] ?? 'src/data/lgaBoundaryPoints.json'

if (!input) {
  console.error('Usage: node scripts/convertLgaBoundaryCsv.mjs <input.csv> [output.json]')
  process.exit(1)
}

const raw = fs.readFileSync(input, 'utf8').trim()
const lines = raw.split(/\r?\n/)
const headers = lines.shift().split(',').map((h) => h.trim().toLowerCase())

const latKey = headers.find((h) => ['lat', 'latitude', 'y'].includes(h))
const lonKey = headers.find((h) => ['lon', 'lng', 'long', 'longitude', 'x'].includes(h))

if (!latKey || !lonKey) {
  console.error(`Could not detect latitude/longitude columns. Found headers: ${headers.join(', ')}`)
  process.exit(1)
}

const latIndex = headers.indexOf(latKey)
const lonIndex = headers.indexOf(lonKey)

const points = lines
  .map((line) => line.split(','))
  .map((cols) => ({ lat: Number(cols[latIndex]), lon: Number(cols[lonIndex]) }))
  .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))

const payload = {
  source: input,
  generatedAt: new Date().toISOString(),
  pointCount: points.length,
  points
}

fs.writeFileSync(output, JSON.stringify(payload, null, 2) + '\n')
console.log(`Wrote ${points.length} points to ${output}`)
