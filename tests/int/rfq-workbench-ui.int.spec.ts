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

afterEach(async () => { if (root) await act(async () => root.unmount()); container?.remove(); vi.unstubAllGlobals() })

async function search() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    rfq: { items: [item(1), item(2)] }, offers: { 1: [offer], 2: [{ ...offer }] },
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
  await click(container.querySelector<HTMLInputElement>('[type="checkbox"]')!)
}

describe('RFQ workbench manager flow', () => {
  it('keeps quote blocked until terms are checked and invalidates a check after editing', async () => {
    await search()
    const quote = button('Сформировать КП') as HTMLButtonElement
    expect(quote.disabled).toBe(true)
    await fillReview()
    expect(quote.disabled).toBe(false)
    await change(input('Доступно, т'), '18')
    expect(quote.disabled).toBe(true)
    expect((container.querySelector('[type=checkbox]') as HTMLInputElement).checked).toBe(false)
  })
  it('isolates reviews across RFQ lines even when an offer ID repeats', async () => {
    await search()
    await fillReview()
    await change(container.querySelector('select')!, '2')
    expect((input('Цена с НДС, ₽/т') as HTMLInputElement).value).toBe('')
    expect((button('Сформировать КП') as HTMLButtonElement).disabled).toBe(true)
    await change(container.querySelector('select')!, '1')
    expect((input('Цена с НДС, ₽/т') as HTMLInputElement).value).toBe('100000')
  })
  it('uses tonnes in the quote total and requires a real selling price', async () => {
    await search()
    await fillReview()
    await click(button('Сформировать КП'))
    expect(container.textContent).toContain('20 т')
    await change(container.querySelector('input')!, '120000')
    expect(container.textContent?.replace(/\s/g, '')).toContain('2400000₽')
  })
})
