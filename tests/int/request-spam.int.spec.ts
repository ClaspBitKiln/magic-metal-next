import { describe, expect, it } from 'vitest'
import { getRequestSpamReason, type RequestSpamInput } from '@/lib/requestSpam'

const request: RequestSpamInput = {
  message: '', delivery: '', name: '', company: '', context: '', productDirection: '', hasAttachments: false,
}
const randomFields = { message: 'aBcDeFgHiJkLmNoP', delivery: 'qRsTuVwXyZaBcDeFgHiJkLmNoP' }
const seoMessage = 'WordPress SEO backlink services. Get a free audit and 20% off. Visit https://example.invalid/offer. For unsubscribe visit https://example.invalid/unsubscribe.'

describe('narrow server request spam checks', () => {
  it('identifies the combination of two random-looking fields without customer context', () => {
    expect(getRequestSpamReason({ ...request, ...randomFields })).toBe('random-request-fields')
  })

  it('requires all five advertising signals', () => {
    expect(getRequestSpamReason({ ...request, message: seoMessage })).toBe('seo-advertising')
    for (const message of [
      seoMessage.replace('backlink', 'support'),
      seoMessage.replace('WordPress SEO', 'Website'),
      seoMessage.replace('free audit and 20% off', 'details'),
      seoMessage.replaceAll('unsubscribe', 'contact'),
      seoMessage.replace(/https:\/\/example\.invalid\/\S+/g, ''),
    ]) expect(getRequestSpamReason({ ...request, message })).toBeNull()
  })

  it.each([
    'Please quote 20 stainless steel pipes 57 x 3 mm, GOST 9941-2022. Delivery to Tashkent.',
    'Specification: https://example.invalid/specification.pdf',
    'DN50PN16',
    'aBcDeFgHiJkLmNoP',
    'Нужны фланцы DN50 PN16, сталь 20, 10 шт.',
  ])('accepts legitimate text, links and individual identifiers: %s', (message) => {
    expect(getRequestSpamReason({ ...request, message })).toBeNull()
  })

  it('accepts a file-only specification', () => {
    expect(getRequestSpamReason({ ...request, hasAttachments: true })).toBeNull()
  })

  it.each(['name', 'company', 'context', 'productDirection'] as const)('does not guess random spam when %s supplies context', (key) => {
    expect(getRequestSpamReason({ ...request, ...randomFields, [key]: 'Customer specification' })).toBeNull()
  })

  it('does not guess random spam when attachments supply the specification', () => {
    expect(getRequestSpamReason({ ...request, ...randomFields, hasAttachments: true })).toBeNull()
  })

  it.each(['Longsinglewordwithoutcasechanges', 'aBcDeFgH1234IjKl', 'aBcDeF gHiJkLmNoP', 'aBcDeFgHiJk'])('requires a long single ASCII token with at least six case changes in both fields: %s', (delivery) => {
    expect(getRequestSpamReason({ ...request, ...randomFields, delivery })).toBeNull()
  })
})
