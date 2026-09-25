import type {
  AgentName,
  AgentResult,
  AgentStatus,
  Evidence,
  EvidenceLevel,
  Warning,
} from './contracts'

export type SwarmTask = {
  id: string
  agent: AgentName
  input: unknown
  dependsOn?: string[]
  critical?: boolean
  timeoutMs?: number
  maxAttempts?: number
}

export type SwarmRun = {
  workflowId: string
  tasks: SwarmTask[]
  startedAt: string
}

export type SwarmState = {
  run: SwarmRun
  results: Record<string, AgentResult>
  evidence: Evidence[]
  warnings: Warning[]
  status: 'running' | 'completed' | 'blocked' | 'failed'
  nextActions: string[]
}

export type AgentExecutor = (task: SwarmTask, state: Readonly<SwarmState>) => Promise<AgentResult>

const evidenceRank: Record<EvidenceLevel, number> = {
  unknown: 0,
  inferred: 1,
  reference: 2,
  observed: 3,
  confirmed: 4,
}

function dedupeEvidence(items: Evidence[]): Evidence[] {
  const best = new Map<string, Evidence>()
  for (const item of items) {
    const key = item.claim.trim().toLowerCase()
    const previous = best.get(key)
    if (!previous || evidenceRank[item.level] > evidenceRank[previous.level]) best.set(key, item)
  }
  return [...best.values()]
}

function ready(tasks: SwarmTask[], results: Record<string, AgentResult>): SwarmTask[] {
  return tasks.filter((task) =>
    !results[task.id] &&
    (task.dependsOn ?? []).every((dependency) => results[dependency]?.status === 'completed'),
  )
}

function failedDependency(task: SwarmTask, results: Record<string, AgentResult>): boolean {
  return (task.dependsOn ?? []).some((dependency) => {
    const status = results[dependency]?.status
    return status === 'failed' || status === 'blocked'
  })
}

/**
 * Autonomous swarm supervisor.
 *
 * TRIZ principles:
 * - remove the human from the control loop;
 * - parallelize independent work;
 * - keep deterministic calculations outside the LLM;
 * - require evidence for claims;
 * - turn failures into retry/block states instead of asking an operator.
 */
export async function runSwarm(
  run: SwarmRun,
  execute: AgentExecutor,
  options: { maxParallel?: number } = {},
): Promise<SwarmState> {
  const state: SwarmState = {
    run,
    results: {},
    evidence: [],
    warnings: [],
    status: 'running',
    nextActions: [],
  }
  const maxParallel = Math.max(1, options.maxParallel ?? 4)

  while (Object.keys(state.results).length < run.tasks.length) {
    const blocked = run.tasks.filter((task) => !state.results[task.id] && failedDependency(task, state.results))
    for (const task of blocked) {
      state.results[task.id] = {
        taskId: task.id,
        workflowId: run.workflowId,
        agent: task.agent,
        status: 'blocked',
        output: null,
        evidence: [],
        confidence: 'none',
        warnings: [{
          code: 'policy-blocked',
          message: 'Dependency failed or was blocked.',
          severity: task.critical ? 'critical' : 'warning',
        }],
        completedAt: new Date().toISOString(),
      }
    }

    const batch = ready(run.tasks, state.results).slice(0, maxParallel)
    if (!batch.length) break

    const results = await Promise.all(batch.map(async (task) => {
      const attempts = Math.max(1, task.maxAttempts ?? 2)
      let last: AgentResult | undefined
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          last = await execute(task, state)
          if (last.status !== 'failed') return last
        } catch (error) {
          last = {
            taskId: task.id,
            workflowId: run.workflowId,
            agent: task.agent,
            status: 'failed',
            output: null,
            evidence: [],
            confidence: 'none',
            warnings: [{
              code: 'unverified-source',
              message: error instanceof Error ? error.message : String(error),
              severity: task.critical ? 'critical' : 'warning',
            }],
            completedAt: new Date().toISOString(),
          }
        }
      }
      return last!
    }))

    for (const result of results) {
      state.results[result.taskId] = result
      state.evidence = dedupeEvidence([...state.evidence, ...result.evidence])
      state.warnings.push(...result.warnings)
    }
  }

  const criticalFailures = run.tasks.some((task) => {
    const result = state.results[task.id]
    return task.critical && (!result || result.status === 'failed' || result.status === 'blocked')
  })

  state.status = criticalFailures
    ? 'blocked'
    : Object.keys(state.results).length === run.tasks.length
      ? 'completed'
      : 'failed'

  if (state.status !== 'completed') {
    state.nextActions.push('retry_failed_tasks')
    state.nextActions.push('preserve_evidence_and_do_not_fabricate')
  }

  return state
}

/** Standard Magic Metal procurement graph. */
export function createProcurementSwarmRun(workflowId: string, input: unknown): SwarmRun {
  const tasks: SwarmTask[] = [
    { id: 'triage', agent: 'orchestrator', input, critical: true },
    { id: 'rfq', agent: 'rfq-parser', input, dependsOn: ['triage'], critical: true },
    { id: 'identity', agent: 'product-identity', input, dependsOn: ['rfq'], critical: true },
    { id: 'technical', agent: 'technical', input, dependsOn: ['identity'], critical: true },
    { id: 'suppliers', agent: 'supplier-discovery', input, dependsOn: ['identity'], critical: true },
    { id: 'verification', agent: 'supplier-verification', input, dependsOn: ['suppliers'], critical: true },
    { id: 'offers', agent: 'offer-normalizer', input, dependsOn: ['verification'], critical: true },
    { id: 'logistics', agent: 'logistics', input, dependsOn: ['offers'], critical: true },
    { id: 'split', agent: 'split-procurement', input, dependsOn: ['offers', 'logistics'] },
    { id: 'benchmark', agent: 'benchmark', input, dependsOn: ['offers'] },
    { id: 'ranking', agent: 'ranking', input, dependsOn: ['offers', 'logistics', 'technical'], critical: true },
    { id: 'margin', agent: 'margin', input, dependsOn: ['ranking', 'benchmark'], critical: true },
    { id: 'risk', agent: 'risk', input, dependsOn: ['ranking', 'margin', 'verification'], critical: true },
    { id: 'qa', agent: 'qa', input, dependsOn: ['risk', 'technical', 'margin'], critical: true },
    { id: 'quote', agent: 'quote', input, dependsOn: ['qa'], critical: true },
    { id: 'knowledge', agent: 'knowledge', input, dependsOn: ['qa'] },
  ]
  return { workflowId, tasks, startedAt: new Date().toISOString() }
}
