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

/**
 * Client-facing quote only. Internal supplier, purchase price and margin data
 * never leave this boundary.
 */
export function buildClientQuote(
  input: Array<{
    line: number
    product: string
    size?: string
    quantity?: number
    unit?: string
    decision?: ProcurementDecision
    sellingPrice?: number
    delivery?: string
  }>,
): ClientQuote {
  const notes: string[] = []
  const lines = input.map((row) => {
    const decision = row.decision

    if (!decision || row.sellingPrice === undefined) {
      notes.push(`Позиция ${row.line}: цена и условия требуют уточнения.`)
      return {
        line: row.line,
        product: row.product,
        size: row.size,
        quantity: row.quantity,
        unit: row.unit,
        price: 0,
        currency: decision?.landedCost.currency ?? 'RUB',
        delivery: row.delivery ?? 'Срок и стоимость уточняются',
        status: 'требует уточнения' as const,
      }
    }

    if (decision.risks.length) {
      notes.push(`Позиция ${row.line}: требуется внутреннее подтверждение.`)
      return {
        line: row.line,
        product: row.product,
        size: row.size,
        quantity: row.quantity,
        unit: row.unit,
        price: row.sellingPrice,
        currency: decision.landedCost.currency,
        delivery: row.delivery ?? 'Срок уточняется',
        status: 'требует уточнения' as const,
      }
    }

    return {
      line: row.line,
      product: row.product,
      size: row.size,
      quantity: row.quantity,
      unit: row.unit,
      price: row.sellingPrice,
      currency: decision.landedCost.currency,
      delivery: row.delivery ?? 'По согласованному сроку поставки',
      status: 'готово к предложению' as const,
    }
  })

  return { lines, notes }
}
