import type { Offer, SplitAllocation } from './types'

type QuantitySplitInput = { itemLine: number; quantity: number; unit: string; offers: Offer[] }

const eligible = (offers: Offer[]) => offers.filter((offer) => (offer.match === 'exact' || offer.match === 'approved-alternative') && Number.isFinite(offer.price) && (offer.price ?? -1) >= 0)

export function optimizeQuantitySplit(input: QuantitySplitInput, maxOffers = 8): SplitAllocation[] {
  if (input.quantity <= 0) return []
  const offers = eligible(input.offers).slice(0, maxOffers)
  if (!offers.length) return []
  const totalCost = (offer: Offer) => (offer.price ?? 0) + (offer.pickupCost ?? 0) + (offer.freightCost ?? 0) + (offer.handlingCost ?? 0) + (offer.destinationCost ?? 0) + (offer.customsCost ?? 0)
  let remaining = input.quantity
  const allocations: SplitAllocation[] = []
  for (const offer of [...offers].sort((a, b) => totalCost(a) - totalCost(b))) {
    if (remaining <= 0) break
    const available = Number.isFinite(offer.quantity) && (offer.quantity ?? 0) > 0 ? Math.min(remaining, offer.quantity!) : remaining
    if (available <= 0) continue
    const purchaseCost = (offer.price ?? 0) * available
    const logisticsCost = (offer.pickupCost ?? 0) + (offer.freightCost ?? 0) + (offer.handlingCost ?? 0) + (offer.destinationCost ?? 0) + (offer.customsCost ?? 0)
    allocations.push({ itemLine: input.itemLine, offerId: offer.id, quantity: available, unit: input.unit, purchaseCost, logisticsCost, landedCost: purchaseCost + logisticsCost })
    remaining -= available
  }
  return remaining > 0 ? [] : allocations
}
