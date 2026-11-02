import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import RopeSalesPicker from '@/components/RopeSalesPicker'
import { renderToStaticMarkup } from 'react-dom/server'
import ProductDetailPage from '@/app/(frontend)/(catalog)/produkciya/[slug]/[detail]/page'
import { ropeSalesAssortment, ropeSalesConstructions, ropeSalesDiameterGroups, ropeSalesRequestHref, ropeSalesSizedRequestHref } from '@/data/ropeSalesAssortment'

describe('offered steel rope constructions', () => {
  it('keeps source construction symbols and lists coatings separately from diameter', () => {
    expect(ropeSalesConstructions).toEqual(expect.arrayContaining([
      '35×7', '35×K7', '18×K7+IWS', '6×19Fi+IWRC', '6×26WS+SFC', '8×31WS+IWRC',
    ]))
    expect(new Set(ropeSalesConstructions).size).toBe(ropeSalesConstructions.length)
    expect(ropeSalesAssortment.diameterRange).toBe('1–56 мм')
    expect(ropeSalesAssortment.markingGroups).toEqual(['1770', '1960'])
    expect(ropeSalesAssortment.markingGroupUnit).toBe('Н/мм²')
    expect(ropeSalesAssortment.wireFinishes).toHaveLength(2)
    expect(ropeSalesAssortment.surfaceFinishes).toHaveLength(2)
  })

  it('preserves the selected construction including plus signs in the request', () => {
    for (const construction of ropeSalesConstructions) {
      const href = new URL(ropeSalesRequestHref(construction), 'https://magicmet.ru')
      expect(href.pathname).toBe('/')
      expect(href.hash).toBe('#request')
      const product = href.searchParams.get('product')!
      expect(product).toContain(`конструкция ${construction}`)
      expect(product).toContain('диаметр — указать')
      expect(product).toContain('1–56 мм')
      expect(product).not.toContain('в наличии')
    }
    expect(new URL(ropeSalesRequestHref(), 'https://magicmet.ru').searchParams.get('product')).toContain('подбор конструкции')
  })

  it('offers source fractional diameters only for their mapped constructions', () => {
    const diametersFor = (construction: string) => ropeSalesDiameterGroups
      .filter(group => (group.constructions as readonly string[]).includes(construction))
      .flatMap(group => [...group.diameters])
    expect(diametersFor('6×7+FC')).toContain(2.15)
    expect(diametersFor('6×7+FC')).toContain(4.1)
    expect(diametersFor('6×7+IWS')).not.toContain(4.1)
    expect(diametersFor('6×19+IWS')).toEqual(expect.arrayContaining([4, 5]))
    expect(diametersFor('6×19+IWS')).toEqual(expect.arrayContaining([8.25, 9.75]))
    expect(diametersFor('6×7+FC')).not.toContain(1)
    expect(diametersFor('6×7+FC')).not.toContain(56)
    expect(() => ropeSalesSizedRequestHref('6×7+FC', 1)).toThrow()
    expect(() => ropeSalesSizedRequestHref('6×7+FC', 56)).toThrow()
    expect(() => ropeSalesSizedRequestHref('несуществующая конструкция', 2.15)).toThrow()
    for (const [construction, diameter, display] of [
      ['6×7+FC', 2.15, '2,15'], ['6×19+IWS', 8.25, '8,25'], ['6×19+IWS', 9.75, '9,75'],
    ] as const) {
      const url = new URL(ropeSalesSizedRequestHref(construction, diameter), 'https://magicmet.ru')
      expect(url.hash).toBe('#request')
      expect(url.searchParams.get('product')).toContain(`конструкция ${construction}`)
      expect(url.searchParams.get('product')).toContain(`диаметр ${display} мм`)
    }
  })

  it('shows one compact picker and keeps the complete reference collapsed', async () => {
    const page = await ProductDetailPage({ params: Promise.resolve({ slug: 'metizy-i-svarochnye-materialy', detail: 'kanaty' }) })
    const tree = new DOMParser().parseFromString(renderToStaticMarkup(page), 'text/html')
    const sales = tree.querySelector('#rope-sales')!
    expect(sales).not.toBeNull()
    expect(sales.textContent).toContain('1–56 мм')
    expect(tree.body.textContent).toContain(ropeSalesAssortment.documentNote)
    expect(sales.querySelectorAll('.rope-sales-picker')).toHaveLength(1)
    expect(sales.querySelector<HTMLSelectElement>('.rope-sales-picker select')!.disabled).toBe(true)
    expect(sales.querySelectorAll('.rope-sales-constructions')).toHaveLength(0)
    const reference = sales.querySelector<HTMLDetailsElement>('.rope-sales-reference')!
    expect(reference).not.toBeNull()
    expect(reference.open).toBe(false)
    expect(reference.querySelectorAll('tbody tr')).toHaveLength(ropeSalesDiameterGroups.length)
    for (const construction of ropeSalesConstructions) expect(reference.textContent, construction).toContain(construction)
    expect(tree.querySelector('#stock-assortment')).toBeNull()
  })
})

