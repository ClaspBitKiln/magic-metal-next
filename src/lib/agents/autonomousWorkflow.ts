import type { AgentName, AgentResult } from './contracts'

export type WorkflowStep = AgentName

export type AutonomousWorkflowResult = {
  status: 'completed' | 'needs_human'
  completed: WorkflowStep[]
  stoppedAt?: WorkflowStep
  reason?: string
}

/** Minimal orchestrator: run prepared steps in order and stop on an exception. */
export function runAutonomousWorkflow(
  steps: WorkflowStep[],
  run: (step: WorkflowStep) => AgentResult,
): AutonomousWorkflowResult {
  const completed: WorkflowStep[] = []

  for (const step of steps) {
    const result = run(step)
    if (result.status !== 'completed') {
      return {
        status: 'needs_human',
        completed,
        stoppedAt: step,
        reason: result.warnings[0]?.message ?? `Этап ${step} требует внимания человека.`,
      }
    }
    completed.push(step)
  }

  return { status: 'completed', completed }
}
