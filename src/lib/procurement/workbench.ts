import type { NormalizedRFQItem, Offer, ProcurementDecision } from './types'

// Manager-entered amounts use RUB including VAT; expenses apply to the entire line.
export type OfferReview = {
  price: string
  stock: string
  expenses: string
  verificationNote: string
  confirmedAt?: string
  confirmed: boolean
}

export const emptyReview: OfferReview = { price: '', stock: '', expenses: '', verificationNote: '', confirmed: false }

export function amount(value: string): number | undefined {
  const clean = value.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(?:\.\d+)?$/.test(clean)) return undefined
  const result = Number(clean)
  return Number.isFinite(result) && result >= 0 ? result : undefined
}

export function tons(quantity?: number, unit?: string): number | undefined {
  if (quantity === undefined || !Number.isFinite(quantity) || quantity <= 0) return undefined
  if (unit === 'т' || unit === 't') return quantity
  if (unit === 'кг' || unit === 'kg') return quantity / 1000
  return undefined
}

export function evaluateOption(
  item: NormalizedRFQItem,
  offer: Offer,
  review = emptyReview,
  decision?: ProcurementDecision,
) {
  const quantity = tons(item.quantity.value, item.unit.value)
  const price = amount(review.price)
  const stock = amount(review.stock)
  const expenses = amount(review.expenses)
  const blockers: string[] = []
  if (!quantity) blockers.push('Укажите количество в тоннах или килограммах')
  if (offer.match !== 'exact') blockers.push('Нет точного совпадения товара')
  if (!item.grade.value || !item.standard.value) blockers.push('Уточните марку и стандарт')
  if (!item.destination.value) blockers.push('Укажите место доставки или самовывоза')
  if (!price) blockers.push('Введите актуальную цену с НДС, ₽/т')
  if (stock === undefined) blockers.push('Введите подтверждённый остаток, т')
  else if (quantity && stock < quantity) blockers.push('Остатка недостаточно для всей позиции')
  if (expenses === undefined) blockers.push('Введите все дополнительные расходы на партию; 0 — если их нет')
  if (!review.confirmed) blockers.push('Подтвердите цену, наличие, условия заказа и расходы')
  if (!review.verificationNote.trim()) blockers.push('Укажите источник или примечание ручной проверки')
  if (!decision) blockers.push('Нет серверной оценки закупочного движка')
  if (quantity && offer.minOrderQuantity !== undefined) {
    const minimum = tons(offer.minOrderQuantity, offer.unit)
    if (minimum === undefined || quantity < minimum) blockers.push('Не соблюдён минимальный заказ поставщика')
  }
  if (quantity && offer.maxOrderQuantity !== undefined) {
    const maximum = tons(offer.maxOrderQuantity, offer.unit)
    if (maximum === undefined || quantity > maximum) blockers.push('Превышен максимальный заказ поставщика')
  }
  if (quantity && offer.orderStep !== undefined) {
    const step = tons(offer.orderStep, offer.unit)
    if (!step || Math.abs(quantity / step - Math.round(quantity / step)) > 1e-8) blockers.push('Не соблюдена кратность заказа')
  }
  const calculated = quantity && price && expenses !== undefined ? price * quantity + expenses : undefined
  const total = calculated !== undefined && Number.isFinite(calculated) ? calculated : undefined
  if (calculated !== undefined && total === undefined) blockers.push('Сумма выходит за пределы расчёта')
  const unitCost = total !== undefined && quantity ? total / quantity : undefined
  return { quantity, total, unitCost, blockers, ready: blockers.length === 0 }
}

export function compareOptions(
  item: NormalizedRFQItem,
  offers: Offer[],
  reviews: Record<string, OfferReview>,
  decisions: ProcurementDecision[] = [],
) {
  return offers.map(offer => ({
    offer,
    decision: decisions.find(decision => decision.offerId === offer.id),
    ...evaluateOption(item, offer, reviews[offer.id], decisions.find(decision => decision.offerId === offer.id)),
  }))
    .sort((a, b) => Number(b.ready) - Number(a.ready)
      || (a.total ?? Infinity) - (b.total ?? Infinity)
      || a.offer.id.localeCompare(b.offer.id))
}