let componentRoot: Root | undefined
let container: HTMLDivElement | undefined
beforeEach(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true))
afterEach(() => {
  if (componentRoot) act(() => componentRoot!.unmount())
  componentRoot = undefined
  container?.remove()
  vi.unstubAllGlobals()
})
function renderPicker() {
  container = document.createElement('div')
  document.body.appendChild(container)
  componentRoot = createRoot(container)
  act(() => componentRoot!.render(createElement(RopeSalesPicker)))
}
function control<T extends HTMLInputElement | HTMLSelectElement>(label: string): T {
  const element = Array.from(container!.querySelectorAll('label')).find(node => node.firstChild?.textContent?.trim() === label)?.querySelector('select,input')
  if (!element) throw new Error(`Missing control: ${label}`)
  return element as T
}
function change(element: HTMLInputElement | HTMLSelectElement, value: string) {
  const prototype = element.tagName === 'INPUT' ? HTMLInputElement.prototype : HTMLSelectElement.prototype
  act(() => {
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value)
    element.dispatchEvent(new Event(element.tagName === 'INPUT' ? 'input' : 'change', { bubbles: true }))
  })
}
const requestLink = () => container!.querySelector<HTMLAnchorElement>('.rope-sales-picker-action a')
const disabledRequest = () => container!.querySelector<HTMLButtonElement>('.rope-sales-picker-action button')

describe('compact steel rope selection', () => {
  it('requires a deliberate pair and clears diameter when the construction changes', () => {
    renderPicker()
    const construction = control<HTMLSelectElement>('Конструкция каната')
    let diameter = control<HTMLSelectElement>('Диаметр, мм')
    expect(construction.value).toBe('')
    expect(diameter.disabled).toBe(true)
    expect(disabledRequest()?.disabled).toBe(true)
    change(construction, '6×7+FC')
    diameter = control<HTMLSelectElement>('Диаметр, мм')
    expect(diameter.value).toBe('')
    expect(diameter.disabled).toBe(false)
    expect(Array.from(diameter.options).map(option => option.value)).not.toContain('56')
    change(diameter, '2.15')
    const href = new URL(requestLink()!.getAttribute('href')!, 'https://magicmet.ru')
    expect(href.hash).toBe('#request')
    expect(href.searchParams.get('product')).toContain('конструкция 6×7+FC; диаметр 2,15 мм')
    change(construction, '6×19+IWS')
    expect(control<HTMLSelectElement>('Диаметр, мм').value).toBe('')
    expect(requestLink()).toBeNull()
    expect(disabledRequest()?.disabled).toBe(true)
    change(control('Диаметр, мм'), '8.25')
    const updated = new URL(requestLink()!.getAttribute('href')!, 'https://magicmet.ru')
    expect(updated.searchParams.get('product')).toContain('конструкция 6×19+IWS; диаметр 8,25 мм')
    expect(updated.searchParams.get('product')).not.toContain('6×7+FC')
  })

  it('treats unmapped sizes as requests and prevents invalid manual diameters', () => {
    renderPicker()
    change(control('Конструкция каната'), '35×7')
    const diameter = control<HTMLInputElement>('Диаметр, мм')
    expect(diameter.tagName).toBe('INPUT')
    expect(container!.textContent).toContain('Диаметр уточним по запросу.')
    for (const value of ['0', '-2', '56.1', 'abc']) {
      change(diameter, value)
      expect(requestLink()).toBeNull()
      expect(disabledRequest()?.disabled).toBe(true)
    }
    change(diameter, '12,5')
    const request = new URL(requestLink()!.getAttribute('href')!, 'https://magicmet.ru')
    expect(request.searchParams.get('product')).toContain('конструкция 35×7; диаметр 12,5 мм — уточнить по запросу')
  })
})
