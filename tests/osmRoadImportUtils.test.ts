import { describe, expect, it } from 'vitest'
import { buildOverpassRoadQuery, extractRoadNamesFromOsmElements } from '../scripts/osmRoadImportUtils.mjs'

describe('osm road import utils', () => {
  it('builds an Overpass query for a relation area', () => {
    const query = buildOverpassRoadQuery({ relationId: '1251066' })
    expect(query).toContain('relation(1251066)')
    expect(query).toContain('way["highway"]["name"]')
  })

  it('extracts unique sorted road names from OSM elements', () => {
    const roads = extractRoadNamesFromOsmElements([
      { tags: { name: 'george street' } },
      { tags: { name: 'George Street' } },
      { tags: { name: 'King Street' } }
    ])

    expect(roads).toEqual(['George Street', 'King Street'])
  })
})
