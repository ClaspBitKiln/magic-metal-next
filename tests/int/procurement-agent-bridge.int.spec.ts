import { describe, expect, it } from 'vitest'
import { createProcurementTask, runProcurementAgentFlow } from '../../src/lib/procurement/agentBridge'

describe('procurement agent bridge', () => {
  it('blocks a workflow when no procurement route exists', async () => {
    const task = createProcurementTask('Труба специальная, количество: 10 т')
    const result = await runProcurementAgentFlow(task, [
      { id: 'empty', search: async () => [] },
    ])

    expect(result.status).toBe('blocked')
    expect(result.warnings.some((warning) => warning.code === 'no-procurement-route')).toBe(true)
    expect(result.nextAction?.agent).toBe('supplier-discovery')
  })

  it('completes a flow when an exact offer is available', async () => {
    const task = createProcurementTask('Труба 20x2, марка стали 20, ГОСТ 8732, количество: 20 т')
    const result = await runProcurementAgentFlow(task, [
      {
        id: 'test',
        search: async () => [{
          id: 'offer-1', sourceId: 'internal', supplierId: 'supplier', product: 'Труба', subtype: 'бесшовная', diameter: 20, wall: 2,
          grade: '20', standard: 'ГОСТ 8732', quantity: 20, unit: 'т', price: 100000, currency: 'RUB', availability: 'in-stock',
          observedAt: new Date().toISOString(), match: 'exact', confidence: 1,
        }],
      },
    ])

    expect(result.status).toBe('completed')
    expect(result.output.decisions[1]?.[0]?.recommended).toBe(true)
  })
})
