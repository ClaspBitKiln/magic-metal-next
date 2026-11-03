import { describe, expect, it } from 'vitest'
import { fallbackRequestContext } from '@/lib/requestContext'

const endpoint = 'https://magicmet.ru/api/request'

describe('request context without JavaScript', () => {
  it('recovers selected product parameters from a same-origin Referer', () => {
    expect(fallbackRequestContext(endpoint, 'https://magicmet.ru/?product=%D0%A3%D0%B3%D0%BE%D0%BB%D0%BE%D0%BA%2040x40x4&detail=%D0%A1%D1%823&standard=%D0%93%D0%9E%D0%A1%D0%A2#request'))
      .toBe('Уголок 40x40x4; Ст3; ГОСТ')
  })

  it('rejects cross-origin and protocol or port mismatches', () => {
    expect(fallbackRequestContext(endpoint, 'https://evil.example/?product=Forged')).toBe('')
    expect(fallbackRequestContext(endpoint, 'http://magicmet.ru/?product=Forged')).toBe('')
    expect(fallbackRequestContext(endpoint, 'https://magicmet.ru:8443/?product=Forged')).toBe('')
  })

  it('rejects malformed and absent Referer headers', () => {
    expect(fallbackRequestContext(endpoint, null)).toBe('')
    expect(fallbackRequestContext(endpoint, 'not a URL')).toBe('')
    expect(fallbackRequestContext(endpoint, 'https://magicmet.ru/?utm_source=test')).toBe('')
  })

  it('limits recovered context to 300 characters', () => {
    expect(fallbackRequestContext(endpoint, 'https://magicmet.ru/?product=' + 'X'.repeat(500))).toHaveLength(300)
  })
})
