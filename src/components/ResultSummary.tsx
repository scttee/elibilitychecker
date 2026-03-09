import type { ReactNode } from 'react'
import { ArrowPathIcon, ClipboardIcon, WarningIcon } from './Icons'
import type { EvaluationResult } from '../lib/rulesEngine'

interface ResultSummaryProps {
  result: EvaluationResult
  sourceSummary: string
  sourceLinks: Array<{ label: string; url: string }>
}

const Section = ({ title, items, icon }: { title: string; items: string[]; icon: ReactNode }) => (
  <section className="rounded-xl border border-civic-border bg-white p-4 sm:p-5">
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-civic-accent">
      {icon}
      {title}
    </h3>
    <ul className="space-y-2 text-sm text-civic-ink">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden="true" className="mt-1 h-2 w-2 rounded-full bg-civic-accent" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </section>
)

const ResultSummary = ({ result, sourceSummary, sourceLinks }: ResultSummaryProps) => (
  <section className="print-surface space-y-4 rounded-2xl border border-civic-border bg-civic-soft p-4 shadow-sm sm:p-6">
    <div className="rounded-xl border border-civic-accent/30 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-civic-accent">Likely pathway</p>
      <p className="mt-1 text-lg font-semibold text-civic-ink">{result.pathwayLabel}</p>
      <p className="mt-2 text-sm text-slate-600">This is a likely pathway. Council will confirm requirements during assessment.</p>
    </div>

    <Section
      title="What you will usually need"
      items={result.checklist}
      icon={<ClipboardIcon className="h-4 w-4" title="Checklist" />}
    />

    <Section
      title="What you probably do not need yet"
      items={result.notNeededYet}
      icon={<WarningIcon className="h-4 w-4" title="Not needed yet" />}
    />

    <Section
      title="What happens next"
      items={result.nextSteps}
      icon={<ArrowPathIcon className="h-4 w-4" title="Next steps" />}
    />

    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h3 className="text-sm font-semibold text-civic-warn">Important notes</h3>
      <ul className="mt-2 space-y-2 text-sm text-slate-700">
        {result.warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </section>

    <details className="rounded-xl border border-civic-border bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-civic-ink">What we based this on</summary>
      <p className="mt-2 text-sm text-slate-700">{sourceSummary}</p>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {sourceLinks.map((link) => (
          <li key={link.url}>
            <a className="text-civic-accent underline" href={link.url} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </details>
  </section>
)

export default ResultSummary
