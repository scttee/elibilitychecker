import { describe, expect, it, vi } from 'vitest'
import {
  estimateEntitlement,
  geocodeAddressQuery,
  getCityLgaCoverage,
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
    expect(coverage.lastUpdated).toMatch(/\d{4}-\d{2}-\d{2}/)
    expect(coverage.confidenceLabel).toContain('prototype')
  })

  it('merges async lookup results without crashing', async () => {
    const results = await searchStreetAddresses('George Street')
    expect(results.length).toBeGreaterThan(0)
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
  })
})
