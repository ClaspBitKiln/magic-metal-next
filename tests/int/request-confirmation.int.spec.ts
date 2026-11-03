import { describe, expect, it } from 'vitest'
import { isRecordedRequest } from '@/lib/analytics'

describe('request confirmation used by RFQ UI', () => {
  it('rejects HTTP 200 shaped responses without evidence of delivery or storage', () => {
    expect(isRecordedRequest({ ok: true })).toBe(false)
    expect(isRecordedRequest({ ok: true, emailDelivered: false, crmDelivered: false, id: null })).toBe(false)
    expect(isRecordedRequest({ ok: false, emailDelivered: true })).toBe(false)
  })

  it('accepts successful storage or message delivery', () => {
    expect(isRecordedRequest({ ok: true, id: 17 })).toBe(true)
    expect(isRecordedRequest({ ok: true, id: 'rfq-17' })).toBe(true)
    expect(isRecordedRequest({ ok: true, emailDelivered: true })).toBe(true)
    expect(isRecordedRequest({ ok: true, crmDelivered: true })).toBe(true)
  })
})
