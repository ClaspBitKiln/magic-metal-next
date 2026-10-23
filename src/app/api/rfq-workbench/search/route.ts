import { NextResponse } from 'next/server'
import { runProcurement, type ProcurementAdapter } from '@/lib/procurement/engine'
import type { Offer } from '@/lib/procurement/types'
import { metalinfoAdapter } from '@/lib/procurement/metalinfoAdapter'

const demoAdapter: ProcurementAdapter = {
  id: 'rfq-workbench-test-sources',
  async search(item) {
    const now = new Date().toISOString()
    const base = {
      product: item.product.value || 'Труба бесшовная',
      subtype: item.subtype.value,
      diameter: item.diameter.value,
      wall: item.wall.value,
      grade: item.grade.value,
      standard: item.standard.value,
      quantity: item.quantity.value,
      unit: item.unit.value,
      match: 'exact' as const,
      currency: 'RUB',
      observedAt: now,
    }
    return [
      { ...base, id: 'O-01', sourceId: 'test-source-a', supplierId: 'test-supplier-a', price: 180000, availability: 'in-stock', warehouse: 'Москва', city: 'Москва', leadTimeDays: 8, pickupCost: 5000, freightCost: 30000, confidence: 0.95 },
      { ...base, id: 'O-02', sourceId: 'test-source-b', supplierId: 'test-supplier-b', price: 175000, availability: 'in-stock', warehouse: 'Челябинск', city: 'Челябинск', leadTimeDays: 12, pickupCost: 7000, freightCost: 45000, confidence: 0.90 },
      { ...base, id: 'O-03', sourceId: 'test-source-c', supplierId: 'test-supplier-c', price: 168000, availability: 'on-request', warehouse: 'Екатеринбург', city: 'Екатеринбург', leadTimeDays: 18, pickupCost: 8000, freightCost: 60000, confidence: 0.82 },
    ] as Offer[]
  },
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { text?: string } | null
  const text = body?.text?.trim()
  if (!text) return NextResponse.json({ error: 'RFQ text is required' }, { status: 400 })

  const adapter = process.env.RFQ_WORKBENCH_DEMO === 'true' ? demoAdapter : metalinfoAdapter

  try {
    const result = await runProcurement(text, [adapter])
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'RFQ source search failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
