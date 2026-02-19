import { describe, expect, it } from 'vitest'
import { estimateEntitlement, getCityLgaCoverage, searchStreetAddresses } from '../src/lib/addressLookup'

describe('searchStreetAddresses', () => {
  it('matches specific street-register records', () => {
    const [result] = searchStreetAddresses('Dixon Street')
    expect(result.sourceType).toBe('street_register')
    expect(result.suburb).toBe('Haymarket')
  })

  it('matches specific business-register records', () => {
    const [result] = searchStreetAddresses('Harbour Lane Cafe')
    expect(result.sourceType).toBe('business_register')
    expect(result.businessName).toContain('Harbour Lane Cafe')
  })

  it('returns entitlement guidance for a selected record', () => {
    const [record] = searchStreetAddresses('George Street')
    const entitlement = estimateEntitlement(record)
    expect(entitlement.likelyMaxAreaSqm).toBeGreaterThan(0)
    expect(entitlement.likelyHours.length).toBeGreaterThan(0)
  })

  it('reports register coverage metadata', () => {
    const coverage = getCityLgaCoverage()
    expect(coverage.streetRecordCount).toBeGreaterThan(20)
    expect(coverage.businessRecordCount).toBeGreaterThan(3)
  })
})
