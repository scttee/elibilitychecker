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

interface NominatimAddress {
  road?: string
  suburb?: string
  neighbourhood?: string
  quarter?: string
  city_district?: string
  city?: string
  municipality?: string
  county?: string
  state?: string
  postcode?: string
}

interface NominatimResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
  address?: NominatimAddress
}

interface ParsedAddressQuery {
  street?: string
  city?: string
  postalcode?: string
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
const geocoderViewbox = import.meta.env.VITE_GEOCODER_VIEWBOX ?? '151.151,-33.856,151.254,-33.939'
const geocoderBounded = import.meta.env.VITE_GEOCODER_BOUNDED ?? '1'
const geocoderEmail = import.meta.env.VITE_GEOCODER_EMAIL ?? ''

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

const parseAddressQuery = (query: string): ParsedAddressQuery => {
  const clean = query.trim().replace(/\s+/g, ' ')
  if (!clean) return {}

  const inferredSuburb = extractKnownSuburb(clean)
  const postcodeMatch = clean.match(/\b(2\d{3})\b/)

  let street = clean
  if (inferredSuburb) {
    street = street.replace(new RegExp(`,?\\s*${inferredSuburb}`, 'i'), '').trim()
  }
  if (postcodeMatch) {
    street = street.replace(postcodeMatch[1], '').trim().replace(/,$/, '').trim()
  }

  return {
    street: street || undefined,
    city: inferredSuburb ?? undefined,
    postalcode: postcodeMatch?.[1]
  }
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

const isLikelyCityOfSydneyResult = (address?: NominatimAddress) => {
  if (!address) return false

  const suburbCandidates = [address.suburb, address.neighbourhood, address.quarter, address.city_district, address.city]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase())

  if (suburbCandidates.some((value) => knownSuburbSet.has(value))) return true

  const municipality = `${address.municipality ?? ''} ${address.county ?? ''} ${address.city ?? ''}`.toLowerCase()
  return municipality.includes('city of sydney') || municipality.includes('council of the city of sydney')
}

const mapNominatimToRecord = (item: NominatimResult): StreetAddressRecord | null => {
  const address = item.address
  if (!isLikelyCityOfSydneyResult(address)) return null

  const suburb =
    address?.suburb ??
    address?.neighbourhood ??
    address?.quarter ??
    address?.city_district ??
    address?.city ??
    'City of Sydney'

  const suburbKey = suburb.toLowerCase()
  const mappedSuburb = knownSuburbSet.has(suburbKey) ? suburb : extractKnownSuburb(item.display_name) ?? 'City of Sydney'
  const mappedSuburbKey = mappedSuburb.toLowerCase()

  return {
    id: `geo-${item.place_id}`,
    streetAddress: address?.road ?? item.display_name,
    suburb: mappedSuburb,
    postcode: address?.postcode ?? postcodeBySuburb.get(mappedSuburbKey) ?? '',
    inCityLga: true,
    specialPrecinct: precinctBySuburb.get(mappedSuburbKey) ?? null,
    footpathZone: zoneBySuburb.get(mappedSuburbKey) ?? 'local',
    sourceType: 'geocoder',
    confidenceNote:
      mappedSuburb === 'City of Sydney'
        ? 'Live OpenStreetMap geocoder match. Add the suburb to improve zone confidence.'
        : 'Live OpenStreetMap geocoder match.'
  }
}

const buildNominatimSearchUrls = (query: string, limit: number) => {
  const freeformUrl = new URL('/search', geocoderBaseUrl)
  freeformUrl.searchParams.set('q', query.trim())
  freeformUrl.searchParams.set('format', 'jsonv2')
  freeformUrl.searchParams.set('addressdetails', '1')
  freeformUrl.searchParams.set('countrycodes', geocoderCountryCode)
  freeformUrl.searchParams.set('limit', String(limit))
  freeformUrl.searchParams.set('viewbox', geocoderViewbox)
  freeformUrl.searchParams.set('bounded', geocoderBounded)
  if (geocoderEmail) freeformUrl.searchParams.set('email', geocoderEmail)

  const parsed = parseAddressQuery(query)
  const structuredUrl = new URL('/search', geocoderBaseUrl)
  structuredUrl.searchParams.set('format', 'jsonv2')
  structuredUrl.searchParams.set('addressdetails', '1')
  structuredUrl.searchParams.set('countrycodes', geocoderCountryCode)
  structuredUrl.searchParams.set('limit', String(limit))
  structuredUrl.searchParams.set('viewbox', geocoderViewbox)
  structuredUrl.searchParams.set('bounded', geocoderBounded)
  if (geocoderEmail) structuredUrl.searchParams.set('email', geocoderEmail)
  if (parsed.street) structuredUrl.searchParams.set('street', parsed.street)
  if (parsed.city) structuredUrl.searchParams.set('city', parsed.city)
  if (parsed.postalcode) structuredUrl.searchParams.set('postalcode', parsed.postalcode)

  const urls = [freeformUrl]
  if (parsed.street || parsed.city || parsed.postalcode) {
    urls.push(structuredUrl)
  }
  return urls
}

export const geocodeAddressQuery = async (
  query: string,
  limit = 5,
  fetchFn: typeof fetch = fetch
): Promise<StreetAddressRecord[]> => {
  if (!enableGeocoding || geocoderProvider !== 'nominatim') return []

  const clean = query.trim()
  if (!clean) return []

  const urls = buildNominatimSearchUrls(clean, limit)

  try {
    const responses = await Promise.all(
      urls.map((url) =>
        fetchFn(url.toString(), {
          headers: {
            Accept: 'application/json'
          }
        })
      )
    )

    const payloads = await Promise.all(
      responses.map(async (response) => {
        if (!response.ok) return [] as NominatimResult[]
        return (await response.json()) as NominatimResult[]
      })
    )

    const merged = new Map<string, StreetAddressRecord>()
    for (const payload of payloads) {
      for (const item of payload.map(mapNominatimToRecord).filter((result): result is StreetAddressRecord => Boolean(result))) {
        const key = `${item.streetAddress}::${item.suburb}`
        if (!merged.has(key)) merged.set(key, item)
      }
    }

    return [...merged.values()].slice(0, limit)
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
      'Specific address certainty is based on matched local street/business records. When an address is not in the prototype sample, the checker now falls back to the City-wide road-name register and a live OpenStreetMap geocoder search bounded to the City of Sydney area.',
    lastUpdated: '2026-03-19',
    confidenceLabel: 'Medium (prototype local register + city-wide road names + live OSM geocoder)'
  }
}
