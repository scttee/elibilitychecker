import cityLocationsData from '../data/cityLocations.json'
import businessAddressesData from '../data/businessAddresses.json'
import footpathGuidanceData from '../data/footpathGuidance.json'
import cityRoadNamesData from '../data/cityRoadNames.json'

export type FootpathZone = 'local' | 'high_street' | 'city_centre' | 'special'

type SpecialPrecinct = 'The Rocks' | 'Darling Harbour' | 'Barangaroo' | null

interface CityLocationRecord {
  id: string
  streetAddress: string
  suburb: string
  postcode: string
  inCityLga: boolean
  specialPrecinct: SpecialPrecinct
  footpathZone: FootpathZone
}

interface BusinessAddressRecord {
  id: string
  businessName: string
  streetAddress: string
  suburb: string
  postcode: string
  inCityLga: boolean
  specialPrecinct: SpecialPrecinct
}

export interface StreetAddressRecord {
  id: string
  streetAddress: string
  suburb: string
  postcode: string
  inCityLga: boolean
  specialPrecinct: SpecialPrecinct
  footpathZone: FootpathZone
  sourceType: 'street_register' | 'business_register' | 'road_name_register' | 'geocoder'
  businessName?: string
  confidenceNote?: string
}

interface ZoneGuidance {
  label: string
  typicalHours: string
  typicalMaxAreaSqm: number
  clearanceRule: string
}

interface FootpathGuidanceConfig {
  sourceNote: string
  zones: Record<FootpathZone, ZoneGuidance>
}

interface CityRoadNamesData {
  source: string
  generatedAt: string
  roadCount: number
  roads: string[]
}

interface NominatimResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
  address?: {
    road?: string
    suburb?: string
    city_district?: string
    city?: string
    postcode?: string
  }
}

export interface EntitlementEstimate {
  zoneLabel: string
  likelyHours: string
  likelyMaxAreaSqm: number
  clearanceRule: string
}

const streetRecords = cityLocationsData as CityLocationRecord[]
const businessRecords = businessAddressesData as BusinessAddressRecord[]
const guidanceConfig = footpathGuidanceData as FootpathGuidanceConfig
const roadNamesConfig = cityRoadNamesData as CityRoadNamesData

const zoneBySuburb = new Map(streetRecords.map((record) => [record.suburb.toLowerCase(), record.footpathZone]))
const precinctBySuburb = new Map(streetRecords.map((record) => [record.suburb.toLowerCase(), record.specialPrecinct]))
const postcodeBySuburb = new Map(streetRecords.map((record) => [record.suburb.toLowerCase(), record.postcode]))
const knownSuburbs = [...new Set(streetRecords.map((record) => record.suburb))].sort((a, b) => a.localeCompare(b))
const knownSuburbSet = new Set(knownSuburbs.map((suburb) => suburb.toLowerCase()))

const enableGeocoding = import.meta.env.VITE_ENABLE_GEOCODING !== 'false'
const geocoderProvider = import.meta.env.VITE_GEOCODER_PROVIDER ?? 'nominatim'
const geocoderBaseUrl = import.meta.env.VITE_GEOCODER_BASE_URL ?? 'https://nominatim.openstreetmap.org'
const geocoderCountryCode = import.meta.env.VITE_GEOCODER_COUNTRY_CODE ?? 'au'

const toStreetRecord = (record: CityLocationRecord): StreetAddressRecord => ({
  ...record,
  sourceType: 'street_register'
})

const toBusinessRecord = (record: BusinessAddressRecord): StreetAddressRecord => ({
  id: `biz-${record.id}`,
  streetAddress: record.streetAddress,
  suburb: record.suburb,
  postcode: record.postcode,
  inCityLga: record.inCityLga,
  specialPrecinct: record.specialPrecinct,
  footpathZone: zoneBySuburb.get(record.suburb.toLowerCase()) ?? 'local',
  sourceType: 'business_register',
  businessName: record.businessName
})

const registry = [...streetRecords.map(toStreetRecord), ...businessRecords.map(toBusinessRecord)]

const extractKnownSuburb = (query: string) => {
  const cleanQuery = query.trim().toLowerCase()
  if (!cleanQuery) return null

  return knownSuburbs.find((suburb) => cleanQuery.includes(suburb.toLowerCase())) ?? null
}

const createRoadRegisterRecord = (roadName: string, suburb: string | null): StreetAddressRecord => {
  const suburbLabel = suburb ?? 'City of Sydney'
  const suburbKey = suburb?.toLowerCase() ?? ''

  return {
    id: `road-${roadName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${suburbKey || 'city-of-sydney'}`,
    streetAddress: roadName,
    suburb: suburbLabel,
    postcode: suburb ? postcodeBySuburb.get(suburbKey) ?? '' : '',
    inCityLga: true,
    specialPrecinct: suburb ? precinctBySuburb.get(suburbKey) ?? null : null,
    footpathZone: suburb ? zoneBySuburb.get(suburbKey) ?? 'local' : 'local',
    sourceType: 'road_name_register',
    confidenceNote: suburb
      ? 'Matched from the City-wide road-name register. Suburb was inferred from your query.'
      : 'Matched from the City-wide road-name register. Add a suburb for better location certainty.'
  }
}

