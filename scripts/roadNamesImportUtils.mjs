export const ROAD_ATTR_KEYS = ['ROAD_NAME', 'ROADNAME', 'STREET', 'NAME', 'road_name']

export const pickRoadName = (attributes = {}) => {
  for (const key of ROAD_ATTR_KEYS) {
    const value = attributes[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

export const normaliseRoadName = (value) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

export const extractRoadNamesFromFeatures = (features = []) => {
  const names = new Set()
  for (const feature of features) {
    const candidate = pickRoadName(feature?.attributes ?? {})
    if (candidate) names.add(normaliseRoadName(candidate))
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

export const buildArcgisQueryUrl = ({ endpoint, pageSize, offset }) => {
  const url = new URL(endpoint)
  url.searchParams.set('where', '1=1')
  url.searchParams.set('outFields', '*')
  url.searchParams.set('returnGeometry', 'false')
  url.searchParams.set('f', 'json')
  url.searchParams.set('resultRecordCount', String(pageSize))
  url.searchParams.set('resultOffset', String(offset))
  return url
}
