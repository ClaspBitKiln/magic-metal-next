import { afterEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import { isRecordedRequest } from '@/lib/analytics'
import { GET } from '@/app/(frontend)/route'

afterEach(() => vi.unstubAllEnvs())

describe('optional lightweight analytics', () => {
  it('loads no counter without a valid public ID and keeps the static homepage', async () => {
    for (const id of ['', '0', '123<script>', '-1', '123abc']) {
      vi.stubEnv('NEXT_PUBLIC_YANDEX_METRIKA_ID', id)
      const response = await GET()
      expect(await response.text()).not.toContain('magicmet-analytics')
    }
    vi.stubEnv('NEXT_PUBLIC_YANDEX_METRIKA_ID', '123456789')
    const response = await GET()
    const html = await response.text()
    expect(html).toContain('src="/analytics.js?v=20261017-1&id=123456789" defer')
    expect(html).toContain('id="request-form"')
    expect(html).toContain('/home.js?v=20261017-analytics1')
    expect(html).not.toContain('mc.yandex.ru')
  })

  it('counts recorded or delivered requests, but not a honeypot success or failed delivery', () => {
    for (const value of [null, {}, { ok: true }, { ok: true, id: null, emailDelivered: false, crmDelivered: false }, { ok: false, id: 2 }]) expect(isRecordedRequest(value)).toBe(false)
    for (const value of [{ ok: true, id: 2 }, { ok: true, id: 'uuid' }, { ok: true, emailDelivered: true }, { ok: true, crmDelivered: true }]) expect(isRecordedRequest(value)).toBe(true)
  })

  it('defers the external SDK, strips private query values and ignores arbitrary event data', () => {
    const source = fs.readFileSync('public/analytics.js', 'utf8')
    document.head.innerHTML = '<script id="magicmet-analytics" src="/analytics.js?id=123456789"></script>'
    document.body.innerHTML = '<a href="tel:+79227117363">Телефон</a>'
    history.replaceState(null, '', '/?product=PRIVATE-SPEC&email=secret@example.com&message=PRIVATE-TEXT&utm_source=yandex&utm_campaign=metal')
    Object.defineProperty(document, 'readyState', { configurable: true, value: 'loading' })
    let idle: (() => void) | undefined
    const browser = window as Window & { ym?: { a?: IArguments[] }; magicmetAnalyticsReady?: boolean; requestIdleCallback?: (callback: () => void) => number }
    browser.requestIdleCallback = (callback) => { idle = callback; return 1 }
    delete browser.ym
    delete browser.magicmetAnalyticsReady
    new Function('window', 'document', 'location', 'Element', 'URL', 'CustomEvent', source)(window, document, location, Element, URL, CustomEvent)
    document.dispatchEvent(new CustomEvent('magicmet:goal', { detail: 'request_started' }))
    expect(document.querySelector('script[src*="mc.yandex.ru"]')).toBeNull()
    window.dispatchEvent(new Event('load'))
    expect(document.querySelector('script[src*="mc.yandex.ru"]')).toBeNull()
    idle!()
    const calls = () => (browser.ym?.a || []).map(args => Array.from(args))
    expect(calls()[0]).toEqual([123456789, 'init', expect.objectContaining({ defer: true, webvisor: false, clickmap: false, trackLinks: false })])
    const hit = calls().find(call => call[1] === 'hit')!
    expect(String(hit[2])).toContain('utm_source=yandex')
    expect(JSON.stringify(calls())).not.toContain('PRIVATE')
    expect(JSON.stringify(calls())).not.toContain('secret@example.com')
    expect(calls().some(call => call[2] === 'request_started')).toBe(true)
    document.dispatchEvent(new CustomEvent('magicmet:goal', { detail: { email: 'secret@example.com' } }))
    expect(JSON.stringify(calls())).not.toContain('secret@example.com')
    history.pushState(null, '', '/produkciya/sdt/flantsy?product=PRIVATE')
    document.dispatchEvent(new CustomEvent('magicmet:page'))
    document.dispatchEvent(new CustomEvent('magicmet:page'))
    expect(calls().filter(call => call[1] === 'hit')).toHaveLength(2)
    expect(document.querySelectorAll('script[src="https://mc.yandex.ru/metrika/tag.js"]')).toHaveLength(1)
    delete browser.ym
    delete browser.magicmetAnalyticsReady
    Object.defineProperty(document, 'readyState', { configurable: true, value: 'complete' })
  })
})
