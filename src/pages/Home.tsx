import { useMemo, useState } from 'react'
import QuestionCard from '../components/QuestionCard'
import AddressLookup from '../components/AddressLookup'
import ResultSummary from '../components/ResultSummary'
import { evaluateEligibility, rulesConfig, type Responses } from '../lib/rulesEngine'
import type { BusinessAddressRecord } from '../lib/addressLookup'

const initialResponses: Partial<Responses> = {}

const questions = [
  {
    key: 'hasExistingApproval',
    title: 'Do you already have an outdoor dining approval with City of Sydney?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
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
    key: 'inCityLga',
    title: 'Is this in City of Sydney LGA?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'not_sure', label: 'Not sure' }
    ]
  },
  {
    key: 'inSpecialPrecinct',
    title: 'Is the location in The Rocks, Darling Harbour, or Barangaroo?',
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

const Home = () => {
  const [responses, setResponses] = useState<Partial<Responses>>(initialResponses)

  const [prefillRecord, setPrefillRecord] = useState<BusinessAddressRecord | null>(null)

  const answeredCount = Object.keys(responses).length
  const canEvaluate = answeredCount === questions.length

  const result = useMemo(
    () => (canEvaluate ? evaluateEligibility(responses as Responses) : null),
    [canEvaluate, responses]
  )

  const handleAnswer = (key: keyof Responses, value: string) => {
    setResponses((prev) => ({ ...prev, [key]: value }))
  }

  const applyAddressPrefill = (record: BusinessAddressRecord) => {
    setPrefillRecord(record)
    setResponses((prev) => ({
      ...prev,
      inCityLga: record.inCityLga ? 'yes' : 'no',
      inSpecialPrecinct: record.specialPrecinct ? 'yes' : 'no',
      locationType: prev.locationType ?? record.locationTypeHint
    }))
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <header className="no-print mb-6 space-y-4">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-slate-800">
          <strong>Prototype guidance only.</strong> Requirements vary by location and circumstances. Council will
          confirm during assessment.
        </div>
        <h1 className="text-2xl font-semibold text-civic-ink sm:text-3xl">Outdoor Dining Eligibility Checker (prototype)</h1>
        <p className="text-sm text-slate-700 sm:text-base">
          A quick guided flow for City of Sydney businesses. Answer a few short questions to see your likely pathway,
          what to prepare now, and what can wait.
        </p>
      </header>

      <AddressLookup onSelect={applyAddressPrefill} />

      {prefillRecord ? (
        <section className="no-print mb-6 rounded-xl border border-civic-border bg-civic-soft p-4 text-sm text-slate-700">
          <h2 className="font-semibold text-civic-ink">Pre-filled location context</h2>
          <p className="mt-1">
            Based on <strong>{prefillRecord.businessName}</strong>, we pre-filled City of Sydney LGA and special
            precinct answers. Please review and adjust if needed.
          </p>
        </section>
      ) : null}

      <section className="no-print mb-6 rounded-xl border border-civic-border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm text-slate-700">
          <span>Progress</span>
          <span>
            {answeredCount} / {questions.length}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-civic-accent transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
        </div>
      </section>

      <section className="no-print space-y-4" aria-label="Eligibility questions">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.key}
            id={question.key}
            title={question.title}
            options={question.options}
            value={responses[question.key]}
            onChange={(value) => handleAnswer(question.key, value)}
            isVisible={index === 0 || Boolean(responses[questions[index - 1].key])}
          />
        ))}
      </section>

      {result ? (
        <section className="mt-6 space-y-4" aria-live="polite">
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
                setPrefillRecord(null)
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
