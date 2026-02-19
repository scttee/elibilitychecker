import citySuburbsData from '../data/citySuburbs.json'
import footpathGuidanceData from '../data/footpathGuidance.json'

export type FootpathZone = 'local' | 'high_street' | 'city_centre' | 'special'

interface CitySuburbRecord {
  suburb: string
  postcode: string
  footpathZone: FootpathZone
  specialPrecinct: 'The Rocks' | 'Darling Harbour' | 'Barangaroo' | null
}

export interface StreetAddressRecord {
  id: string
  streetAddress: string
  suburb: string
  postcode: string
  inCityLga: boolean
  specialPrecinct: 'The Rocks' | 'Darling Harbour' | 'Barangaroo' | null
  footpathZone: FootpathZone
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

export interface EntitlementEstimate {
  zoneLabel: string
  likelyHours: string
  likelyMaxAreaSqm: number
  clearanceRule: string
}

const suburbs = citySuburbsData as CitySuburbRecord[]
const guidanceConfig = footpathGuidanceData as FootpathGuidanceConfig

const normalise = (value: string) => value.trim().toLowerCase()

const splitAddressQuery = (query: string) => {
  const parts = query.split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return { streetPart: parts[0], suburbPart: parts.slice(1).join(' ') }
  }
  return { streetPart: '', suburbPart: query.trim() }
}

const toRecord = (suburbRecord: CitySuburbRecord, streetPart: string): StreetAddressRecord => {
  const chosenStreet = streetPart.trim() || 'Any street'
  return {
    id: `${chosenStreet}-${suburbRecord.suburb}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    streetAddress: chosenStreet,
    suburb: suburbRecord.suburb,
    postcode: suburbRecord.postcode,
    inCityLga: true,
    specialPrecinct: suburbRecord.specialPrecinct,
    footpathZone: suburbRecord.footpathZone
  }
}

export const searchStreetAddresses = (query: string, limit = 8): StreetAddressRecord[] => {
  const cleanQuery = normalise(query)
  if (!cleanQuery) return []

  const { streetPart, suburbPart } = splitAddressQuery(query)
  const cleanSuburbPart = normalise(suburbPart)

  const suburbMatches = suburbs.filter((record) => normalise(record.suburb).includes(cleanSuburbPart))

  return suburbMatches.slice(0, limit).map((record) => toRecord(record, streetPart))
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

export const getCityLgaCoverage = () => ({
  suburbCount: suburbs.length,
  suburbs: suburbs.map((record) => record.suburb).sort((a, b) => a.localeCompare(b)),
  coverageNote: 'Lookup covers any street provided the suburb is within City of Sydney LGA.'
})
