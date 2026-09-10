import { describe, expect, it } from 'vitest'
import {
  canUpgradeEvidence,
  createResult,
  createTask,
  isClientSafeResult,
  type AgentResult,
} from '../../src/lib/agents/contracts'

describe('agent contracts', () => {
  it('creates a task with stable workflow identity and attempt', () => {
    const task = createTask({
      taskId: 'task-1',
      workflowId: 'wf-1',
      agent: 'supplier-discovery',
      input: { sku: '20x2' },
      constraints: ['no client supplier disclosure'],
    })

    expect(task.attempt).toBe(1)
    expect(task.workflowId).toBe('wf-1')
    expect(task.createdAt).toBeTruthy()
  })

  it('never upgrades evidence without a higher evidence level', () => {
    expect(canUpgradeEvidence('observed', 'confirmed')).toBe(true)
    expect(canUpgradeEvidence('confirmed', 'observed')).toBe(false)
    expect(canUpgradeEvidence('reference', 'reference')).toBe(false)
  })

  it('accepts a client-safe result', () => {
    const result: AgentResult = createResult({
      taskId: 'task-2',
      workflowId: 'wf-1',
      agent: 'quote',
      status: 'completed',
      output: { product: 'Труба 20×2 ГОСТ 8732', quantity: 20, price: 100000, currency: 'RUB' },
      evidence: [],
      confidence: 'high',
      warnings: [],
    })
    expect(isClientSafeResult(result)).toBe(true)
  })

  it('rejects supplier internals from a client result', () => {
    const result: AgentResult = createResult({
      taskId: 'task-3',
      workflowId: 'wf-1',
      agent: 'quote',
      status: 'completed',
      output: { product: 'Труба', supplierName: 'secret supplier', purchasePrice: 50000 },
      evidence: [],
      confidence: 'high',
      warnings: [],
    })
    expect(isClientSafeResult(result)).toBe(false)
  })
})
