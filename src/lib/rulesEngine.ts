import rulesData from '../data/rules.json'

export type Answer = 'yes' | 'no' | 'not_sure' | 'footpath' | 'road' | 'both'

export interface Responses {
  hasExistingApproval: 'yes' | 'no' | 'not_sure'
  locationType: 'footpath' | 'road' | 'both' | 'not_sure'
  operatorChangeOnly?: 'yes' | 'no'
  changingLayoutOrArea?: 'yes' | 'no'
  changingHours?: 'yes' | 'no'
  servingAlcohol: 'yes' | 'no' | 'not_sure'
  inCityLga: 'yes' | 'no' | 'not_sure'
  inSpecialPrecinct: 'yes' | 'no' | 'not_sure'
  needClearanceHelp: 'yes' | 'no'
}

export interface Rule {
  id: string
  priority: number
  when: Partial<Record<keyof Responses, Answer | Answer[]>>
  pathway: string
  checklist: string[]
  notNeededYet: string[]
  warnings: string[]
  nextSteps: string[]
}

export interface RulesConfig {
  sourceSummary: string
  sourceLinks: Array<{ label: string; url: string }>
  pathways: Record<string, string>
  defaultChecklist: string[]
  defaultNotNeededYet: string[]
  defaultWarnings: string[]
  defaultNextSteps: string[]
  rules: Rule[]
}

export interface EvaluationResult {
  pathwayKey: string
  pathwayLabel: string
  checklist: string[]
  notNeededYet: string[]
  warnings: string[]
  nextSteps: string[]
  matchedRuleId: string
}

export const rulesConfig = rulesData as RulesConfig

const asArray = (value: Answer | Answer[]): Answer[] => (Array.isArray(value) ? value : [value])

const matchesRule = (rule: Rule, responses: Responses): boolean =>
  Object.entries(rule.when).every(([key, expected]) => {
    const answer = responses[key as keyof Responses] as Answer | undefined
    if (!answer) return false
    return asArray(expected as Answer | Answer[]).includes(answer)
  })

export const evaluateEligibility = (responses: Responses, config: RulesConfig = rulesConfig): EvaluationResult => {
  const sortedRules = [...config.rules].sort((a, b) => b.priority - a.priority)
  const matchedRule = sortedRules.find((rule) => matchesRule(rule, responses))

  const pathwayKey = matchedRule?.pathway ?? 'new_application'
  return {
    pathwayKey,
    pathwayLabel: config.pathways[pathwayKey] ?? 'Pathway to be confirmed by council',
    checklist: [...config.defaultChecklist, ...(matchedRule?.checklist ?? [])],
    notNeededYet: [...config.defaultNotNeededYet, ...(matchedRule?.notNeededYet ?? [])],
    warnings: [...config.defaultWarnings, ...(matchedRule?.warnings ?? [])],
    nextSteps: matchedRule?.nextSteps ?? config.defaultNextSteps,
    matchedRuleId: matchedRule?.id ?? 'fallback_default'
  }
}
