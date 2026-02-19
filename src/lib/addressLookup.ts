import cityLocationsData from '../data/cityLocations.json'
import businessAddressesData from '../data/businessAddresses.json'
import footpathGuidanceData from '../data/footpathGuidance.json'

export type FootpathZone = 'local' | 'high_street' | 'city_centre' | 'special'

interface CityLocationRecord {
  id: string
  streetAddress: string
  suburb: string
  postcode: string
  inCityLga: boolean
  specialPrecinct: 'The Rocks' | 'Darling Harbour' | 'Barangaroo' | null
  footpathZone: FootpathZone
}

interface BusinessAddressRecord {
  id: string
  businessName: string
  streetAddress: string
  suburb: string
  postcode: string
  inCityLga: boolean
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
  sourceType: 'street_register' | 'business_register'
  businessName?: string
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

const streetRecords = cityLocationsData as CityLocationRecord[]
const businessRecords = businessAddressesData as BusinessAddressRecord[]
const guidanceConfig = footpathGuidanceData as FootpathGuidanceConfig

const zoneBySuburb = new Map(streetRecords.map((record) => [record.suburb, record.footpathZone]))

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
  footpathZone: zoneBySuburb.get(record.suburb) ?? 'local',
  sourceType: 'business_register',
  businessName: record.businessName
})

const registry = [...streetRecords.map(toStreetRecord), ...businessRecords.map(toBusinessRecord)]

export const searchStreetAddresses = (query: string, limit = 10): StreetAddressRecord[] => {
  const cleanQuery = query.trim().toLowerCase()
  if (!cleanQuery) return []

  return registry
    .filter((record) => {
      const haystack = `${record.businessName ?? ''} ${record.streetAddress} ${record.suburb} ${record.postcode}`.toLowerCase()
      return haystack.includes(cleanQuery)
    })
    .slice(0, limit)
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

export const getCityLgaCoverage = () => {
  const suburbs = [...new Set(streetRecords.filter((r) => r.inCityLga).map((record) => record.suburb))].sort((a, b) => a.localeCompare(b))
  return {
    streetRecordCount: streetRecords.length,
    businessRecordCount: businessRecords.length,
    suburbs,
    coverageNote: 'Specific address certainty is based on matched records in the local street/business registers.'
  }
}
