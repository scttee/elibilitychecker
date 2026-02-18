import sampleBusinessAddresses from '../data/businessAddresses.json'

export interface BusinessAddressRecord {
  id: string
  businessName: string
  streetAddress: string
  suburb: string
  postcode: string
  inCityLga: boolean
  specialPrecinct: 'The Rocks' | 'Darling Harbour' | 'Barangaroo' | null
  locationTypeHint: 'footpath' | 'road' | 'both' | 'not_sure'
}

const records = sampleBusinessAddresses as BusinessAddressRecord[]

export const searchBusinessAddresses = (query: string, limit = 6): BusinessAddressRecord[] => {
  const cleanQuery = query.trim().toLowerCase()
  if (!cleanQuery) return []

  return records
    .filter((record) => {
      const haystack = `${record.businessName} ${record.streetAddress} ${record.suburb} ${record.postcode}`.toLowerCase()
      return haystack.includes(cleanQuery)
    })
    .slice(0, limit)
}

export const getDatasetCandidates = () => [
  {
    name: 'City of Sydney Open Data portal datasets',
    purpose: 'Primary source for local spatial/open datasets and discoverable APIs.',
    url: 'https://data.cityofsydney.nsw.gov.au/'
  },
  {
    name: 'NSW Planning Portal spatial datasets',
    purpose: 'Jurisdiction, zoning and planning overlays that influence pathway logic.',
    url: 'https://www.planningportal.nsw.gov.au/spatialviewer'
  },
  {
    name: 'data.gov.au (Australian open data catalogue)',
    purpose: 'National and NSW datasets, including address and business reference datasets.',
    url: 'https://data.gov.au/'
  },
  {
    name: 'ABR (Australian Business Register) ABN Lookup web services',
    purpose: 'Business identity enrichment (ABN/legal name) to prefill organisation fields.',
    url: 'https://abr.business.gov.au/Help/WebServices'
  }
]
