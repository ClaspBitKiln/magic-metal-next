import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import { JSDOM } from 'jsdom'

const source = fs.readFileSync('public/analytics.js', 'utf8')
const preferenceKey = 'magicmet.analytics.disabled'
const documents: JSDOM[] = []

function browserFixture(url = 'https://magicmet.test/', options: { preference?: string; deniedStorage?: boolean; html?: string } = {}) {
  // A separate realm owns its listeners/storage. It cannot contaminate the
  // existing analytics.int.spec.ts document, and external scripts never run.
  const dom = new JSDOM('<!doctype html><head><script id="magicmet-analytics" src="/analytics.js?id=123456789"></script></head><body></body>', { url, runScripts: 'outside-only' })
  documents.push(dom)
  const win = dom.window
  win.document.body.innerHTML = options.html || ''
  Object.defineProperty(win.document, 'readyState', { configurable: true, value: 'loading' })
  if (options.preference !== undefined) win.localStorage.setItem(preferenceKey, options.preference)
  if (options.deniedStorage) Object.defineProperty(win, 'localStorage', { get() { throw new win.DOMException('Storage denied', 'SecurityError') } })
  const idle: Array<() => void> = []
  win.requestIdleCallback = callback => { idle.push(() => callback({ didTimeout: false, timeRemaining: () => 0 })); return idle.length }
  const evaluate = () => win.eval(source)
  const dispatchLoad = () => win.dispatchEvent(new win.Event('load'))
  const flush = () => { idle.splice(0).forEach(callback => callback()) }
  const start = () => { dispatchLoad(); flush() }
  const calls = (): unknown[][] => Array.from(win.ym?.a || [], (args: ArrayLike<unknown>) => Array.from(args))
  const flags = (name: string) => calls().filter(call => call[1] === 'params' && JSON.stringify(call[2]) === JSON.stringify({ magicmet: { [name]: 1 } }))
  const event = (id: string, type: 'click' | 'change') => win.document.getElementById(id)!.dispatchEvent(new win.Event(type, { bubbles: true }))
  const custom = (detail: unknown) => win.document.dispatchEvent(new win.CustomEvent('magicmet:goal', { detail }))
  return { win, evaluate, start, dispatchLoad, flush, calls, flags, event, custom }
}

afterEach(() => { documents.splice(0).forEach(dom => dom.window.close()) })

