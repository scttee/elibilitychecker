import { useMemo, useState } from 'react'
import QuestionCard from '../components/QuestionCard'
import AddressLookup from '../components/AddressLookup'
import ResultSummary from '../components/ResultSummary'
import {
  estimateEntitlement,
  getCityLgaCoverage,
  getFootpathDataSourceNote,
  type EntitlementEstimate,
  type StreetAddressRecord
} from '../lib/addressLookup'
import { evaluateEligibility, rulesConfig, type Responses } from '../lib/rulesEngine'

const initialResponses: Partial<Responses> = {}

const Home = () => {
  const [responses, setResponses] = useState<Partial<Responses>>(initialResponses)
  const [selectedAddress, setSelectedAddress] = useState<StreetAddressRecord | null>(null)
  const [entitlement, setEntitlement] = useState<EntitlementEstimate | null>(null)

  const questions = [
    {
      key: 'hasExistingApproval',
      title: 'Do you already have an outdoor dining approval with City of Sydney?',
      options: [
        { value: 'no', label: 'No, this is a new application' },
        { value: 'yes', label: 'Yes, we already have approval' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      key: 'locationType',
      title: 'Where will your outdoor dining be?',
      options: [
        { value: 'footpath', label: 'Footpath / public land' },
        { value: 'road', label: 'Car parking space on street' },
        { value: 'both', label: 'Both' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      key: 'servingAlcohol',
      title: 'Will you serve alcohol outdoors?',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'not_sure', label: 'Not sure' }
      ]
    },
    {
      key: 'needClearanceHelp',
      title: 'Do you need help understanding pedestrian clearances?',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' }
      ]
    }
  ] as const

  const existingPermitQuestions = [
    {
      key: 'operatorChangeOnly',
      title: 'Are you changing operator only?',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' }
      ]
    },
    {
      key: 'changingLayoutOrArea',
      title: 'Are you changing layout or increasing area?',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' }
      ]
    },
    {
      key: 'changingHours',
      title: 'Are you changing hours?',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' }
      ]
    }
  ] as const

  const visibleQuestions =
    responses.hasExistingApproval === 'yes' ? [...questions, ...existingPermitQuestions] : questions

  const requiredKeys = visibleQuestions.map((question) => question.key)
  const answeredCount = requiredKeys.filter((key) => Boolean(responses[key])).length
  const canEvaluate = requiredKeys.every((key) => Boolean(responses[key])) && Boolean(selectedAddress)

  const result = useMemo(() => (canEvaluate ? evaluateEligibility(responses as Responses) : null), [canEvaluate, responses])

  const handleAnswer = (key: keyof Responses, value: string) => {
    setResponses((prev) => ({ ...prev, [key]: value }))
  }

  const applyAddressPrefill = (record: StreetAddressRecord) => {
    setSelectedAddress(record)
    setEntitlement(estimateEntitlement(record))
    setResponses((prev) => ({
      ...prev,
      inCityLga: record.inCityLga ? 'yes' : 'no',
      inSpecialPrecinct: record.specialPrecinct ? 'yes' : 'no'
    }))
  }

  const coverage = getCityLgaCoverage()

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <header className="no-print mb-6 space-y-4">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-slate-800">
          <strong>Prototype guidance only.</strong> Requirements vary by location and circumstances. Council will
          confirm during assessment.
        </div>
        <h1 className="text-2xl font-semibold text-civic-ink sm:text-3xl">Outdoor Dining Eligibility Checker (prototype)</h1>
        <p className="text-sm text-slate-700 sm:text-base">
          This version focuses on new City of Sydney outdoor dining applications. Enter your street location to see a
          likely hours and space range, then get a clear new-application checklist.
        </p>
      </header>

      <AddressLookup onSelect={applyAddressPrefill} />

      <section className="no-print mb-6 rounded-xl border border-civic-border bg-civic-soft p-4 text-sm text-slate-700">
        <h2 className="font-semibold text-civic-ink">City of Sydney location coverage in this prototype</h2>
        <p className="mt-1">
          Covers {coverage.suburbCount} City of Sydney suburbs and supports any street entered within those suburbs.
        </p>
        <p className="mt-1 text-xs text-slate-600">{coverage.coverageNote}</p>
      </section>

      <section className="no-print mb-6 rounded-xl border border-civic-border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm text-slate-700">
          <span>Progress</span>
          <span>
            {answeredCount} / {requiredKeys.length}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-civic-accent transition-all" style={{ width: `${(answeredCount / requiredKeys.length) * 100}%` }} />
        </div>
      </section>

      <section className="no-print space-y-4" aria-label="Eligibility questions">
        {visibleQuestions.map((question, index) => (
          <QuestionCard
            key={question.key}
            id={question.key}
            title={question.title}
            options={question.options}
            value={responses[question.key]}
            onChange={(value) => handleAnswer(question.key, value)}
            isVisible={index === 0 || Boolean(responses[visibleQuestions[index - 1].key])}
          />
        ))}
      </section>

      {result && selectedAddress && entitlement ? (
        <section className="mt-6 space-y-4" aria-live="polite">
          <div className="rounded-xl border border-civic-accent/30 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-civic-accent">Likely footpath entitlement (prototype)</p>
            <p className="mt-1 text-sm text-civic-ink">
              <strong>{selectedAddress.streetAddress}, {selectedAddress.suburb}</strong> is treated as <strong>{entitlement.zoneLabel}</strong>.
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
              <li>Likely operating hours: {entitlement.likelyHours}</li>
              <li>Likely maximum area: up to about {entitlement.likelyMaxAreaSqm}m² (site dependent)</li>
              <li>{entitlement.clearanceRule}</li>
            </ul>
            <p className="mt-2 text-xs text-slate-600">{getFootpathDataSourceNote()}</p>
          </div>

          <div className="no-print flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg bg-civic-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Save / Print summary
            </button>
            <button
              type="button"
              onClick={() => {
                setResponses(initialResponses)
                setSelectedAddress(null)
                setEntitlement(null)
              }}
              className="rounded-lg border border-civic-border px-4 py-2 text-sm font-medium text-civic-ink"
            >
              Start again
            </button>
          </div>

          <ResultSummary result={result} sourceSummary={rulesConfig.sourceSummary} sourceLinks={rulesConfig.sourceLinks} />

          <section className="rounded-xl border border-civic-border bg-white p-4 text-sm">
            <h2 className="font-semibold text-civic-ink">Not sure?</h2>
            <p className="mt-2 text-slate-700">
              Call City of Sydney on <strong>(02) 0000 0000</strong> (placeholder). If anything is unclear, contact
              council before lodging and before spending money on detailed drawings.
            </p>
          </section>
        </section>
      ) : null}
    </main>
  )
}

export default Home
