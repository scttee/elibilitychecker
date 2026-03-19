import { useEffect, useState } from 'react'
import { searchStreetAddresses, type StreetAddressRecord } from '../lib/addressLookup'

interface AddressLookupProps {
  onSelect: (record: StreetAddressRecord) => void
}

const sourceTypeLabel: Record<StreetAddressRecord['sourceType'], string> = {
  business_register: 'Business register',
  street_register: 'Street register',
  road_name_register: 'City road-name register',
  geocoder: 'Geocoder suggestion'
}

const AddressLookup = ({ onSelect }: AddressLookupProps) => {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<StreetAddressRecord | null>(null)
  const [results, setResults] = useState<StreetAddressRecord[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!query.trim()) {
        setResults([])
        return
      }

      setLoading(true)
      const matches = await searchStreetAddresses(query)
      if (!cancelled) {
        setResults(matches)
        setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [query])

  return (
    <section className="no-print mb-6 rounded-xl border border-civic-border bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-civic-ink">Street address lookup</h2>
      <p className="mt-1 text-sm text-slate-600">
        Type your business name, street, suburb, or full address. We search the prototype street/business register first,
        then the wider City road-name register, then optional geocoder suggestions if enabled.
      </p>

      <label className="mt-3 block text-sm font-medium text-civic-ink" htmlFor="address-lookup">
        Business name, street address, or suburb
      </label>
      <input
        id="address-lookup"
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mt-1 w-full rounded-lg border border-civic-border px-3 py-2 text-sm"
        placeholder="e.g. 45 George Street, Sydney"
      />

      {loading ? <p className="mt-2 text-xs text-slate-500">Finding matches...</p> : null}

      {results.length > 0 ? (
        <ul className="mt-3 space-y-2" role="listbox" aria-label="Street lookup results">
          {results.map((record) => (
            <li key={record.id}>
              <button
                type="button"
                className="w-full rounded-lg border border-civic-border p-3 text-left hover:border-civic-accent"
                onClick={() => {
                  setSelected(record)
                  setQuery(`${record.streetAddress}${record.suburb ? `, ${record.suburb}` : ''}`)
                  onSelect(record)
                }}
              >
                <p className="text-sm font-semibold text-civic-ink">
                  {record.businessName ? `${record.businessName} — ` : ''}
                  {record.streetAddress}{record.suburb ? `, ${record.suburb}` : ''}
                </p>
                <p className="text-xs text-slate-600">
                  {record.postcode ? `${record.postcode} · ` : ''}
                  {sourceTypeLabel[record.sourceType]}
                </p>
                {record.confidenceNote ? <p className="mt-1 text-xs text-amber-700">{record.confidenceNote}</p> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {selected ? (
        <div className="mt-3 rounded-lg border border-civic-accent/30 bg-civic-soft p-3 text-xs text-slate-700">
          Selected: {selected.streetAddress}{selected.suburb ? `, ${selected.suburb}` : ''}
        </div>
      ) : null}
    </section>
  )
}

export default AddressLookup
