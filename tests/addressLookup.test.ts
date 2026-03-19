import { describe, expect, it, vi } from 'vitest'
import {
  estimateEntitlement,
  geocodeAddressQuery,
  getCityLgaCoverage,
  getRoadNameCoverage,
  searchStreetAddresses,
  searchStreetAddressesLocal
} from '../src/lib/addressLookup'

describe('address lookup', () => {
  it('matches specific street-register records locally', () => {
    const [result] = searchStreetAddressesLocal('Dixon Street')
    expect(result.sourceType).toBe('street_register')
    expect(result.suburb).toBe('Haymarket')
  })

  it('matches specific business-register records locally', () => {
    const [result] = searchStreetAddressesLocal('Harbour Lane Cafe')
    expect(result.sourceType).toBe('business_register')
    expect(result.businessName).toContain('Harbour Lane Cafe')
  })

  it('finds Bourke Street from the bundled road-name register even when the live geocoder is unavailable', () => {
    const [result] = searchStreetAddressesLocal('Bourke Street')
    expect(result.sourceType).toBe('road_name_register')
    expect(result.streetAddress).toBe('Bourke Street')
  })

  it('falls back to the city-wide road-name register for streets missing from the local sample', () => {
    const [result] = searchStreetAddressesLocal('King Street, Newtown')
    expect(result.sourceType).toBe('road_name_register')
    expect(result.suburb).toBe('Newtown')
    expect(result.confidenceNote).toContain('inferred')
  })

  it('returns a generic city-wide road match when no suburb is supplied', () => {
    const [result] = searchStreetAddressesLocal('Broadway')
    expect(result.streetAddress).toBe('Broadway')
    expect(result.suburb).toBe('Ultimo')
  })

  it('returns entitlement guidance for a selected record', () => {
    const [record] = searchStreetAddressesLocal('George Street')
    const entitlement = estimateEntitlement(record)
    expect(entitlement.likelyMaxAreaSqm).toBeGreaterThan(0)
    expect(entitlement.likelyHours.length).toBeGreaterThan(0)
  })

  it('reports register coverage metadata', () => {
    const coverage = getCityLgaCoverage()
    expect(coverage.streetRecordCount).toBeGreaterThan(20)
    expect(coverage.businessRecordCount).toBeGreaterThan(3)
    expect(coverage.roadNameCount).toBeGreaterThan(0)
    expect(coverage.lastUpdated).toMatch(/\d{4}-\d{2}-\d{2}/)
    expect(coverage.confidenceLabel).toContain('live OSM geocoder')
  })

  it('merges async lookup results without crashing', async () => {
    const results = await searchStreetAddresses('George Street')
    expect(results.length).toBeGreaterThan(0)
  })

  it('reports road-name register metadata', () => {
    const roads = getRoadNameCoverage()
    expect(roads.roadCount).toBeGreaterThan(0)
  })

  it('falls back safely when geocoder request throws', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('network blocked'))
    const results = await geocodeAddressQuery('George Street', 5, mockFetch as unknown as typeof fetch)
    expect(results).toEqual([])
  })

  it('maps geocoder results when enabled fetch returns valid suburb', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          place_id: 1,
          display_name: 'George Street, Sydney',
          address: {
            road: 'George Street',
            suburb: 'Sydney',
            postcode: '2000'
          }
        }
      ]
    })

    const results = await geocodeAddressQuery('George Street', 5, mockFetch as unknown as typeof fetch)
    expect(Array.isArray(results)).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('accepts city of sydney municipality matches from nominatim even when suburb is not in the sample set', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          place_id: 2,
          display_name: '1 Broadway, Sydney NSW 2007, Australia',
          address: {
            road: 'Broadway',
            municipality: 'Council of the City of Sydney',
            city: 'Sydney',
            postcode: '2007'
          }
        }
      ]
    })

    const [result] = await geocodeAddressQuery('1 Broadway, Sydney NSW 2007', 5, mockFetch as unknown as typeof fetch)
    expect(result.sourceType).toBe('geocoder')
    expect(result.suburb).toBe('Sydney')
    expect(result.confidenceNote).toContain('OpenStreetMap')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
