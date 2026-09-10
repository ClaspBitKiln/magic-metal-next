export type AgentName =
  | 'orchestrator'
  | 'rfq-parser'
  | 'product-identity'
  | 'supplier-discovery'
  | 'supplier-verification'
  | 'offer-normalizer'
  | 'technical'
  | 'logistics'
  | 'split-procurement'
  | 'ranking'
  | 'benchmark'
  | 'margin'
  | 'risk'
  | 'quote'
  | 'qa'
  | 'knowledge'

export type AgentStatus = 'completed' | 'needs_clarification' | 'blocked' | 'failed'
export type EvidenceLevel = 'confirmed' | 'observed' | 'reference' | 'inferred' | 'unknown'
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none'

export type Evidence = {
  id: string
  level: EvidenceLevel
  sourceType: 'supplier' | 'manufacturer' | 'market' | 'technical' | 'calculation' | 'internal' | 'client'
  sourceRef?: string
  claim: string
  observedAt?: string
  expiresAt?: string
}

export type WarningCode =
  | 'missing-field'
  | 'technical-mismatch'
  | 'unverified-source'
  | 'stale-data'
  | 'no-procurement-route'
  | 'price-missing'
  | 'availability-uncertain'
  | 'logistics-uncertain'
  | 'split-required'
  | 'client-clarification-required'
  | 'policy-blocked'

export type Warning = {
  code: WarningCode
  message: string
  severity: 'info' | 'warning' | 'critical'
  field?: string
  itemId?: string
}

export type NextAction = {
  agent: AgentName | 'human'
  action: string
  reason: string
  required: boolean
}

export type AgentTask<TInput = unknown> = {
  taskId: string
  workflowId: string
  parentTaskId?: string
  agent: AgentName
  input: TInput
  constraints: string[]
  deadline?: string
  createdAt: string
  attempt: number
}

export type AgentResult<TOutput = unknown> = {
  taskId: string
  workflowId: string
  agent: AgentName
  status: AgentStatus
  output: TOutput
  evidence: Evidence[]
  confidence: ConfidenceLevel
  warnings: Warning[]
  nextAction?: NextAction
  completedAt: string
}

export type OrchestratorDecision = {
  task: AgentTask
  acceptedEvidence: Evidence[]
  rejectedEvidence: Evidence[]
  next: NextAction[]
}

const evidenceRank: Record<EvidenceLevel, number> = {
  unknown: 0,
  inferred: 1,
  reference: 2,
  observed: 3,
  confirmed: 4,
}

export function canUpgradeEvidence(previous: EvidenceLevel, next: EvidenceLevel): boolean {
  return evidenceRank[next] > evidenceRank[previous]
}

export function createTask<TInput>(input: Omit<AgentTask<TInput>, 'createdAt' | 'attempt'>): AgentTask<TInput> {
  return { ...input, createdAt: new Date().toISOString(), attempt: 1 }
}

export function createResult<TOutput>(input: Omit<AgentResult<TOutput>, 'completedAt'>): AgentResult<TOutput> {
  return { ...input, completedAt: new Date().toISOString() }
}

export function isClientSafeResult(result: AgentResult): boolean {
  const forbidden = /supplier|source|purchase\s*price|margin|ranking\s*score|offer\s*id|reliability\s*score/i
  return !forbidden.test(JSON.stringify(result.output)) && !forbidden.test(JSON.stringify(result.warnings))
}
