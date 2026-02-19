import { describe, expect, it } from 'vitest'
import { estimateEntitlement, getCityLgaCoverage, searchStreetAddresses } from '../src/lib/addressLookup'

describe('searchStreetAddresses', () => {
  it('matches by street name', () => {
    const results = searchStreetAddresses('George Street')
    expect(results.length).toBeGreaterThan(0)
  })

  it('matches by suburb', () => {
    const results = searchStreetAddresses('Barangaroo')
    expect(results.some((item) => item.suburb === 'Barangaroo')).toBe(true)
  })

  it('returns entitlement guidance for a selected record', () => {
    const [record] = searchStreetAddresses('Haymarket')
    const entitlement = estimateEntitlement(record)
    expect(entitlement.likelyMaxAreaSqm).toBeGreaterThan(0)
    expect(entitlement.likelyHours.length).toBeGreaterThan(0)
  })

  it('includes broad suburb coverage for City of Sydney', () => {
    const coverage = getCityLgaCoverage()
    expect(coverage.suburbs.length).toBeGreaterThan(25)
  })
})
