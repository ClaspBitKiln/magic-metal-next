import { act, createElement as h, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CatalogSearch from '@/components/CatalogSearch'
import SizeTableFilter from '@/components/SizeTableFilter'
import type { SearchItem } from '@/data/searchIndex'

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string; prefetch?: boolean }) => {
    delete props.prefetch
    return h('a', { ...props, href }, children)
  },
}))

let root: Root | undefined
let container: HTMLDivElement
let goals: string[]
const record: EventListener = (event) => {
  if (event instanceof CustomEvent && typeof event.detail === 'string') goals.push(event.detail)
}
const preventNavigation = (event: Event) => event.preventDefault()
const click = (element: Element) => act(() => element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })))

function mount(element: ReactNode) {
  root = createRoot(container)
  act(() => root!.render(element))
}

function mountTable() {
  mount(h('details', null,
    h('summary', null, 'Размеры'),
    h('div', { className: 'size-series-scope', id: 'sizes-series-test' }),
    h(SizeTableFilter, { column: 'Диаметр', values: ['57', '89'], total: 2, wallColumns: [1], requestHref: '/?product=Труба#request', context: 'Трубы', standard: 'ГОСТ тест' }),
    h('div', { className: 'size-series-reference', dangerouslySetInnerHTML: { __html: '<table><thead><tr><th>Диаметр</th><th>Стенка</th></tr></thead><tbody><tr><td>57</td><td>3; 4</td></tr><tr><td>89</td><td>4</td></tr></tbody></table>' } }),
  ))
  return container.querySelector('details')!
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  window.history.replaceState(null, '', '/')
  goals = []
  container = document.createElement('div')
  document.body.append(container)
  document.addEventListener('magicmet:goal', record)
  document.addEventListener('click', preventNavigation)
})

afterEach(() => {
  if (root) act(() => root!.unmount())
  root = undefined
  container.remove()
  document.removeEventListener('magicmet:goal', record)
  document.removeEventListener('click', preventNavigation)
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('actual buyer size selections', () => {
  it('records one selection when an exact compact pair request is clicked, keeping its parameters', () => {
    const details = mountTable()
    act(() => { details.open = true; details.dispatchEvent(new Event('toggle')) })
    expect(goals).toEqual([])
    const pairs = container.querySelectorAll<HTMLAnchorElement>('.size-series-pair-list a')
    expect(pairs).toHaveLength(3)
    const href = pairs[0].getAttribute('href')
    const product = new URL(pairs[0].href).searchParams.get('product')
    expect(product).toContain('57 × 3 мм')
    click(pairs[0])
    expect(goals).toEqual(['size_selected'])
    expect(pairs[0].getAttribute('href')).toBe(href)
  })

  it('does not count restored selections or duplicate a manually selected pair when its CTA is clicked', () => {
    window.history.replaceState(null, '', '/?size_test=57&wall_test=4')
    mountTable()
    expect(goals).toEqual([])
    click(container.querySelector('.size-series-selection-result a')!)
    expect(goals).toEqual([])

    const [size, wall] = container.querySelectorAll('select')
    act(() => { size.value = '89'; size.dispatchEvent(new Event('change', { bubbles: true })) })
    act(() => { wall.value = '4'; wall.dispatchEvent(new Event('change', { bubbles: true })) })
    expect(goals).toEqual(['size_selected'])
    click(container.querySelector('.size-series-selection-result a')!)
    expect(goals).toEqual(['size_selected'])

    act(() => {
      window.history.replaceState(null, '', '/?size_test=57&wall_test=9')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    const fallback = container.querySelector<HTMLAnchorElement>('a.size-series-selection-request:not([hidden])')!
    expect(fallback.textContent).toContain('спецификацию')
    click(fallback)
    expect(goals).toEqual(['size_selected'])
  })

  it('records one selection only on clicking a dimension search result, without changing its link', async () => {
    vi.useFakeTimers()
    const result: SearchItem = {
      type: 'product', typeLabel: 'Размер в таблице', title: 'Труба — 57 × 3 мм',
      subtitle: 'ГОСТ 8734', description: 'Нормативный размер найден в таблице.', searchText: '',
      href: '/produkciya/truby-besshovnye/holodnodeformirovannye?size_1=57&wall_1=3#sizes-series-1',
    }
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [result] }) })
    vi.stubGlobal('fetch', fetch)
    mount(h(CatalogSearch, { initialQuery: 'труба 57×3' }))
    await act(async () => { await vi.advanceTimersByTimeAsync(250) })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(goals).toEqual([])
    const link = container.querySelector<HTMLAnchorElement>('.search-results > a')!
    expect(link.getAttribute('href')).toBe(result.href)
    click(link.querySelector('h2')!)
    expect(goals).toEqual(['size_selected'])
    expect(link.getAttribute('href')).toBe(result.href)
  })

  it('does not count an ordinary text result as a size selection', () => {
    mount(h(CatalogSearch, { initialQuery: '12Х1МФ' }))
    const link = container.querySelector('.search-results > a')!
    expect(link).not.toBeNull()
    click(link)
    expect(goals).toEqual([])
  })

  it('does not count an unmatched dimension or its specification fallback', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [] }) }))
    mount(h(CatalogSearch, { initialQuery: 'труба 99999×99999' }))
    await act(async () => { await vi.advanceTimersByTimeAsync(250) })
    expect(container.querySelectorAll('.search-results > a')).toHaveLength(0)
    const fallback = container.querySelector('.search-empty a[href*="#request"]')!
    expect(fallback).not.toBeNull()
    click(fallback)
    expect(goals).toEqual([])
  })
})