const searchRoadNameRegister = (query: string, limit = 10): StreetAddressRecord[] => {
  const cleanQuery = query.trim().toLowerCase()
  if (!cleanQuery) return []

  const inferredSuburb = extractKnownSuburb(query)

  return roadNamesConfig.roads
    .filter((road) => road.toLowerCase().includes(cleanQuery) || cleanQuery.includes(road.toLowerCase()))
    .slice(0, limit)
    .map((road) => createRoadRegisterRecord(road, inferredSuburb))
}

export const searchStreetAddressesLocal = (query: string, limit = 10): StreetAddressRecord[] => {
  const cleanQuery = query.trim().toLowerCase()
  if (!cleanQuery) return []

  const localMatches = registry.filter((record) => {
    const haystack = `${record.businessName ?? ''} ${record.streetAddress} ${record.suburb} ${record.postcode}`.toLowerCase()
    return haystack.includes(cleanQuery)
  })

  const supplementalRoadMatches = searchRoadNameRegister(query, limit).filter(
    (roadRecord) =>
      !localMatches.some(
        (record) => record.streetAddress === roadRecord.streetAddress && record.suburb.toLowerCase() === roadRecord.suburb.toLowerCase()
      )
  )

  return [...localMatches, ...supplementalRoadMatches].slice(0, limit)
}

const mapNominatimToRecord = (item: NominatimResult): StreetAddressRecord | null => {
  const suburb = item.address?.suburb ?? item.address?.city_district ?? item.address?.city
  if (!suburb) return null

  const suburbKey = suburb.toLowerCase()
  if (!knownSuburbSet.has(suburbKey)) return null

  return {
    id: `geo-${item.place_id}`,
    streetAddress: item.address?.road ?? item.display_name,
    suburb,
    postcode: item.address?.postcode ?? '',
    inCityLga: true,
    specialPrecinct: precinctBySuburb.get(suburbKey) ?? null,
    footpathZone: zoneBySuburb.get(suburbKey) ?? 'local',
    sourceType: 'geocoder'
  }
}

export const geocodeAddressQuery = async (
  query: string,
  limit = 5,
  fetchFn: typeof fetch = fetch
): Promise<StreetAddressRecord[]> => {
  if (!enableGeocoding || geocoderProvider !== 'nominatim') return []

  const clean = query.trim()
  if (!clean) return []

  const url = new URL('/search', geocoderBaseUrl)
  url.searchParams.set('q', clean)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', geocoderCountryCode)
  url.searchParams.set('limit', String(limit))

  try {
    const response = await fetchFn(url.toString(), {
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) return []
    const payload = (await response.json()) as NominatimResult[]
    return payload.map(mapNominatimToRecord).filter((item): item is StreetAddressRecord => Boolean(item))
  } catch {
    return []
  }
}

export const searchStreetAddresses = async (query: string, limit = 10): Promise<StreetAddressRecord[]> => {
  const localResults = searchStreetAddressesLocal(query, limit)
  const remoteResults = await geocodeAddressQuery(query, Math.max(1, Math.floor(limit / 2)))

  const merged = [...localResults]
  for (const item of remoteResults) {
    if (!merged.some((existing) => existing.streetAddress === item.streetAddress && existing.suburb === item.suburb)) {
      merged.push(item)
    }
  }

  return merged.slice(0, limit)
}

export const estimateEntitlement = (record: StreetAddressRecord): EntitlementEstimate => {
  const zone = guidanceConfig.zones[record.footpathZone]
  return {
    zoneLabel: zone.label,
    likelyHours: zone.typicalHours,
    likelyMaxAreaSqm: zone.typicalMaxAreaSqm,
    clearanceRule: zone.clearanceRule
  }
}

export const getFootpathDataSourceNote = () => guidanceConfig.sourceNote

export const getRoadNameCoverage = () => ({
  source: roadNamesConfig.source,
  generatedAt: roadNamesConfig.generatedAt,
  roadCount: roadNamesConfig.roadCount
})

export const getCityLgaCoverage = () => {
  const suburbs = [...new Set(streetRecords.filter((r) => r.inCityLga).map((record) => record.suburb))].sort((a, b) =>
    a.localeCompare(b)
  )
  return {
    streetRecordCount: streetRecords.length,
    businessRecordCount: businessRecords.length,
    roadNameCount: roadNamesConfig.roadCount,
    suburbs,
    coverageNote:
      'Specific address certainty is based on matched local street/business records. When an address is not in the prototype sample, the checker can still suggest a City-wide road-name match, with optional geocoder suggestions when enabled.',
    lastUpdated: '2026-03-19',
    confidenceLabel: 'Medium (prototype local register + city-wide road names + optional geocoder)'
  }
}
