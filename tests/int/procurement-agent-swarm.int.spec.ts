import { describe, expect, it } from 'vitest'
import { normalizeRFQ } from '@/lib/procurement/normalize'
import { runAgentSwarm } from '@/lib/procurement/agentSwarm'
import type { Offer } from '@/lib/procurement/types'

describe('procurement agent swarm', () => {
  it('runs technical, sourcing, price, logistics, risk, procurement and quote roles', async () => {
    const rfq = normalizeRFQ('Труба бесшовная Ø219 стенка 8 сталь 20 ГОСТ 8732 количество 20 т')
    const offers: Offer[] = [{ id: '1', sourceId: 's1', supplierId: 's1', product: 'Труба бесшовная', diameter: 219, wall: 8, grade: '20', standard: 'ГОСТ 8732', price: 100000, currency: 'RUB', availability: 'in-stock', freightCost: 10000, pickupCost: 2000, observedAt: new Date().toISOString(), match: 'exact', confidence: 0.95 }]
    const result = await runAgentSwarm({ rfq, offers, findings: [] })
    expect(result.decisions?.[0].offerId).toBe('1')
    expect(result.findings.map((x) => x.agent)).toEqual(['technical', 'source-discovery', 'price', 'logistics', 'risk', 'procurement', 'quote'])
  })

  it('stops the swarm when no procurement route exists', async () => {
    const rfq = normalizeRFQ('Редкая позиция без подтверждённого поставщика')
    const result = await runAgentSwarm({ rfq, offers: [], findings: [] })
    expect(result.findings.at(-1)?.status).toBe('block')
    expect(result.findings.some((x) => x.agent === 'procurement')).toBe(false)
  })
})
