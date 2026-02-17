import type { ReactNode } from 'react'

interface Option {
  value: string
  label: string
  hint?: string
}

interface QuestionCardProps {
  id: string
  title: string
  hint?: string
  value?: string
  onChange: (value: string) => void
  options: Option[]
  isVisible: boolean
  rightSlot?: ReactNode
}

const QuestionCard = ({ id, title, hint, value, onChange, options, isVisible, rightSlot }: QuestionCardProps) => {
  if (!isVisible) return null

  return (
    <fieldset className="rounded-xl border border-civic-border bg-white p-4 shadow-sm sm:p-5">
      <legend className="w-full">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-civic-ink">{title}</h2>
            {hint ? <p className="mt-1 text-sm text-slate-600">{hint}</p> : null}
          </div>
          {rightSlot}
        </div>
      </legend>
      <div role="radiogroup" aria-labelledby={id} className="grid gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="cursor-pointer rounded-lg border border-civic-border p-3 text-sm transition hover:border-civic-accent focus-within:border-civic-accent"
          >
            <input
              className="mr-2 accent-civic-accent"
              type="radio"
              name={id}
              value={option.value}
              checked={value === option.value}
              onChange={(event) => onChange(event.target.value)}
            />
            <span className="font-medium text-civic-ink">{option.label}</span>
            {option.hint ? <p className="ml-6 mt-1 text-xs text-slate-500">{option.hint}</p> : null}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default QuestionCard
