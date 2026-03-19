import { describe, expect, it } from 'vitest'
import {
  buildArcgisQueryUrl,
  extractRoadNamesFromFeatures,
  normaliseRoadName,
  pickRoadName
} from '../scripts/roadNamesImportUtils.mjs'

describe('road names import utils', () => {
  it('picks road name from known attribute keys', () => {
    expect(pickRoadName({ ROAD_NAME: 'George Street' })).toBe('George Street')
    expect(pickRoadName({ NAME: 'Kent Street' })).toBe('Kent Street')
  })

  it('normalises road name spacing and casing', () => {
    expect(normaliseRoadName('  george   street ')).toBe('George Street')
  })

  it('extracts unique sorted names from feature list', () => {
    const names = extractRoadNamesFromFeatures([
      { attributes: { ROAD_NAME: 'George Street' } },
      { attributes: { ROADNAME: 'george street' } },
      { attributes: { NAME: 'Kent Street' } }
    ])

    expect(names).toEqual(['George Street', 'Kent Street'])
  })

  it('builds paged ArcGIS URL', () => {
    const url = buildArcgisQueryUrl({
      endpoint: 'https://example.com/FeatureServer/0/query',
      pageSize: 1000,
      offset: 2000
    })

    expect(url.searchParams.get('resultRecordCount')).toBe('1000')
    expect(url.searchParams.get('resultOffset')).toBe('2000')
    expect(url.searchParams.get('f')).toBe('json')
  })
})