describe('owner analytics preference', () => {
  it('persists off across documents, preserves other query/hash/state, and on enables exactly one SDK', () => {
    const first = browserFixture('https://magicmet.test/?product=PRIVATE-SPEC&utm_source=yandex&analytics=off#request')
    first.win.history.replaceState({ fixture: 'kept' }, '', first.win.location.href)
    first.evaluate(); first.start(); first.custom('request_sent')
    expect(first.win.magicmetAnalyticsDisabled).toBe(true)
    expect(first.win.localStorage.getItem(preferenceKey)).toBe('1')
    expect(new URL(first.win.location.href).searchParams.get('product')).toBe('PRIVATE-SPEC')
    expect(new URL(first.win.location.href).searchParams.get('utm_source')).toBe('yandex')
    expect(new URL(first.win.location.href).searchParams.has('analytics')).toBe(false)
    expect(first.win.location.hash).toBe('#request')
    expect(first.win.history.state).toEqual({ fixture: 'kept' })
    expect(first.win.ym).toBeUndefined()
    expect(first.calls()).toEqual([])
    expect(first.win.document.querySelector('script[src*="mc.yandex.ru"]')).toBeNull()

    const next = browserFixture('https://magicmet.test/produkciya/cvetnye-metally/med', { preference: first.win.localStorage.getItem(preferenceKey)! })
    next.evaluate(); next.start()
    expect(next.win.magicmetAnalyticsDisabled).toBe(true)
    expect(next.calls()).toEqual([])
    expect(next.win.document.querySelector('script[src*="mc.yandex.ru"]')).toBeNull()

    const enabled = browserFixture('https://magicmet.test/?analytics=on&product=PRIVATE-SPEC#request', { preference: '1' })
    enabled.evaluate(); enabled.start(); enabled.evaluate(); enabled.start()
    expect(enabled.win.magicmetAnalyticsDisabled).toBe(false)
    expect(enabled.win.localStorage.getItem(preferenceKey)).toBeNull()
    expect(enabled.calls().filter(call => call[1] === 'init')).toHaveLength(1)
    expect(enabled.win.document.querySelectorAll('script[src="https://mc.yandex.ru/metrika/tag.js"]')).toHaveLength(1)
    expect(new URL(enabled.win.location.href).searchParams.get('product')).toBe('PRIVATE-SPEC')
    expect(JSON.stringify(enabled.calls())).not.toContain('PRIVATE')
  })

  it('honours explicit off when storage is denied, including a repeated script evaluation', () => {
    const fixture = browserFixture('https://magicmet.test/?analytics=off&detail=PRIVATE#selection', { deniedStorage: true })
    expect(() => { fixture.evaluate(); fixture.evaluate(); fixture.start(); fixture.custom('request_sent') }).not.toThrow()
    expect(fixture.win.magicmetAnalyticsDisabled).toBe(true)
    expect(fixture.win.location.search).toBe('?detail=PRIVATE')
    expect(fixture.calls()).toEqual([])
    expect(fixture.win.document.querySelector('script[src*="mc.yandex.ru"]')).toBeNull()

    const normal = browserFixture('https://magicmet.test/?analytics=on', { deniedStorage: true })
    expect(() => { normal.evaluate(); normal.start() }).not.toThrow()
    expect(normal.win.magicmetAnalyticsDisabled).toBe(false)
    expect(normal.calls().filter(call => call[1] === 'init')).toHaveLength(1)
  })

  it('suppresses an already scheduled SDK and pending events when off is applied before initialization', () => {
    const fixture = browserFixture()
    fixture.evaluate(); fixture.custom('request_started'); fixture.dispatchLoad()
    fixture.win.history.replaceState(null, '', '/?analytics=off')
    fixture.evaluate(); fixture.flush(); fixture.custom('request_sent')
    expect(fixture.calls()).toEqual([])
    expect(fixture.win.document.querySelector('script[src*="mc.yandex.ru"]')).toBeNull()
  })
})

