import { describe, expect, it } from 'vitest'
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

  it('renders construction choices and withdraws old supply positions', async () => {
    const page = await ProductDetailPage({ params: Promise.resolve({ slug: 'metizy-i-svarochnye-materialy', detail: 'kanaty' }) })
    const tree = new DOMParser().parseFromString(renderToStaticMarkup(page), 'text/html')
    const sales = tree.querySelector('#rope-sales')!
    expect(sales).not.toBeNull()
    expect(sales.textContent).toContain('1–56 мм')
    expect(tree.body.textContent).toContain(ropeSalesAssortment.selectionNote)
    expect(tree.body.textContent).toContain(ropeSalesAssortment.documentNote)
    for (const construction of ropeSalesConstructions) {
      const link = Array.from(sales.querySelectorAll('a')).find(node => node.getAttribute('href') === ropeSalesRequestHref(construction))
      expect(link, construction).toBeDefined()
      expect(sales.textContent).toContain(construction)
    }
    for (const [construction, diameter, display] of [['6×7+FC', 2.15, '2,15'], ['6×19+IWS', 8.25, '8,25'], ['6×19+IWS', 9.75, '9,75']] as const) {
      const form = Array.from(sales.querySelectorAll('form')).find(node => node.querySelector<HTMLInputElement>('input[name="product"]')?.value.includes(`конструкция ${construction}`))
      expect(form, `${construction}: ${diameter}`).toBeDefined()
      expect(form!.getAttribute('method')?.toLowerCase()).toBe('get')
      expect(form!.getAttribute('action')).toBe('/#request')
      const select = form!.querySelector<HTMLSelectElement>('select[name="detail"]')!
      expect(select).not.toBeNull()
      expect(select.required).toBe(true)
      expect(select.value).toBe('')
      expect(Array.from(select.options).map(option => option.value)).toContain(`диаметр ${display} мм`)
      expect(form!.querySelector('button[type="submit"]')).not.toBeNull()
      if (construction === '6×7+FC') {
        expect(Array.from(select.options).map(option => option.value)).not.toContain('диаметр 1 мм')
        expect(Array.from(select.options).map(option => option.value)).not.toContain('диаметр 56 мм')
      }
    }
    expect(tree.querySelector('#stock-assortment')).toBeNull()
  })
})
