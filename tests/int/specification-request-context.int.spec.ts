import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot, type Root } from 'react-dom/client'
import NonferrousRequestPicker from '@/components/NonferrousRequestPicker'
import FastenerRequestPicker from '@/components/FastenerRequestPicker'
import MeshRopeRequestPicker from '@/components/MeshRopeRequestPicker'
import SpecialProcurementPicker from '@/components/SpecialProcurementPicker'
import SheetFormatPicker from '@/components/SheetFormatPicker'
import GalvanizedRequestPicker from '@/components/GalvanizedRequestPicker'

const requestHref = '/?product=Бронза&material=БрАМц9-2&region=uzbekistan#request'
const cases = [
  ['nonferrous', createElement(NonferrousRequestPicker, { productSlug: 'bronza', requestHref })],
  ['fastener', createElement(FastenerRequestPicker, { nutThreads: ['M12'], requestHref })],
  ['mesh', createElement(MeshRopeRequestPicker, { type: 'mesh', requestHref })],
  ['special procurement', createElement(SpecialProcurementPicker, { mode: 'forging', requestHref })],
  ['sheet', createElement(SheetFormatPicker, { rows: [], nominalThicknesses: [], standard: 'ГОСТ 19903-2015', requestHref })],
  ['galvanized', createElement(GalvanizedRequestPicker, { requestHref })],
] as const

let root: Root | undefined
let container: HTMLDivElement | undefined
function change(label: string, value: string) {
  if (label === 'Форма изделия') { act(() => [...container!.querySelectorAll<HTMLInputElement>('input[type=radio]')].find(n => n.value === value)!.click()); return }

  const field = Array.from(container!.querySelectorAll('label')).find(node => Array.from(node.childNodes)
    .filter(child => child.nodeType === Node.TEXT_NODE).map(child => child.textContent).join('').trim() === label)!.querySelector('select,input')!
  const prototype = field.tagName === 'INPUT' ? HTMLInputElement.prototype : HTMLSelectElement.prototype
  act(() => {
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(field, value)
    field.dispatchEvent(new Event(field.tagName === 'INPUT' ? 'input' : 'change', { bubbles: true }))
  })
}
afterEach(() => { if (root) act(() => root!.unmount()); root = undefined; container?.remove(); container = undefined; vi.unstubAllGlobals() })

describe('specification file requests preserve product context', () => {
  it.each(cases)('keeps the base request available before hydration for %s', (_, component) => {
    const container = document.createElement('div')
    container.innerHTML = renderToStaticMarkup(component)
    const link = Array.from(container.querySelectorAll('a')).find(a => /Excel/.test(a.textContent || ''))!
    const url = new URL(link.getAttribute('href')!, 'https://magicmet.ru')
    expect(url.searchParams.get('product')).toBe('Бронза')
    expect(url.searchParams.get('material')).toBe('БрАМц9-2')
    expect(url.searchParams.get('region')).toBe('uzbekistan')
    expect(url.hash).toBe('#request')
  })

  it('carries the complete valid selection to the file request and removes stale dimensions after a shape change', () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => root!.render(createElement(NonferrousRequestPicker, { productSlug: 'bronza', requestHref })))
    change('Форма изделия', 'Квадрат')
    change('Сторона, мм', '20.5')
    change('Длина, мм (если известна)', '1000')
    const fileLink = () => Array.from(container!.querySelectorAll('a')).find(a => /Есть спецификация/.test(a.textContent || ''))!
    const selectedLink = container!.querySelector('a.nonferrous-submit')!
    expect(fileLink().getAttribute('href')).toBe(selectedLink.getAttribute('href'))
    const url = new URL(fileLink().getAttribute('href')!, 'https://magicmet.ru')
    expect(url.searchParams.get('product')).toContain('Квадрат 20,5×20,5 мм')
    expect(url.searchParams.get('product')).toContain('длина 1000 мм')
    expect(url.searchParams.get('material')).toBe('БрАМц9-2')
    change('Форма изделия', 'Шестигранник')
    expect(new URL(fileLink().getAttribute('href')!, 'https://magicmet.ru').searchParams.get('product')).toContain('Шестигранник')
    expect(fileLink().getAttribute('href')).not.toContain('1000')
  })
})

