import { describe, expect, it } from 'vitest'
import { runAutonomousWorkflow } from '../../src/lib/agents/autonomousWorkflow'
import type { AgentResult } from '../../src/lib/agents/contracts'

const result = (status: AgentResult['status'], message?: string): AgentResult => ({
  taskId: 'test-task',
  workflowId: 'test-workflow',
  agent: 'orchestrator',
  status,
  output: {},
  evidence: [],
  confidence: 'high',
  warnings: message ? [{ code: 'client-clarification-required', message, severity: 'warning' }] : [],
  completedAt: new Date().toISOString(),
})

describe('autonomous workflow', () => {
  it('runs steps sequentially', () => {
    const calls: string[] = []
    const workflow = runAutonomousWorkflow(['rfq-parser', 'product-identity'], (step) => {
      calls.push(step)
      return result('completed')
    })

    expect(calls).toEqual(['rfq-parser', 'product-identity'])
    expect(workflow.status).toBe('completed')
  })

  it('stops and sends exception to human', () => {
    const workflow = runAutonomousWorkflow(['rfq-parser', 'supplier-verification', 'quote'], (step) =>
      step === 'supplier-verification' ? result('needs_clarification', 'Нужно уточнить наличие.') : result('completed'),
    )

    expect(workflow.status).toBe('needs_human')
    expect(workflow.completed).toEqual(['rfq-parser'])
    expect(workflow.stoppedAt).toBe('supplier-verification')
  })
})
