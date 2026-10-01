import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
let root: Root
let container: HTMLDivElement
const input = (label: string) => container.querySelector<HTMLInputElement>('[aria-label="' + label + '"]')!
const button = (text: string) => Array.from(container.querySelectorAll('button')).find(node => node.textContent?.includes(text))!
async function click(element: HTMLElement) { await act(async () => { element.click() }) }
async function change(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string) {
  await act(async () => {
    const prototype = element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value)
    element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }))
  })
}
import RFQWorkbench from '../../src/components/RFQWorkbench'

const field = (value: unknown) => ({ value, confidence: 'high' })
const item = (line: number) => ({
  line, originalText: 'Труба позиция ' + line, product: field('Труба'), diameter: field(219), wall: field(10),
  grade: field('09Г2С'), standard: field('ГОСТ 8732-78'), quantity: field(line === 1 ? 20000 : 5),
  unit: field(line === 1 ? 'кг' : 'т'), destination: field('Челябинск'),
})
const offer = { id: 'same-id', supplierId: 'Supplier', product: 'Труба', price: 100000, currency: 'RUB', unit: 't', match: 'exact', availability: 'unknown', evidenceStatus: 'needs-verification' }
const decision = { offerId: 'same-id', score: 0.5, landedCost: { total: 100000, currency: 'RUB' }, reasons: ['Точное соответствие'], risks: ['Наличие не подтверждено'], recommended: false }

afterEach(async () => { if (root) await act(async () => root.unmount()); container?.remove(); vi.unstubAllGlobals() })

async function search() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    rfq: { items: [item(1), item(2)] }, offers: { 1: [offer], 2: [{ ...offer }] }, decisions: { 1: [decision], 2: [{ ...decision }] },
  }) }))
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(createElement(RFQWorkbench)))
  await change(container.querySelector('textarea')!, 'Труба 219×10 09Г2С ГОСТ 8732-78, 20 т')
  await click(button('Найти варианты'))
}

async function fillReview() {
  await change(input('Цена с НДС, ₽/т'), '100000')
  await change(input('Доступно, т'), '20')
  await change(input('Расходы на партию, ₽'), '100000')
  await change(input('Источник ручной проверки'), 'Звонок поставщику 15.09.2026')
  await click(container.querySelector<HTMLInputElement>('[type="checkbox"]')!)
}

describe('RFQ workbench manager flow', () => {
  it('recommends only after terms are checked and invalidates a check after editing', async () => {
    await search()
    expect(container.textContent).not.toContain('Минимальная стоимость среди проверенных:')
    await fillReview()
    expect(container.textContent).toContain('Минимальная стоимость среди проверенных:')
    await change(input('Доступно, т'), '18')
    expect(container.textContent).not.toContain('Минимальная стоимость среди проверенных:')
    expect((container.querySelector('[type=checkbox]') as HTMLInputElement).checked).toBe(false)
  })
  it('isolates reviews across RFQ lines even when an offer ID repeats', async () => {
    await search()
    await fillReview()
    await change(container.querySelector('select')!, '2')
    expect((input('Цена с НДС, ₽/т') as HTMLInputElement).value).toBe('')
    expect(container.textContent).not.toContain('Минимальная стоимость среди проверенных:')
    await change(container.querySelector('select')!, '1')
    expect((input('Цена с НДС, ₽/т') as HTMLInputElement).value).toBe('100000')
  })
  it('does not expose a quotation step in the supplier MVP', async () => {
    await search()
    expect(container.textContent).not.toContain('Черновик КП')
  })
})
