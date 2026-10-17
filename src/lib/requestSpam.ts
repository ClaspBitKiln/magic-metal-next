// Used only by the request API. Keep these heuristics out of the client form.
export type RequestSpamReason = 'seo-advertising' | 'random-request-fields'

export type RequestSpamInput = {
  message: string
  delivery: string
  name: string
  company: string
  context: string
  productDirection: string
  hasAttachments: boolean
}

function isRandomLookingToken(value: string): boolean {
  const token = value.trim()
  if (!/^[A-Za-z]{12,}$/.test(token)) return false
  let caseChanges = 0
  for (let index = 1; index < token.length; index++) {
    if ((token[index] === token[index].toUpperCase()) !== (token[index - 1] === token[index - 1].toUpperCase())) caseChanges++
  }
  return caseChanges >= 6
}

export function getRequestSpamReason(input: RequestSpamInput): RequestSpamReason | null {
  const message = input.message.trim()
  // All five signals must occur together: a link or English text alone is valid.
  const hasBacklinkOffer = /\b(?:backlinks?|link\s+building)\b/i.test(message)
  const hasSeoTopic = /\b(?:seo|wordpress)\b/i.test(message)
  const hasPromotion = /\b(?:audit|discount|promo(?:tion|code)?|coupon)\b|\b\d{1,2}\s*%\s*off\b/i.test(message)
  const hasUnsubscribe = /\bunsubscribe\b/i.test(message)
  const hasExternalLink = /https?:\/\/[^\s<>]+|\b(?:tiny\.cc|bit\.ly|tinyurl\.com)\/[^\s<>]+/i.test(message)
  if (hasBacklinkOffer && hasSeoTopic && hasPromotion && hasUnsubscribe && hasExternalLink) return 'seo-advertising'

  const hasCustomerContext = [input.name, input.company, input.context, input.productDirection].some((value) => value.trim())
  if (!input.hasAttachments && !hasCustomerContext && isRandomLookingToken(message) && isRandomLookingToken(input.delivery)) return 'random-request-fields'
  return null
}
