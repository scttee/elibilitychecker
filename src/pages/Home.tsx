import { useMemo, useState } from 'react'
import QuestionCard from '../components/QuestionCard'
import AddressLookup from '../components/AddressLookup'
import ResultSummary from '../components/ResultSummary'
import {
  estimateEntitlement,
  getCityLgaCoverage,
  getFootpathDataSourceNote,
  getRoadNameCoverage,
  type EntitlementEstimate,
  type StreetAddressRecord
} from '../lib/addressLookup'
import {
  getAddressSpecificChecklist,
  getConstraintSummary,
  getReadinessStatus
} from '../lib/outcomeGuidance'
import { evaluateEligibility, rulesConfig, type Responses } from '../lib/rulesEngine'

const initialResponses: Partial<Responses> = {}

const statusClass: Record<'green' | 'amber' | 'red', string> = {
  green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  red: 'border-rose-200 bg-rose-50 text-rose-900'
}

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

  const visibleQuestions = responses.hasExistingApproval === 'yes' ? [...questions, ...existingPermitQuestions] : questions

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
  const roadCoverage = getRoadNameCoverage()

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      <div className="mb-4 rounded-2xl border border-civic-accent/20 bg-gradient-to-r from-white to-civic-soft p-4">
        <p className="text-xs uppercase tracking-wide text-civic-accent font-semibold">City of Sydney prototype</p>
        <p className="mt-1 text-sm text-slate-700">Quick guidance for first-time hospitality operators.</p>
      </div>
      <header className="no-print mb-6 space-y-4">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-slate-800">
          <strong>Prototype guidance only.</strong> Requirements vary by location and circumstances. Council will
          confirm during assessment.
        </div>
        <h1 className="text-2xl font-semibold text-civic-ink sm:text-3xl">Outdoor Dining Eligibility Checker (prototype)</h1>
        <p className="text-sm text-slate-700 sm:text-base">
          Made for first-time cafe and small business owners.
          Pick your address, answer a few questions, and get a simple list of what to do next.
        </p>
      </header>

      <AddressLookup onSelect={applyAddressPrefill} />

      <section className="no-print mb-6 rounded-xl border border-civic-border bg-civic-soft p-4 text-sm text-slate-700">
        <h2 className="font-semibold text-civic-ink">Address data used in this prototype</h2>
        <p className="mt-1">
          Loaded {coverage.streetRecordCount} street records and {coverage.businessRecordCount} business records across{' '}
          {coverage.suburbs.length} City of Sydney suburbs. Road-name register loaded: {roadCoverage.roadCount}.
        </p>
        <p className="mt-1 text-xs text-slate-600">{coverage.coverageNote}</p>
        <p className="mt-1 text-xs text-slate-600">
          Last updated: {coverage.lastUpdated}. Confidence level: {coverage.confidenceLabel}.
          Road register snapshot: {roadCoverage.generatedAt}.
        </p>
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
          {(() => {
            const status = getReadinessStatus(result, responses as Responses)
            return (
              <section className={`rounded-xl border p-4 text-sm ${statusClass[status.level]}`}>
                <h2 className="font-semibold">{status.title}</h2>
                <p className="mt-1">{status.message}</p>
              </section>
            )
          })()}

          <div className="rounded-xl border border-civic-accent/30 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-civic-accent">Your likely outdoor dining limits (guide only)</p>
            <p className="mt-1 text-sm text-civic-ink">
              <strong>
                {selectedAddress.streetAddress}, {selectedAddress.suburb}
              </strong>{' '}
              is treated as <strong>{entitlement.zoneLabel}</strong>.
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
              <li>Likely operating hours: {entitlement.likelyHours}</li>
              <li>Likely maximum area: up to about {entitlement.likelyMaxAreaSqm}m² (site dependent)</li>
              <li>{entitlement.clearanceRule}</li>
            </ul>
            <p className="mt-2 text-xs text-slate-600">{getFootpathDataSourceNote()}</p>
          </div>

          <section className="rounded-xl border border-civic-border bg-white p-4 text-sm">
            <h2 className="font-semibold text-civic-ink">Important things to check for this address</h2>
            <ul className="mt-2 list-disc pl-5 text-slate-700">
              {getConstraintSummary(responses as Responses, selectedAddress).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-civic-border bg-white p-4 text-sm">
            <h2 className="font-semibold text-civic-ink">Your address-specific checklist</h2>
            <ul className="mt-2 list-disc pl-5 text-slate-700">
              {getAddressSpecificChecklist(result, responses as Responses, selectedAddress).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

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

          {responses.needClearanceHelp === 'yes' ? (
            <section className="rounded-xl border border-civic-border bg-white p-4 text-sm">
              <h2 className="font-semibold text-civic-ink">Need help with pedestrian clearances?</h2>
              <p className="mt-2 text-slate-700">
                Start with these links. If still unsure, call City of Sydney and ask to speak with the duty planner.
              </p>
              <ul className="mt-2 list-disc pl-5 text-slate-700">
                <li>
                  <a
                    className="text-civic-accent underline"
                    href="https://www.cityofsydney.nsw.gov.au/business-permits-approvals-tenders/outdoor-dining"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Outdoor dining information
                  </a>
                </li>
                <li>
                  <a
                    className="text-civic-accent underline"
                    href="https://www.cityofsydney.nsw.gov.au/-/media/corporate/files/projects/policy-planning-changes/your-say-proposed-changes-outdoor-dining/attachment-c---draft-outdoor-dining-guidelines---for-exhibition_accessible_bb.pdf?download=true"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Draft outdoor dining guidelines (PDF)
                  </a>
                </li>
                <li>
                  Call City of Sydney on <strong>(02) 9265 9333</strong> and ask for the duty planner.
                </li>
              </ul>
            </section>
          ) : null}

          <section className="rounded-xl border border-civic-border bg-white p-4 text-sm">
            <h2 className="font-semibold text-civic-ink">Still not sure?</h2>
            <p className="mt-2 text-slate-700">
              Call City of Sydney on <strong>(02) 9265 9333</strong>.
              Ask for the duty planner before you spend money on plans or drawings.
            </p>
          </section>
        </section>
      ) : null}
    </main>
  )
}

export default Home