describe('private picker visit flags', () => {
  it('queues static flags, preserves registered goals and never sends new names as reachGoal', () => {
    const fixture = browserFixture('https://magicmet.test/?product=PRIVATE-SPEC&email=PRIVATE-EMAIL&utm_source=yandex')
    fixture.evaluate()
    fixture.custom('request_sent')
    for (const name of ['product_kind_selected', 'product_parameters_changed', 'request_validation_error']) fixture.custom(name)
    fixture.custom({ product_kind_selected: 'PRIVATE' }); fixture.custom('PRIVATE'); fixture.custom('__proto__')
    expect(fixture.calls()).toEqual([])
    fixture.start()
    expect(fixture.calls().filter(call => call[1] === 'reachGoal')).toEqual([[123456789, 'reachGoal', 'request_sent']])
    for (const name of ['product_kind_selected', 'product_parameters_changed', 'request_validation_error']) expect(fixture.flags(name)).toHaveLength(1)
    expect(fixture.calls().filter(call => call[1] === 'params')).toHaveLength(3)
    expect(fixture.calls().find(call => call[1] === 'hit')?.[2]).toBe('https://magicmet.test/?utm_source=yandex')
    expect(JSON.stringify(fixture.calls())).not.toContain('PRIVATE')
  })

  it('delegates native controls across picker roots while ignoring unrelated, disabled and reference controls', () => {
    const fixture = browserFixture('https://magicmet.test/produkciya/cvetnye-metally/med', { html: `
      <aside class="product-document-selection">
        <input id="dimension" value="PRIVATE-DIMENSION"><select id="grade"><option value="PRIVATE-GRADE">PRIVATE</option></select>
        <input id="shape" type="radio" checked><input id="readonly" readonly><input id="disabled" disabled>
        <fieldset disabled><input id="fieldset"></fieldset><input id="hidden" type="hidden"><input id="file" type="file">
        <details open><summary id="summary">Reference</summary><button id="reference" aria-pressed="false">Reference</button><input id="advanced" value="PRIVATE-STANDARD"></details>
      </aside>
      <div class="rope-sales-picker"><input id="rope"></div><div class="sheet-format-picker"><select id="sheet"><option>PRIVATE</option></select></div>
      <div class="catalog-standard-request"><input id="catalog"></div><form><input id="contact" value="PRIVATE-CONTACT"></form>` })
    fixture.evaluate(); fixture.start()
    // Reading the actual user value would fail this regression.
    Object.defineProperty(fixture.win.document.getElementById('dimension')!, 'value', { get() { throw new Error('Do not read private values') } })
    for (const id of ['dimension', 'grade', 'advanced', 'rope', 'sheet', 'catalog']) { fixture.event(id, 'change'); fixture.event(id, 'change') }
    fixture.event('shape', 'change'); fixture.event('shape', 'change')
    for (const id of ['readonly', 'disabled', 'fieldset', 'hidden', 'file', 'contact']) fixture.event(id, 'change')
    fixture.event('summary', 'click'); fixture.event('reference', 'click')
    expect(fixture.flags('product_parameters_changed')).toHaveLength(6)
    expect(fixture.flags('product_kind_selected')).toHaveLength(1)
    expect(JSON.stringify(fixture.calls())).not.toContain('PRIVATE')
  })

  it('captures the pre-React pressed state and treats sheet dimension presets as parameters', () => {
    const fixture = browserFixture('https://magicmet.test/produkciya/metizy-i-svarochnye-materialy/krepezh', { html: `
      <aside class="product-document-selection"><button id="kind" aria-pressed="false"><span>PRIVATE</span></button><button id="selected" aria-pressed="true">Selected</button><button id="disabled" aria-pressed="false" disabled>Disabled</button></aside>
      <div class="sheet-format-picker"><button id="preset" aria-pressed="false">PRIVATE-SIZE</button></div>` })
    const kind = fixture.win.document.getElementById('kind')!
    kind.addEventListener('click', () => kind.setAttribute('aria-pressed', 'true'))
    fixture.evaluate(); fixture.start(); fixture.event('kind', 'click'); fixture.event('kind', 'click')
    kind.setAttribute('aria-pressed', 'false'); fixture.event('kind', 'click')
    fixture.event('selected', 'click'); fixture.event('disabled', 'click'); fixture.event('preset', 'click'); fixture.event('preset', 'click')
    expect(fixture.flags('product_kind_selected')).toHaveLength(1)
    expect(fixture.flags('product_parameters_changed')).toHaveLength(1)
    expect(JSON.stringify(fixture.calls())).not.toContain('PRIVATE')
  })

  it('deduplicates one control within a page and resets on pathname navigation', () => {
    const fixture = browserFixture('https://magicmet.test/produkciya/cvetnye-metally/med', { html: '<aside class="product-document-selection"><input id="dimension"></aside>' })
    fixture.evaluate(); fixture.start(); fixture.event('dimension', 'change'); fixture.event('dimension', 'change')
    expect(fixture.flags('product_parameters_changed')).toHaveLength(1)
    fixture.win.history.pushState(null, '', '/produkciya/cvetnye-metally/bronza?product=PRIVATE#selection')
    fixture.win.document.dispatchEvent(new fixture.win.CustomEvent('magicmet:page'))
    fixture.event('dimension', 'change'); fixture.event('dimension', 'change')
    expect(fixture.flags('product_parameters_changed')).toHaveLength(2)
    expect(fixture.calls().filter(call => call[1] === 'hit')).toHaveLength(2)
    expect(JSON.stringify(fixture.calls())).not.toContain('PRIVATE')
  })
})
