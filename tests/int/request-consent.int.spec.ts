import { describe, expect, it } from 'vitest'
import { hasRequestConsent, REQUEST_CONSENT_ERROR } from '@/lib/requestValidation'

describe('request consent validation', () => {
  it.each(['on', 'true', '1'])('accepts explicit consent value %s', (value) => {
    expect(hasRequestConsent(value)).toBe(true)
  })

  it.each([null, '', 'off', 'false', '0'])('rejects missing or false consent value %s', (value) => {
    expect(hasRequestConsent(value)).toBe(false)
  })

  it('keeps the client and API error message user-readable', () => {
    expect(REQUEST_CONSENT_ERROR).toBe('Подтвердите согласие на обработку персональных данных.')
  })
})
