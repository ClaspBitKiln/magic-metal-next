import { describe, expect, it } from 'vitest'
import { recordKnowledge } from '../../src/lib/agents/knowledgeLoop'

describe('knowledge loop', () => {
  it('records useful procurement facts', () => {
    const record = recordKnowledge({
      product: 'Лист 09Г2С',
      supplier: 'supplier-1',
      purchasePrice: 100000,
      actualLeadTimeDays: 5,
      result: 'success',
    }, new Date('2026-09-10T10:00:00Z'))

    expect(record).toEqual({
      product: 'Лист 09Г2С',
      supplier: 'supplier-1',
      purchasePrice: 100000,
      actualLeadTimeDays: 5,
      result: 'success',
      recordedAt: '2026-09-10T10:00:00.000Z',
    })
  })
})
