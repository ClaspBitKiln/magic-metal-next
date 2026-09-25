import { describe, expect, it } from 'vitest'
import { createProcurementSwarmRun, runSwarm } from '@/lib/agents/swarmSupervisor'
import type { AgentResult } from '@/lib/agents/contracts'

describe('autonomous procurement swarm', () => {
  it('runs independent branches in parallel and waits for dependencies', async () => {
    const run = createProcurementSwarmRun('test-1', { item: 'pipe 102x6 15X5M' })
    const order: string[] = []
    const execute = async (task: typeof run.tasks[number]): Promise<AgentResult> => {
      order.push(task.id)
      return {
        taskId: task.id,
        workflowId: run.workflowId,
        agent: task.agent,
        status: 'completed',
        output: { task: task.id },
        evidence: [{
          id: task.id,
          level: 'observed',
          sourceType: 'calculation',
          claim: task.id,
        }],
        confidence: 'high',
        warnings: [],
        completedAt: new Date().toISOString(),
      }
    }
    const state = await runSwarm(run, execute, { maxParallel: 8 })
    expect(state.status).toBe('completed')
    expect(Object.keys(state.results)).toHaveLength(run.tasks.length)
    expect(order.indexOf('technical')).toBeGreaterThan(order.indexOf('identity'))
    expect(order.indexOf('suppliers')).toBeGreaterThan(order.indexOf('identity'))
  })

  it('blocks critical downstream work instead of asking a human', async () => {
    const run = createProcurementSwarmRun('test-2', { item: 'unknown' })
    const execute = async (task: typeof run.tasks[number]): Promise<AgentResult> => ({
      taskId: task.id,
      workflowId: run.workflowId,
      agent: task.agent,
      status: task.id === 'identity' ? 'blocked' : 'completed',
      output: null,
      evidence: [],
      confidence: 'none',
      warnings: [],
      completedAt: new Date().toISOString(),
    })
    const state = await runSwarm(run, execute)
    expect(state.status).toBe('blocked')
    expect(state.nextActions).toContain('preserve_evidence_and_do_not_fabricate')
  })
})
