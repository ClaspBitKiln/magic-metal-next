import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import SpecialSheetRequestPicker from '@/components/SpecialSheetRequestPicker'

type Slug = 'list-riflenyj' | 'list-pvl' | 'profnastil'
const cleanups: Array<() => void> = []
afterEach(() => { for (const cleanup of cleanups.splice(0)) cleanup(); vi.unstubAllGlobals() })
const props = (slug: Slug) => ({ slug, requestHref: '/?product=Исходный%20товар&source=card#request' })
function renderPicker(slug: Slug) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(createElement(SpecialSheetRequestPicker, props(slug))))
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
  const request = () => new URL(container.querySelector<HTMLAnchorElement>('.sheet-format-picker-actions a')!.getAttribute('href')!, 'https://magicmet.ru')
  return { container, field, change, request }
}

describe('special sheet requests keep each product designation distinct', () => {
  it('asks tread base thickness before a free-text cut and accepts a partial request', () => {
    const view = renderPicker('list-riflenyj')
    const fields = [...view.container.querySelectorAll('.sheet-format-picker-fields > label')].map(node => node.childNodes[0].textContent)
    expect(fields.slice(0, 2)).toEqual(['Толщина основы, мм', 'Раскрой, мм (ширина × длина)'])
    view.change('Толщина основы, мм', '3,7')
    expect(view.request().searchParams.get('product')).toBe('Исходный товар; толщина основы 3,7 мм')
    view.change('Раскрой, мм (ширина × длина)', '1450×5100')
    expect(view.request().searchParams.get('product')).toContain('раскрой 1450×5100 мм (ширина × длина)')
    expect(view.container.querySelectorAll('.sheet-format-picker-presets button')).toHaveLength(0)
  })

  it('treats PVL204 as a designation, never as sheet thickness', () => {
    const view = renderPicker('list-pvl')
    view.change('Обозначение ПВЛ', '204')
    view.change('Раскрой, мм (ширина × длина)', '1000×2500')
    const product = view.request().searchParams.get('product')!
    expect(product).toContain('обозначение ПВЛ 204')
    expect(product).not.toContain('толщина')
    expect(view.container.textContent).not.toContain('Толщина основы, мм')
  })

  it('keeps profiled sheet profile, thickness, cut and optional zero quantity in both links', () => {
    const view = renderPicker('profnastil')
    const labels = [...view.container.querySelectorAll('.sheet-format-picker-fields > label')].map(node => node.childNodes[0].textContent)
    expect(labels.slice(0, 3)).toEqual(['Профиль', 'Толщина металла, мм', 'Раскрой, мм (ширина × длина)'])
    view.change('Профиль', 'По чертежу заказчика')
    view.change('Толщина металла, мм', '0,65')
    view.change('Количество', '0')
    view.change('Марка материала', 'по спецификации')
    const url = view.request()
    expect(url.hash).toBe('#request')
    expect(url.searchParams.get('source')).toBe('card')
    expect(url.searchParams.get('product')).toBe('Исходный товар; профиль По чертежу заказчика; толщина металла 0,65 мм; марка материала по спецификации; количество 0 листов')
    const links = [...view.container.querySelectorAll('.sheet-format-picker-actions a')]
    expect(links[1].getAttribute('href')).toBe(links[0].getAttribute('href'))
    expect(view.container.querySelector('details.sheet-format-picker-extra')?.hasAttribute('open')).toBe(false)
  })

  it.each<Slug>(['list-riflenyj', 'list-pvl', 'profnastil'])('keeps an honest static request fallback for%s without invented defaults', slug => {
    const html = renderToStaticMarkup(createElement(SpecialSheetRequestPicker, props(slug)))
    expect(html).toContain('Без JavaScript укажите параметры в тексте заявки')
    const href = html.match(/<div class="sheet-format-picker-actions"><a href="([^"]+)"/)?.[1].replaceAll('&amp;', '&')
    expect(href).toBeDefined()
    const request = new URL(href!, 'https://magicmet.ru')
    expect(request.searchParams.get('product')).toBe('Исходный товар')
    expect(request.searchParams.get('source')).toBe('card')
    expect(request.hash).toBe('#request')
  })
})
