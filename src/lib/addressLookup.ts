import cityLocationsData from '../data/cityLocations.json'
import footpathGuidanceData from '../data/footpathGuidance.json'

export type FootpathZone = 'local' | 'high_street' | 'city_centre' | 'special'

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

const records = cityLocationsData as StreetAddressRecord[]
const guidanceConfig = footpathGuidanceData as FootpathGuidanceConfig

export const searchStreetAddresses = (query: string, limit = 8): StreetAddressRecord[] => {
  const cleanQuery = query.trim().toLowerCase()
  if (!cleanQuery) return []

  return records
    .filter((record) => `${record.streetAddress} ${record.suburb} ${record.postcode}`.toLowerCase().includes(cleanQuery))
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
  const suburbs = [...new Set(records.map((record) => record.suburb))].sort((a, b) => a.localeCompare(b))
  return {
    totalRecords: records.length,
    suburbs
  }
}
