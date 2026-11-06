import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import GalvanizedRequestPicker from '@/components/GalvanizedRequestPicker'

const cleanups: Array<() => void> = []
afterEach(() => { for (const cleanup of cleanups.splice(0)) cleanup(); vi.unstubAllGlobals() })
function renderPicker() {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(createElement(GalvanizedRequestPicker, { requestHref: '/?product=Оцинкованный%20прокат#request' })))
  cleanups.push(() => { act(() => root.unmount()); container.remove() })
  const field = (label: string) => {
    const node = [...container.querySelectorAll('label')].find(item => item.childNodes[0]?.textContent === label)?.querySelector<HTMLInputElement | HTMLSelectElement>('input,select')
    if (!node) throw new Error('Missing field: ' + label)
    return node
  }
  const change = (label: string, value: string) => act(() => {
    const node = field(label)
    const prototype = node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(node, value)
    node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }))
  })
  const request = () => new URL(container.querySelector<HTMLAnchorElement>('.galv-submit')!.getAttribute('href')!, 'https://magicmet.ru')
  return { container, field, change, request }
}

describe('galvanized sheet thickness then cut', () => {
  it('offers thickness first and only the existing 1250 × 2500 sheet cut', () => {
    const view = renderPicker()
    const fields = [...view.container.querySelectorAll('.galv-fields > label')].map(node => node.childNodes[0].textContent)
    expect(fields.slice(0, 2)).toEqual(['Толщина, мм', 'Раскрой, мм'])
    expect([...view.field('Раскрой, мм').querySelectorAll('option')].map(node => node.textContent)).toEqual(['Укажу позже', '1250 × 2500', 'Другой раскрой'])
    view.change('Толщина, мм', '0,7')
    view.change('Раскрой, мм', '1250x2500')
    expect(view.request().searchParams.get('product')).toContain('толщина 0,7 мм; ширина 1250 мм; длина 2500 мм')
    expect(view.request().hash).toBe('#request')
  })

  it('accepts incomplete and nonstandard requests without implying standard compatibility', () => {
    const view = renderPicker()
    expect(view.request().searchParams.get('product')).not.toContain('ширина')
    view.change('Толщина, мм', '5')
    view.change('Раскрой, мм', 'custom')
    view.change('Ширина, мм', '2000')
    view.change('Количество (необязательно)', '0')
    const product = view.request().searchParams.get('product')!
    expect(product).toContain('толщина 5 мм; ширина 2000 мм')
    expect(product).not.toContain('длина')
    expect(product).toContain('количество 0 листов')
    expect(product).toContain('применимость ГОСТ 14918-2020 и возможность поставки уточнить')
    expect(view.container.querySelector('details.galv-additional')?.hasAttribute('open')).toBe(false)
  })

  it('clears sheet cut on coil/tape changes while preserving thickness', () => {
    const view = renderPicker()
    view.change('Толщина, мм', '1')
    view.change('Раскрой, мм', '1250x2500')
    view.change('Форма поставки', 'Рулон')
    expect(view.field('Ширина, мм').value).toBe('')
    view.change('Ширина, мм', '1200')
    expect(view.request().searchParams.get('product')).toContain('рулон; толщина 1 мм; ширина 1200 мм')
    expect(view.request().searchParams.get('product')).not.toContain('длина')
    view.change('Форма поставки', 'Лента')
    view.change('Ширина, мм', '100')
    expect(view.request().searchParams.get('product')).toContain('лента; толщина 1 мм; ширина 100 мм')
    view.change('Форма поставки', 'Лист')
    expect(view.field('Раскрой, мм').value).toBe('')
    expect(view.request().searchParams.get('product')).not.toContain('2500')
  })
})
