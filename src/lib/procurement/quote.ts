import type { ProcurementDecision } from './types'

export type ClientQuoteLine = {
  line: number
  product: string
  size?: string
  quantity?: number
  unit?: string
  price: number
  currency: string
  delivery: string
  status: 'готово к предложению' | 'требует уточнения'
}

export type ClientQuote = {
  lines: ClientQuoteLine[]
  notes: string[]
}

export function buildClientQuote(input: Array<{ line: number; product: string; size?: string; quantity?: number; unit?: string; decision?: ProcurementDecision }>): ClientQuote {
  const notes: string[] = []
  const lines = input.map((row) => {
    const decision = row.decision
    if (!decision) {
      notes.push(`Позиция ${row.line}: не найден подтверждённый маршрут закупки.`)
      return { line: row.line, product: row.product, size: row.size, quantity: row.quantity, unit: row.unit, price: 0, currency: 'RUB', delivery: 'Срок и стоимость уточняются', status: 'требует уточнения' as const }
    }
    if (decision.risks.length) notes.push(`Позиция ${row.line}: требуется внутреннее подтверждение перед фиксацией предложения.`)
    return {
      line: row.line,
      product: row.product,
      size: row.size,
      quantity: row.quantity,
      unit: row.unit,
      price: decision.landedCost.total,
      currency: decision.landedCost.currency,
      delivery: 'По согласованному сроку поставки',
      status: decision.risks.length ? 'требует уточнения' as const : 'готово к предложению' as const,
    }
  })
  return { lines, notes }
}
