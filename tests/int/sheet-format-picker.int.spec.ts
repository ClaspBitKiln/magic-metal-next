import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import SheetFormatPicker from '@/components/SheetFormatPicker'

let root: Root | undefined
let container: HTMLDivElement | undefined
const props = {
  // Deliberately narrower than the buyer presets: a request is not a claim
  // that its dimensions occur together in the reference table.
  rows: [['0,5–2', '1000;1250', '1000', '2500']],
  nominalThicknesses: ['0,5', '1,0', '2'],
  standard: 'ГОСТ 19904-90',
  requestHref: '/?product=Лист&region=uzbekistan#request',
}
afterEach(() => {
  if (root) act(() => root!.unmount())
  root = undefined
  container?.remove()
  container = undefined
  vi.unstubAllGlobals()
})
function mount(sheetKind: 'hot' | 'cold' = 'cold') {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(createElement(SheetFormatPicker, { ...props, sheetKind })))
}
function field(label: string) {
  const node = [...container!.querySelectorAll('label')].find(node => node.childNodes[0]?.textContent?.trim() === label)
  if (!node) throw new Error('Missing field: ' + label)
  return node.querySelector<HTMLInputElement | HTMLSelectElement>('input,select')!
}
function change(label: string, value: string) {
  const control = field(label)
  act(() => {
    const prototype = control.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(control, value)
    control.dispatchEvent(new Event(control.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }))
  })
}
function button(name: string) {
  return [...container!.querySelectorAll('button')].find(node => node.textContent === name)!
}
function request() {
  const link = container!.querySelector<HTMLAnchorElement>('.sheet-format-picker-actions a')!
  return new URL(link.getAttribute('href')!, 'https://magicmet.ru')
}

describe('thickness-first sheet requests', () => {
  it.each(['hot', 'cold'] as const)('defaults %s sheet to 1500×6000 and offers all thicknesses before format selection', sheetKind => {
    mount(sheetKind)
    expect(container!.querySelector('input,select')).toBe(field('Толщина, мм'))
    expect((field('Толщина, мм') as HTMLSelectElement).disabled).toBe(false)
    expect([...(field('Толщина, мм') as HTMLSelectElement).options].map(option => option.value)).toEqual(['', '0,5', '1', '2'])
    expect(button('1500 × 6000 мм').getAttribute('aria-pressed')).toBe('true')
    change('Толщина, мм', '0,5')
    expect(request().searchParams.get('product')).toContain('толщина 0,5 мм, ширина 1500 мм; длина 6000 мм')
    expect(request().searchParams.get('product')).toContain(sheetKind === 'cold' ? 'лист х/к' : 'лист г/к')
    expect(request().searchParams.get('region')).toBe('uzbekistan')
    expect(request().hash).toBe('#request')
  })

  it('preserves thickness, steel grade and quantity when switching the requested format', () => {
    mount()
    change('Толщина, мм', '1')
    change('Марка стали (если известна)', '08пс')
    change('Количество (если известно)', '10')
    act(() => button('2000 × 6000 мм').click())
    expect(field('Толщина, мм').value).toBe('1')
    expect(field('Марка стали (если известна)').value).toBe('08пс')
    expect(field('Количество (если известно)').value).toBe('10')
    expect(request().searchParams.get('product')).toContain('ширина 2000 мм; длина 6000 мм; марка стали 08пс; количество 10 листов')
    const actions = [...container!.querySelectorAll('.sheet-format-picker-actions a')]
    expect(actions).toHaveLength(2)
    expect(actions[0].getAttribute('href')).toBe(actions[1].getAttribute('href'))
  })

  it('preserves dimensions and grade in both request actions when the optional quantity is zero', () => {
    mount()
    change('Толщина, мм', '0,5')
    change('Марка стали (если известна)', '08пс')
    change('Количество (если известно)', '0')
    const actions = [...container!.querySelectorAll('.sheet-format-picker-actions a')]
    expect(actions).toHaveLength(2)
    expect(actions[0].getAttribute('href')).toBe(actions[1].getAttribute('href'))
    const product = request().searchParams.get('product')!
    expect(product).toContain('толщина 0,5 мм, ширина 1500 мм; длина 6000 мм')
    expect(product).toContain('марка стали 08пс; количество 0 листов')
    expect(container!.querySelector('[role="alert"]')).toBeNull()
  })

  it('allows a custom positive cut outside the reference range without reducing the thickness choices', () => {
    mount()
    expect(container!.querySelector('.sheet-format-picker-custom')!.hasAttribute('open')).toBe(false)
    change('Ширина, мм', '1700')
    change('Длина, мм (необязательно)', '12345')
    change('Толщина, мм', '2')
    expect((field('Толщина, мм') as HTMLSelectElement).options).toHaveLength(4)
    expect(request().searchParams.get('product')).toContain('ширина 1700 мм; длина 12345 мм')
    expect(container!.textContent).toContain('Раскрой и наличие подтвердит менеджер')
    expect(container!.textContent).not.toContain('покажем только сочетания')
  })

  it('does not construct a dimensioned request from a negative custom length', () => {
    mount()
    change('Толщина, мм', '1')
    change('Длина, мм (необязательно)', '-1')
    expect(container!.querySelectorAll('.sheet-format-picker-actions a')).toHaveLength(1)
    expect(container!.querySelector('[role="alert"]')!.textContent).toContain('положительную длину')
    expect(request().searchParams.get('product')).toBe('Лист')
  })

  it('keeps a native specification request in the initial static HTML', () => {
    const html = renderToStaticMarkup(createElement(SheetFormatPicker, props))
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const href = doc.querySelector('.sheet-format-picker-actions a')!.getAttribute('href')!
    expect(href).toBe(props.requestHref)
    expect(doc.querySelector('.sheet-format-picker-extra')!.hasAttribute('open')).toBe(false)
    expect(doc.querySelector('.size-series-reference-toggle')!.getAttribute('href')).toBe('#sizes')
  })
})
