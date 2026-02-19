import { useMemo, useState } from 'react'
import { searchBusinessAddresses, type BusinessAddressRecord } from '../lib/addressLookup'

interface AddressLookupProps {
  onSelect: (record: BusinessAddressRecord) => void
}

const AddressLookup = ({ onSelect }: AddressLookupProps) => {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<BusinessAddressRecord | null>(null)

  const results = useMemo(() => searchBusinessAddresses(query), [query])

  return (
    <section className="no-print mb-6 rounded-xl border border-civic-border bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-civic-ink">Business lookup (prototype pre-fill)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Start typing your business name or street address. This demo uses a local sample dataset. You can swap to City
        of Sydney data/API later.
      </p>

      <label className="mt-3 block text-sm font-medium text-civic-ink" htmlFor="business-lookup">
        Business name or address
      </label>
      <input
        id="business-lookup"
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mt-1 w-full rounded-lg border border-civic-border px-3 py-2 text-sm"
        placeholder="e.g. George Street or Harbour Lane Cafe"
        aria-describedby="lookup-help"
      />

      <p id="lookup-help" className="mt-1 text-xs text-slate-500">
        Select a result to pre-fill location context questions.
      </p>

      {results.length > 0 ? (
        <ul className="mt-3 space-y-2" role="listbox" aria-label="Business lookup results">
          {results.map((record) => (
            <li key={record.id}>
              <button
                type="button"
                className="w-full rounded-lg border border-civic-border p-3 text-left hover:border-civic-accent"
                onClick={() => {
                  setSelected(record)
                  setQuery(`${record.businessName} — ${record.streetAddress}`)
                  onSelect(record)
                }}
              >
                <p className="text-sm font-semibold text-civic-ink">{record.businessName}</p>
                <p className="text-xs text-slate-600">{record.streetAddress}</p>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {selected ? (
        <div className="mt-3 rounded-lg border border-civic-accent/30 bg-civic-soft p-3 text-xs text-slate-700">
          Selected: {selected.businessName}, {selected.streetAddress}
        </div>
      ) : null}
    </section>
  )
}

export default AddressLookup
