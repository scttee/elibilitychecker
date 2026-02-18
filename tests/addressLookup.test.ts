import { describe, expect, it } from 'vitest'
import { searchBusinessAddresses } from '../src/lib/addressLookup'

describe('searchBusinessAddresses', () => {
  it('matches by business name', () => {
    const results = searchBusinessAddresses('Harbour Lane')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].businessName).toContain('Harbour Lane')
  })

  it('matches by suburb/address text', () => {
    const results = searchBusinessAddresses('Barangaroo')
    expect(results.some((item) => item.suburb === 'Barangaroo')).toBe(true)
  })

  it('returns empty list for empty query', () => {
    expect(searchBusinessAddresses('')).toEqual([])
  })
})
