import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { homeCatalogGroups, homeCatalogItemCount } from '@/data/homeCatalog'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import CatalogTree from '@/components/CatalogTree'
import { gzipSync } from 'node:zlib'
import { sdtCatalog } from '@/data/sdtCatalog'
import { productSizeSeries, getProductSizeSeries } from '@/data/productSizeSeries'
import { productDetailCatalog } from '@/data/productDetailCatalog'
import { pipeCatalog } from '@/data/pipeCatalog'
import { dimensionGuides, getDimensionGuide } from '@/data/dimensionGuides'
import ProductSizeSeries from '@/components/ProductSizeSeries'
import ProductDetailPage from '@/app/(frontend)/(catalog)/produkciya/[slug]/[detail]/page'
import StandardAssortment from '@/components/StandardAssortment'
import CategoryPage from '@/app/(frontend)/(catalog)/produkciya/[slug]/page'
import { findStandard } from '@/data/standards'
import { findCatalogStandard, getCatalogStandard, getCatalogStandardLinks, getSeriesForStandard, getStandardReferences } from '@/data/catalogStandards'

const privateSupplierSnapshotPath = path.join(process.cwd(), 'private/data/23met-practical-snapshot.json')

describe('unified homepage catalog', () => {
  it('puts section products before explanatory copy and preserves overview links', async () => {
    const page = await CategoryPage({ params: Promise.resolve({ slug: 'sortovoy-i-fasonny-prokat' }) })
    const markup = renderToStaticMarkup(page)
    const tree = new DOMParser().parseFromString(markup, 'text/html')
    const links = [...tree.querySelectorAll('.sc-list li > a')]
    expect(links).toHaveLength(8)
    expect(links.map((a) => a.querySelector('strong')?.textContent)).toContain('Круг горячекатаный')
    expect(links.every((a) => a.getAttribute('href')?.startsWith('/produkciya/sortovoy-i-fasonny-prokat/'))).toBe(true)
    expect(links.every((a) => a.querySelector('.sc-dimension')?.textContent && a.querySelector('.sc-standards')?.textContent)).toBe(true)
    expect(tree.querySelectorAll('.sc-overviews a')).toHaveLength(2)
    expect(markup.indexOf('class="sc-products"')).toBeLessThan(markup.indexOf('class="sc-info"'))
    const request = tree.querySelector('.sc-aside a')!.getAttribute('href')!
    expect(new URL(request, 'https://magicmet.ru').searchParams.get('product')).toBe('Сортовой и фасонный прокат')
  })

  it.each([
    ['krug-i-kvadrat', ['krug-goryachekatanyj', 'kvadrat']],
    ['balka-shveller-ugolok', ['balka-dvutavrovaya', 'shveller', 'ugolok']],
  ] as const)('opens verified size tables from the %s overview without duplicating them', async (detail, profiles) => {
    const category = 'sortovoy-i-fasonny-prokat'
    const page = await ProductDetailPage({ params: Promise.resolve({ slug: category, detail }) })
    const tree = new DOMParser().parseFromString(renderToStaticMarkup(page), 'text/html')
    const links = [...tree.querySelectorAll('#sizes .size-series-nav a')]
    expect(links.map((link) => link.getAttribute('href'))).toEqual(profiles.map((profile) => `/produkciya/${category}/${profile}#sizes`))
    for (const profile of profiles) {
      expect(getProductSizeSeries(category, profile).length).toBeGreaterThan(0)
    }
    expect(tree.querySelectorAll('#sizes')).toHaveLength(1)
    expect(tree.querySelectorAll('#sizes table')).toHaveLength(0)
    const request = tree.querySelector<HTMLAnchorElement>('#sizes .size-series-request')!
    expect(new URL(request.getAttribute('href')!, 'https://magicmet.ru').searchParams.get('product'))
      .toBe(productDetailCatalog.find((item) => item.categorySlug === category && item.slug === detail)!.title)
  })

  it('restores all existing categories and nomenclature in the served static homepage', () => {
    const home = fs.readFileSync(path.join(process.cwd(), 'public/home-static.html'), 'utf8')
    const markup = renderToStaticMarkup(createElement(CatalogTree))
    expect(home).toContain(markup)
    const tree = new DOMParser().parseFromString(markup, 'text/html')
    expect(tree.querySelectorAll('.catalog-group')).toHaveLength(homeCatalogGroups.length)
    expect(tree.querySelectorAll('.catalog-item')).toHaveLength(homeCatalogItemCount)
    for (const [index, group] of homeCatalogGroups.entries()) {
      const section = tree.querySelectorAll('.catalog-group')[index]
      expect(section.querySelector('summary')?.textContent).toContain(group.title)
      for (const item of group.items) {
        const link = Array.from(section.querySelectorAll('a')).find((a) => a.getAttribute('href') === item.href)
        expect(link).toBeDefined()
      }
    }
    const sdt = homeCatalogGroups.find((group) => group.title === 'СДТ')!
    expect(sdt.items.every((item) => sdtCatalog.some((detail) => item.href.split('#')[0] === `/produkciya/sdt/${detail.slug}`))).toBe(true)
  })

  it('renders every category through one normalized data tree', () => {
    expect(homeCatalogGroups.map((group) => group.title)).toEqual([
      'Трубы',
      'СДТ',
      'Трубы и СДТ в изоляции',
      'Листовой и рулонный прокат',
      'Сортовой и фасонный прокат',
      'Нержавеющие и специальные стали',
      'Поковки и заготовки',
      'Цветной металлопрокат',
      'Метизы и сварочные материалы',
      'Оборудование и комплектующие',
    ])
    expect(homeCatalogItemCount).toBeGreaterThan(30)
    expect(homeCatalogGroups.every((group) => group.items.every((item) => item.title && item.size && item.standards && item.grades && item.href))).toBe(true)
  })

  it('keeps the restored tree small and usable without client JavaScript', () => {
    const markup = renderToStaticMarkup(createElement(CatalogTree))
    expect(gzipSync(markup).byteLength).toBeLessThan(10_000)
    expect(markup).not.toContain('<script')
    const tree = new DOMParser().parseFromString(markup, 'text/html')
    expect(tree.querySelectorAll('.catalog-group[open]')).toHaveLength(0)
    expect(tree.querySelectorAll('.catalog-item[open]')).toHaveLength(0)
    for (const item of tree.querySelectorAll('.catalog-item')) {
      expect(item.firstElementChild?.tagName).toBe('SUMMARY')
      expect(item.querySelectorAll('.home-size-series a')).toHaveLength(1)
      expect(item.textContent).not.toContain('Заявка на производство')
    }
  })

  it('isolates the public launch from unfinished internal type errors', () => {
    const config = fs.readFileSync(path.join(process.cwd(), 'next.config.ts'), 'utf8')
    const build = fs.readFileSync(path.join(process.cwd(), 'scripts/build.mjs'), 'utf8')
    expect(config).toContain("ignoreBuildErrors: process.env.SIMPLE_PUBLIC_SITE_BUILD === '1'")
    expect(build).toContain("SIMPLE_PUBLIC_SITE_BUILD: process.env.SIMPLE_PUBLIC_SITE_BUILD || '1'")
  })
})

describe('additional stock assortment', () => {
  it.each([
    ['sortovoy-i-fasonny-prokat', 'armatura', 40],
    ['sortovoy-i-fasonny-prokat', 'katanka', 9],
    ['listovoy-prokat', 'profnastil', 106],
    ['metizy-i-svarochnye-materialy', 'setki', 80],
    ['metizy-i-svarochnye-materialy', 'lenta-upakovochnaya', 9],
  ] as const)('renders verified %s/%s stock separately from normative tables', async (slug, detail, count) => {
    const page = await ProductDetailPage({ params: Promise.resolve({ slug, detail }) })
    const tree = new DOMParser().parseFromString(renderToStaticMarkup(page), 'text/html')
    const rows = [...tree.querySelectorAll('#stock-assortment tbody tr')]
    expect(rows).toHaveLength(count)
    expect(tree.querySelector('#stock-assortment')?.textContent).not.toMatch(/₽|руб\.|RUB|НДС|Цена/)
    expect(tree.querySelectorAll('#sizes')).toHaveLength(0)
    expect(tree.querySelectorAll('.pipe-standards')).toHaveLength(0)
    for (const row of rows) {
      const request = new URL(row.querySelector('a')!.getAttribute('href')!, 'https://magicmet.ru')
      expect(request.hash).toBe('#request')
      expect(request.searchParams.get('product')).toContain('единица учёта')
    }
    if (detail === 'profnastil') {
      expect(rows.every(row => row.textContent?.includes('Единица учёта: м'))).toBe(true)
      expect(rows.some(row => row.textContent?.includes('Уценка'))).toBe(true)
    }
    if (detail === 'lenta-upakovochnaya') expect(rows.some(row => row.textContent?.includes('Ширина: 19'))).toBe(true)
  })
})

describe('rope stock assortment', () => {
  it('keeps six stock rows separate from normative tables and transfers exact execution into the request', async () => {
    const page = await ProductDetailPage({ params: Promise.resolve({ slug: 'metizy-i-svarochnye-materialy', detail: 'kanaty' }) })
    const tree = new DOMParser().parseFromString(renderToStaticMarkup(page), 'text/html')
    const rows = [...tree.querySelectorAll('#stock-assortment tbody tr')]
    expect(rows).toHaveLength(6)
    expect(rows.map(row => row.querySelector('th')?.textContent)).toEqual(['13', '24', '2', '15', '18', '20'])
    expect(tree.querySelector('#stock-assortment')?.textContent).not.toMatch(/₽|руб\.|RUB|НДС|Цена/)
    const selected = new URL(rows[2].querySelector('a')!.getAttribute('href')!, 'https://magicmet.ru')
    expect(selected.hash).toBe('#request')
    expect(selected.searchParams.get('product')).toContain('ГОСТ 3063-80 полимерн. покр 2/3 уценка; размерное обозначение 2; единица учёта м')
    expect(tree.querySelectorAll('#sizes')).toHaveLength(0)
    expect(getProductSizeSeries('metizy-i-svarochnye-materialy', 'kanaty')).toEqual([])
  })
})

describe('normative product size tables', () => {
  it('applies compact presentation to every catalog card while preserving all normative source rows', () => {
    const cards = [...pipeCatalog, ...productDetailCatalog, ...sdtCatalog.map(item => ({ ...item, categorySlug: 'sdt' }))]
      .filter(item => !['krug-i-kvadrat', 'balka-shveller-ugolok', 'kanaty', 'armatura', 'katanka', 'profnastil', 'setki', 'lenta-upakovochnaya'].includes(item.slug))
    for (const card of cards) {
      const series = getProductSizeSeries(card.categorySlug, card.slug)
      const guide = getDimensionGuide(card.categorySlug, card.slug)
      const tree = document.createElement('div')
      tree.innerHTML = renderToStaticMarkup(createElement(ProductSizeSeries, { series, guide, requestHref: '/#request' }))
      expect(tree.querySelectorAll('.size-series-filter')).toHaveLength(series.length)
      const references = tree.querySelectorAll('.size-series-reference')
      series.forEach((table, index) => {
        expect(Array.from(references[index].querySelectorAll('tbody tr'), row => Array.from(row.children, cell => cell.textContent))).toEqual(table.rows)
      })
      if (!series.length) expect(tree.querySelector('.size-series-guide .size-series-selection-request')?.getAttribute('href')).toBe('/#request')
    }
  })

  it('compares three designs against the same rectangular normative rows without public source or stock fields', () => {
    const review = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/catalog-design-profiles.json'), 'utf8'))
    const table = getProductSizeSeries('truby-elektrosvarnye', 'profilnye').find(item => item.standard === 'ГОСТ 8645-68' && !item.title.includes('специальные'))!
    expect(review).toEqual({ title: table.title, standard: table.standard, rows: table.rows, notes: table.notes })
  })

  it('offers specification search in every main profile series while retaining short special rows directly', () => {
    const tables = getProductSizeSeries('truby-elektrosvarnye', 'profilnye')
    const tree = document.createElement('div')
    tree.innerHTML = renderToStaticMarkup(createElement(ProductSizeSeries, { series: tables, requestHref: '/#request' }))
    const details = tree.querySelectorAll('details')
    expect(details).toHaveLength(6)
    tables.forEach((table, index) => {
      expect(Boolean(details[index].querySelector('.size-series-quick-search'))).toBe(!table.title.includes('специальные'))
      expect(Array.from(details[index].querySelectorAll('tbody tr'), row => Array.from(row.children, cell => cell.textContent))).toEqual(table.rows)
    })
  })

  it('keeps the buyer comparison variants on the verified normative source without stock or public source links', () => {
    const review = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/catalog-variant-pipes.json'), 'utf8'))
    const table = getProductSizeSeries('truby-besshovnye', 'holodnodeformirovannye')[0]
    expect(review.standard).toBe(table.standard)
    expect(review.scope).toBe(table.scope)
    expect(review.rows).toEqual(table.rows)
    expect(review.notes).toEqual(table.notes)
    expect(Object.keys(review).sort()).toEqual(['notes', 'product', 'rows', 'scope', 'standard'])
  })

  it('opens sheet combinations first and offers exact thickness groups without removing the full table', () => {
    const tables = getProductSizeSeries('listovoy-prokat', 'goryachekatanyj')
    const tree = document.createElement('div')
    tree.innerHTML = renderToStaticMarkup(createElement(ProductSizeSeries, { series: tables, requestHref: '/#request' }))
    const details = tree.querySelectorAll('details')
    const formatIndex = tables.findIndex(table => table.title.startsWith('Форматы'))
    expect(details[formatIndex].hasAttribute('open')).toBe(true)
    expect(details[0].hasAttribute('open')).toBe(false)
    const formats = tables[formatIndex]
    const select = details[formatIndex].querySelector('select')!
    expect(Array.from(select.options).slice(1).map(option => option.value)).toEqual([...new Set(formats.rows.map(row => row[0]))])
    expect(details[formatIndex].querySelector('.size-series-filter')?.hasAttribute('hidden')).toBe(true)
    expect(details[formatIndex].querySelectorAll('tbody tr')).toHaveLength(formats.rows.length)
  })

  it('keeps short tables directly readable without a redundant size selector', () => {
    const table = getProductSizeSeries('sortovoy-i-fasonny-prokat', 'balka-dvutavrovaya').find(table => table.standard === 'ГОСТ 8239-89')!
    const tree = document.createElement('div')
    tree.innerHTML = renderToStaticMarkup(createElement(ProductSizeSeries, { series: [table], requestHref: '/#request' }))
    expect(tree.querySelector('select')).toBeNull()
    expect(tree.querySelectorAll('tbody tr')).toHaveLength(table.rows.length)
  })

  it('preserves the 51 normative cards alongside the separate stock assortment', () => {
    const cards = [...pipeCatalog, ...productDetailCatalog, ...sdtCatalog.map((item) => ({ ...item, categorySlug: 'sdt' }))]
      .filter((item) => !['krug-i-kvadrat', 'balka-shveller-ugolok', 'kanaty', 'armatura', 'katanka', 'profnastil', 'setki', 'lenta-upakovochnaya'].includes(item.slug))
    expect(cards).toHaveLength(51)
    expect(cards.filter((item) => getProductSizeSeries(item.categorySlug, item.slug).length)).toHaveLength(45)
    expect(cards.filter((item) => getProductSizeSeries(item.categorySlug, item.slug).some((table) => table.kind !== 'requirements'))).toHaveLength(38)
    expect(cards.filter((item) => {
      const tables = getProductSizeSeries(item.categorySlug, item.slug)
      return tables.length && tables.every((table) => table.kind === 'requirements')
    })).toHaveLength(7)
    expect(cards.filter((item) => !getProductSizeSeries(item.categorySlug, item.slug).length && getDimensionGuide(item.categorySlug, item.slug))).toHaveLength(6)
    expect(cards.filter((item) => !getProductSizeSeries(item.categorySlug, item.slug).length && !getDimensionGuide(item.categorySlug, item.slug))).toEqual([])
    expect(new Set(dimensionGuides.map((g) => `${g.categorySlug}/${g.productSlug}`)).size).toBe(dimensionGuides.length)
  })

  it('renders drawing guidance without pretending it is a numeric GOST table', () => {
    const guide = getDimensionGuide('pokovki-i-zagotovki', 'po-chertezhu')!
    const markup = renderToStaticMarkup(createElement(ProductSizeSeries, { series: [], guide, requestHref: '/?product=forging#request' }))
    const tree = new DOMParser().parseFromString(markup, 'text/html')
    expect(tree.querySelector('#sizes h2')?.textContent).toBe('Размеры по спецификации')
    expect(tree.querySelectorAll('table')).toHaveLength(0)
    expect(tree.querySelectorAll('.size-series-guide li')).toHaveLength(guide.parameters.length)
    expect(tree.querySelector('.size-series-request')?.getAttribute('href')).toBe('/?product=forging#request')
    expect(markup).not.toContain(guide.source.url)
    expect(renderToStaticMarkup(createElement(ProductSizeSeries, { series: [], requestHref: '/#request' }))).toBe('')
  })

  it('keeps PPU shell types separate and wire diameters scoped to steel welding wire', () => {
    const [pe, steel] = getProductSizeSeries('truby-i-sdt-v-izolyacii', 'ppu')
    expect(pe.rows).toHaveLength(23)
    expect(steel.rows).toHaveLength(23)
    expect(pe.rows[0]).toEqual(['32', '90; 110; 125', '—'])
    expect(steel.rows[0]).toEqual(['32', '—', '125'])
    expect(steel.rows.at(-1)).toEqual(['1420', '1575; 1600', '—'])
    const [wire] = getProductSizeSeries('metizy-i-svarochnye-materialy', 'svarochnye-materialy')
    expect(wire.rows).toHaveLength(17)
    expect(wire.rows[0]).toEqual(['0,3', '−0,05'])
    expect(wire.rows.at(-1)).toEqual(['12,0', '−0,24'])
    expect(wire.notes.join(' ')).toContain('только к стальной сварочной проволоке')
  })

  it('keeps nonferrous semi-finished product dimensions and current aluminium edition distinct', () => {
    const slugs = ['med', 'latun', 'bronza', 'alyuminij', 'titan', 'nihrom']
    const tables = slugs.map((slug) => getProductSizeSeries('cvetnye-metally', slug)[0])
    expect(tables.map((table) => table.rows.length)).toEqual([31, 9, 5, 33, 33, 5])
    expect(tables[0].rows[0]).toEqual(['20', '2000–5000'])
    expect(tables[0].rows.at(-1)).toEqual(['180', '500–2000'])
    expect(tables[3].standard).toBe('ГОСТ 21488-2025')
    expect(tables[4].rows.at(-1)).toEqual(['150', '500–2000'])
    for (const slug of ['olovo', 'svinec', 'cink', 'babbit']) {
      const requirements = getProductSizeSeries('cvetnye-metally', slug)
      expect(requirements).toHaveLength(1)
      expect(requirements[0].kind).toBe('requirements')
      expect(getDimensionGuide('cvetnye-metally', slug)?.parameters.length).toBeGreaterThan(0)
    }
  })

  it('distinguishes nonferrous mass requirements and block limits from finished ingot dimensions', () => {
    const [tin] = getProductSizeSeries('cvetnye-metally', 'olovo')
    const [lead] = getProductSizeSeries('cvetnye-metally', 'svinec')
    const [zinc] = getProductSizeSeries('cvetnye-metally', 'cink')
    const [babbit] = getProductSizeSeries('cvetnye-metally', 'babbit')
    expect(tin.scope).toContain('О1 пч, О1 и О2')
    expect(tin.rows).toEqual([['Блок', 'Длина', '≤1500'], ['Блок', 'Ширина', '≤1000'], ['Блок', 'Высота', '≤500']])
    expect(lead.rows).toEqual([['Чушка', '30–40', 'Диапазон массы'], ['Блок', '1000', '±10 %'], ['Блок', '2000', '±10 %'], ['Блок', '3000', '±10 %']])
    expect(zinc.rows).toEqual([
      ['Кроме ЦВ00', 'Чушка', '19–25', 'Диапазон массы'],
      ['Кроме ЦВ00', 'Блок', '500', '±10 %'],
      ['Кроме ЦВ00', 'Блок', '1000', '±10 %'],
      ['ЦВ00', 'Чушка', '4–5', 'Диапазон массы'],
      ['ЦВ00', 'Чушка', '8–10', 'Диапазон массы'],
    ])
    expect(babbit.rows).toEqual([['Чушка', 'Масса', '≤22']])
    expect(tin.notes.join(' ')).toContain('изложниц')
    expect(babbit.notes.join(' ')).toContain('размеры чушек не контролируются')
    for (const table of [tin, lead, zinc, babbit]) {
      const markup = renderToStaticMarkup(createElement(ProductSizeSeries, { series: [table], requestHref: '/?product=nonferrous#request' }))
      const tree = new DOMParser().parseFromString(markup, 'text/html')
      expect(tree.querySelector('#sizes h2')?.textContent).toBe('Нормативные параметры по ГОСТ')
      expect(tree.querySelectorAll('table.size-series-requirements')).toHaveLength(1)
      expect(tree.querySelectorAll('tbody tr')).toHaveLength(table.rows.length)
      expect(markup).not.toContain('Размерный ряд по ГОСТ')
      expect(markup).not.toContain(table.source.url)
    }
  })

  it('scopes stainless section dimensions by hot-rolled form without importing carbon-steel masses', () => {
    const tables = getProductSizeSeries('nerzhaveyushchaya-stal', 'sortovoy-prokat')
    expect(tables).toHaveLength(4)
    expect(tables.map((table) => table.rows.length)).toEqual([94, 65, 40, 63])
    const [round, square, strip, hexagon] = tables
    expect(round.rows[0]).toEqual(['5'])
    expect(round.rows.at(-1)).toEqual(['200'])
    expect(square.rows[0]).toEqual(['6'])
    expect(square.rows.at(-1)).toEqual(['200'])
    expect(strip.rows[0]).toEqual(['10', '5'])
    expect(strip.rows.find((row) => row[0] === '12')).toEqual(['12', '4; 5; 6; 8'])
    expect(strip.scope).toContain('4405')
    expect(hexagon.standard).toContain('ГОСТ 2879-2006')
    expect(hexagon.rows[0]).toEqual(['8'])
    expect(hexagon.rows.at(-1)).toEqual(['103'])
    expect(hexagon.rows.map((row) => row[0])).toContain('42,5')
    expect(hexagon.rows.map((row) => row[0])).toContain('47')
    expect(hexagon.rows.map((row) => row[0])).not.toContain('45')
    for (const table of tables) {
      expect(table.standard).toContain('ГОСТ 5949-2018')
      expect(table.columns.join(' ')).not.toMatch(/Масса|кг/)
      expect(table.notes.join(' ')).toContain('Кованая, калиброванная')
    }
    expect(round.notes.join(' ')).toContain('свыше 200 до 350 мм')
  })

  it('keeps exterior coating minimums distinct from pipe sizes and application-specific approvals', () => {
    const [polymer] = getProductSizeSeries('truby-i-sdt-v-izolyacii', 'vus')
    const [epoxy] = getProductSizeSeries('truby-i-sdt-v-izolyacii', 'epoksidnaya')
    const [shrink] = getProductSizeSeries('truby-i-sdt-v-izolyacii', 'tum-lenta')
    expect(polymer.rows.map((row) => row.slice(1))).toEqual([['2,0', '60'], ['2,2', '60'], ['2,5', '60'], ['3,0', '60']])
    expect(epoxy.rows).toEqual([['До 820 включ.', '0,35', '80']])
    expect(shrink.rows.at(-1)).toEqual(['Св. 820 до 1420 включ.', '2,4', '2,0'])
    expect(shrink.notes.join(' ')).toContain('100 °C')
    expect(polymer.notes.join(' ')).toContain('820<D<1020')
    for (const table of [polymer, epoxy, shrink]) {
      expect(table.kind).toBe('requirements')
      expect(table.standard).toBe('ГОСТ Р 51164-98, таблица 1')
      expect(table.scope).toContain('Наружная')
      expect(table.scope).toContain('Не применять автоматически к теплопроводам')
      expect(table.scope).toContain('внутренней поверхности')
    }
  })

  it('separates recommended PPU elbow shells and angle lengths without extending them to every insulated fitting', () => {
    const [shells, lengths] = getProductSizeSeries('truby-i-sdt-v-izolyacii', 'sdt-v-izolyacii')
    expect(shells.rows).toHaveLength(23)
    expect(lengths.rows).toHaveLength(28)
    expect(shells.rows[0]).toEqual(['32', '125', '—', '—', '125'])
    expect(shells.rows.at(-1)).toEqual(['1420', '1600', '—', '1575; 1600', '—'])
    expect(shells.rows.find((row) => row[0] === '920')).toEqual(['920', '1100', '1200', '1075; 1100', '—'])
    expect(shells.notes.join(' ')).toMatch(/920[\s\S]*1075/)
    expect(shells.notes.join(' ')).toMatch(/сварн/iu)
    const rows = (diameter: string) => lengths.rows.filter((row) => row[0] === diameter)
    expect(rows('630')).toEqual([
      ['630', 'По таблице Д.1', '1300', '945', '848', '761'],
      ['630', 'Сварной', '1280', '1014', '911', '819'],
    ])
    expect(rows('920')).toEqual([
      ['920', 'По таблице Д.1', '1772', '1132', '1032', '846'],
      ['920', 'Сварной', '1570', '1132', '1032', '846'],
    ])
    expect(rows('1020')).toEqual([
      ['1020', 'По таблице Д.1', '1924', '1189', '1022', '874'],
      ['1020', 'Сварной', '1620', '1189', '1022', '874'],
    ])
    expect(lengths.rows.at(-1)).toEqual(['1420', 'Сварной', '2020', '1420', '1188', '980'])
    for (const table of [shells, lengths]) {
      expect(table.kind).toBe('dimensions')
      expect(table.scope).toContain('Приложение Д рекомендуемое')
      expect(table.title).toContain('отводы')
      expect(table.scope).toContain('не распространяется на все системы изоляции')
    }
    expect(lengths.rows.filter((row) => row[1] === 'Сварной')).toHaveLength(7)
  })

  it('separates spiral general-purpose and mainline standards without inventing wall combinations', () => {
    const [spiral, mainlineSpiral] = getProductSizeSeries('truby-elektrosvarnye', 'spiraleshovnye')
    const [mainline] = getProductSizeSeries('truby-elektrosvarnye', 'magistralnye')
    const pairs = (rows: string[][]) => rows.flatMap((row) => row[1].split('; ').map((s) => [Number(row[0]), Number(s.replace(',', '.'))]))
    expect(spiral.standard).toBe('ГОСТ 8696-74')
    expect(spiral.rows).toHaveLength(21)
    expect(pairs(spiral.rows)).toHaveLength(143)
    expect(pairs(spiral.rows)).not.toContainEqual([159, 9])
    expect(spiral.scope).toContain('не распространяется на магистральные')
    expect(pairs(mainline.rows)).toHaveLength(604)
    expect(mainline.rows).toHaveLength(24)
    expect(mainline.rows.at(-1)![0]).toBe('1420')
    expect(mainlineSpiral.rows).toHaveLength(19)
    expect(pairs(mainlineSpiral.rows)).toHaveLength(518)
    expect(mainline.rows.find((r) => r[0] === '114')![2]).toBe('1')
    const [cracking] = getProductSizeSeries('truby-besshovnye', 'krekingovye')
    expect(cracking.standard).toBe('ГОСТ 550-2020')
    expect(cracking.rows).toEqual([['Горячий', '25–550', '2,5–40,0', '2,5–12,2'], ['Холодный', '11–250', '1,5–24,0', '2,5–12,2']])
    expect(cracking.scope).toContain('не матрица всех сочетаний')
  })

  it('limits stainless sheet nominal thicknesses by production method and technical standard', () => {
    const [thin, thick] = getProductSizeSeries('nerzhaveyushchaya-stal', 'list')
    expect(thin.standard).toBe('ГОСТ 5582-75')
    expect(thick.standard).toBe('ГОСТ 7350-77')
    expect(thin.rows.map((row) => row[1])).toEqual(['1,5–3,9', '0,5–3,9'])
    expect(thick.rows.map((row) => row[1])).toEqual(['4–50', '4–5'])
    const values = (text: string) => text.split('; ').map((v) => Number(v.replace(',', '.')))
    expect(thin.rows.map((row) => values(row[2]).length)).toEqual([12, 26])
    expect(thick.rows.map((row) => values(row[2]).length)).toEqual([59, 5])
    expect(values(thin.rows[0][2])).not.toContain(1.4)
    expect(values(thin.rows[1][2])).not.toContain(0.45)
    expect(values(thick.rows[0][2])).not.toContain(55)
    expect(values(thick.rows[1][2])).toEqual([4, 4.2, 4.5, 4.8, 5])
    expect(thick.notes.join(' ')).toContain('более 20 мм с обрезной кромкой')
    expect(thick.notes.join(' ')).toContain('1 января 2027')
  })

  it('keeps galvanized product ranges distinct from coil diameters and fixed sheet formats', () => {
    const tables = getProductSizeSeries('listovoy-prokat', 'ocinkovannyj')
    expect(tables).toHaveLength(2)
    const [sizes, coils] = tables
    expect(sizes.standard).toBe('ГОСТ 14918-2020')
    expect(sizes.rows).toEqual([
      ['Лист', '0,22–4,50', '700–1800'],
      ['Рулон проката', '0,22–4,50', '600–1800'],
      ['Лента из рулона', '0,22–4,50', 'От 30 до менее 600'],
    ])
    expect(sizes.notes.join(' ')).toContain('включает толщину покрытия')
    expect(sizes.notes.join(' ')).toContain('Длину листа указывают в заказе')
    expect(sizes.scope).toContain('не перечень фиксированных форматов')
    expect(coils.rows).toEqual([
      ['Внутренний Ø', '500; 508; 600; 610; 750', '300–750'],
      ['Отклонение Øвн', '±20', '±20'],
      ['Наружный Ø, макс.', '1850', '1850'],
    ])
    const markup = renderToStaticMarkup(createElement(ProductSizeSeries, { series: tables, requestHref: '/?product=galvanized#request' }))
    const tree = new DOMParser().parseFromString(markup, 'text/html')
    expect(tree.querySelectorAll('details[open]')).toHaveLength(1)
    expect(tree.querySelectorAll('.size-series-nav a')).toHaveLength(2)
    expect(tree.querySelectorAll('tbody tr')).toHaveLength(6)
    expect(markup).not.toContain(sizes.source.url)
  })

  it('preserves execution 1 reducer dimensions and missing large-end walls', () => {
    const tables = getProductSizeSeries('sdt', 'perekhody-besshovnye')
    const table = tables[1]
    expect(tables).toHaveLength(2)
    expect(table.rows).toHaveLength(63)
    const pairs = table.rows.flatMap((row) => row[3].split('; '))
    expect(pairs.filter((pair) => !pair.includes('—'))).toHaveLength(123)
    expect(pairs.filter((pair) => pair.startsWith('—/') && pair !== '—/—')).toHaveLength(6)
    expect(pairs.filter((pair) => pair === '—/—')).toHaveLength(6)
    expect(table.rows[0]).toEqual(['20', '26,9', '21,3', '2/2; 3,2/3,2; 4/4', '38'])
    expect(table.rows.at(-1)).toEqual(['1000', '1016', '914', '—/—', '610'])
    expect(table.rows.find((row) => row[1] === '711' && row[2] === '457')).toEqual(['700', '711', '457', '—/10', '610'])
    expect(table.rows.find((row) => row[1] === '60,3' && row[2] === '33,7')![3]).toBe('2,9/2,3; 4/3,2; 5,6/4,5')
    expect(table.notes.join(' ')).toContain('r1 ≥ 0,4D')
    expect(table.notes.join(' ')).toContain('r2 ≥ 0,3D1')
    const markup = renderToStaticMarkup(createElement(ProductSizeSeries, { series: tables, requestHref: '/?product=reducer#request' }))
    const tree = new DOMParser().parseFromString(markup, 'text/html')
    expect(tree.querySelectorAll('details[open]')).toHaveLength(1)
    expect(tree.querySelectorAll('.size-series-nav a')).toHaveLength(2)
    expect(tree.querySelectorAll('tbody tr')).toHaveLength(141)
    expect(markup).not.toContain(table.source.url)
  })

  it('keeps reducer wall pairs tied to their normative lengths in execution 2', () => {
    const [table] = getProductSizeSeries('sdt', 'perekhody-besshovnye')
    expect(table.standard).toBe('ГОСТ 17378-2001')
    expect(table.rows).toHaveLength(78)
    expect(table.rows.reduce((n, row) => n + row[3].split('; ').length, 0)).toBe(375)
    expect(table.rows[0]).toEqual(['32', '38', '25', '2/1,6; 3/3; 4/3', '30'])
    const alternative = table.rows.filter((row) => row[1] === '133' && row[2] === '108')
    expect(alternative.map((row) => row[4])).toEqual(['80', '100'])
    expect(alternative[0][3]).toBe('5/4; 6/5; 8/7; 10/9')
    expect(alternative[1][3]).toBe('5/4; 8/6; 8/8; 10/9')
    expect(alternative[1][3]).not.toContain('5/8')
    expect(table.rows.every((row) => Number(row[1]) > Number(row[2]))).toBe(true)
    expect(table.rows.at(-1)).toEqual(['500', '530', '426', '12/10; 14/12; 16/16; 20/16; 22/20; 26/22', '300'])
    const markup = renderToStaticMarkup(createElement(ProductSizeSeries, { series: [table], requestHref: '/?product=reducer#request' }))
    const tree = new DOMParser().parseFromString(markup, 'text/html')
    expect(tree.querySelectorAll('details[open]')).toHaveLength(1)
    expect(tree.querySelectorAll('tbody tr')).toHaveLength(78)
    expect(markup).not.toContain(table.source.url)
  })

  it('preserves execution 1 tee wall pairs and unspecified large-diameter walls', () => {
    const tables = getProductSizeSeries('sdt', 'troyniki-besshovnye')
    const [equal, reducing] = tables.slice(2)
    expect(tables).toHaveLength(4)
    expect(equal.rows).toHaveLength(23)
    expect(reducing.rows).toHaveLength(52)
    const numericPairs = (rows: string[][], column: number) => rows.flatMap((row) => row[column] === '—' ? [] : row[column].split('; '))
    expect(numericPairs(equal.rows, 2)).toHaveLength(47)
    expect(numericPairs(reducing.rows, 3)).toHaveLength(124)
    expect(equal.rows.find((row) => row[1] === '60,3')).toEqual(['50', '60,3', '2,9/2,3; 4/3,2; 5,6/4,5', '64', '64'])
    expect(equal.rows.filter((row) => row[2] === '—').map((row) => row[0])).toEqual(['700', '800', '900', '1000'])
    expect(equal.rows.at(-1)).toEqual(['1000', '1016', '—', '749', '749'])
    expect(reducing.rows.every((row) => Number(row[1].replace(',', '.')) > Number(row[2].replace(',', '.')))).toBe(true)
    expect(reducing.rows.find((row) => row[1] === '60,3' && row[2] === '48,3')![3]).toBe('2,9/2,6; 4/3,6; 5,6/5')
    expect(equal.notes.join(' ')).toContain('не означает нулевую толщину')
    const markup = renderToStaticMarkup(createElement(ProductSizeSeries, { series: tables, requestHref: '/?product=tee#request' }))
    const tree = new DOMParser().parseFromString(markup, 'text/html')
    expect(tree.querySelectorAll('details[open]')).toHaveLength(1)
    expect(tree.querySelectorAll('.size-series-nav a')).toHaveLength(4)
    expect(tree.querySelectorAll('tbody tr')).toHaveLength(121)
    expect(tree.querySelectorAll('details')[3].querySelector('tbody tr td:nth-child(4)')?.classList.contains('size-series-list')).toBe(true)
    expect(markup).not.toContain(equal.source.url)
  })

  it('keeps execution 2 tee wall thicknesses paired and preserves added nominal groups', () => {
    const [equal, reducing] = getProductSizeSeries('sdt', 'troyniki-besshovnye')
    expect(equal.standard).toBe('ГОСТ 17376-2001')
    expect(equal.rows).toHaveLength(17)
    expect(reducing.rows).toHaveLength(29)
    const values = (text: string) => text.split('; ').map((v) => Number(v.replace(',', '.')))
    expect(equal.rows.reduce((n, row) => n + values(row[2]).length, 0)).toBe(65)
    expect(reducing.rows.reduce((n, row) => n + row[3].split('; ').length, 0)).toBe(115)
    expect(equal.rows[0]).toEqual(['15', '20', '2; 3; 4', '25', '15', '—'])
    expect(equal.rows.find((row) => row[1] === '57')![4]).toBe('45')
    expect(equal.rows.find((row) => row[1] === '114')).toEqual(['100', '114', '4; 5; 6; 9', '100', '90', '5'])
    const pair57 = reducing.rows.find((row) => row[1] === '57' && row[2] === '45')!
    expect(pair57[3].split('; ')).toEqual(['3/2,5', '4/3', '5/4'])
    expect(pair57[3]).not.toContain('4/2,5')
    expect(reducing.rows.every((row) => Number(row[1]) > Number(row[2]))).toBe(true)
    expect(equal.source.url).not.toContain('23met')
    const markup = renderToStaticMarkup(createElement(ProductSizeSeries, { series: [equal, reducing], requestHref: '/?product=tee#request' }))
    const tree = new DOMParser().parseFromString(markup, 'text/html')
    expect(tree.querySelectorAll('details[open]')).toHaveLength(1)
    expect(tree.querySelectorAll('.size-series-nav a')).toHaveLength(2)
    expect(tree.querySelectorAll('tbody tr')).toHaveLength(46)
    expect(markup).not.toContain(equal.source.url)
  })

  it('preserves current stainless cold-deformed wall pairs with their individual maximum measured lengths', () => {
    const tables = getProductSizeSeries('truby-besshovnye', 'nerzhaveyushchie')
    expect(tables.map((table) => table.standard)).toEqual(['ГОСТ 9940-81', 'ГОСТ 9941-2022'])
    const table = tables[1]
    expect(table.rows).toHaveLength(152)
    const pairs = table.rows.flatMap(([D, walls, length]) => walls.split('; ').map((s) => [Number(D.replace(',', '.')), Number(s.replace(',', '.')), Number(length.replace(',', '.'))]))
    expect(pairs).toHaveLength(1521)
    expect(new Set(pairs.map(([D]) => D)).size).toBe(73)
    expect(new Set(pairs.map(([D, s]) => `${D}×${s}`)).size).toBe(1521)
    expect(pairs.every(([D, s, length]) => D > 2 * s && length >= 0.6)).toBe(true)
    expect(pairs).toContainEqual([5, 0.2, 5])
    expect(pairs).toContainEqual([273, 6, 6.5])
    expect(pairs).toContainEqual([325, 8, 10])
    expect(pairs).toContainEqual([377, 8, 12])
    expect(pairs).toContainEqual([426, 40, 4])
    expect(pairs.some(([D, s]) => D === 325 && [8.5, 9, 9.5].includes(s))).toBe(false)
    expect(table.notes.join(' ')).toContain('Прочерк')
    expect(table.notes.join(' ')).toContain('по согласованию')
    expect(getProductSizeSeries('nerzhaveyushchaya-stal', 'truby')[1].rows).toBe(table.rows)
    const markup = renderToStaticMarkup(createElement(ProductSizeSeries, { series: tables, requestHref: '/?product=stainless#request' }))
    const tree = new DOMParser().parseFromString(markup, 'text/html')
    expect(tree.querySelectorAll('details[open]')).toHaveLength(1)
    expect(tree.querySelectorAll('.size-series-nav a')).toHaveLength(2)
    expect(tree.querySelectorAll('details')[1].querySelectorAll('tbody tr')).toHaveLength(152)
    expect(markup).not.toContain(table.source.url)
  })

  it('keeps stainless hot-deformed wall pairs and length agreements distinct on both existing cards', () => {
    const table = getProductSizeSeries('truby-besshovnye', 'nerzhaveyushchie')[0]
    const second = getProductSizeSeries('nerzhaveyushchaya-stal', 'truby')[0]
    expect(table.standard).toBe('ГОСТ 9940-81')
    expect(table.rows).toBe(second.rows)
    expect(table.rows).toHaveLength(25)
    const values = (text: string) => text === '—' ? [] : text.split('; ').map((s) => Number(s.replace(',', '.')))
    expect(table.rows.reduce((n, row) => n + values(row[1]).length, 0)).toBe(474)
    expect(table.rows.reduce((n, row) => n + values(row[2]).length, 0)).toBe(59)
    for (const row of table.rows) expect(values(row[2]).every((s) => values(row[1]).includes(s))).toBe(true)
    const row73 = table.rows.find((row) => row[0] === '73')!
    expect(values(row73[1])).not.toContain(3.5)
    expect(values(row73[1])).not.toContain(4)
    expect(values(row73[2])).toContain(10)
    expect(table.rows.find((row) => row[0] === '146')![2]).toBe('28')
    expect(values(table.rows.find((row) => row[0] === '146')![1])).not.toContain(30)
    expect(table.rows.find((row) => row[0] === '325')![1]).toBe('12; 13; 14; 15; 16')
    expect(table.notes.join(' ')).toContain('159×9')
    expect(table.notes.join(' ')).toContain('освоения оборудования')
    expect(table.summary).toBeUndefined()
  })

  it('uses the same verified sizes in the GOST handbook without stock signals', () => {
    const standard = findStandard('ГОСТ 8732-2025')!
    expect(standard).toBeDefined()
    const markup = renderToStaticMarkup(createElement(StandardAssortment, { standard }))
    const tree = new DOMParser().parseFromString(markup, 'text/html')
    const tables = productSizeSeries.filter((table) => table.standard === standard.code)
    expect(tree.querySelectorAll('table tbody tr')).toHaveLength(tables.reduce((sum, table) => sum + table.rows.length, 0))
    expect(tree.querySelectorAll('.size-series-standard')).toHaveLength(tables.length)
    expect(markup).not.toMatch(/Наличие|доступность|assortment-legend|signal-/i)
    expect([...tree.querySelectorAll('a')].every((link) => !/^https?:/.test(link.getAttribute('href') || ''))).toBe(true)
  })

  it('links directly to every beam type inside its native disclosure', () => {
    const series = getProductSizeSeries('sortovoy-i-fasonny-prokat', 'balka-dvutavrovaya')
    const markup = renderToStaticMarkup(createElement(ProductSizeSeries, { series, requestHref: '/?product=beam#request' }))
    const tree = new DOMParser().parseFromString(markup, 'text/html')
    const links = [...tree.querySelectorAll('.size-series-nav a')]
    expect(links).toHaveLength(8)
    expect(links.slice(0, 7).map((link) => link.textContent)).toEqual(['Тип Б', 'Тип Ш', 'Тип К', 'Тип С', 'Тип ДБ', 'Тип ДК', 'Тип У'])
    for (const [index, link] of links.entries()) {
      const target = tree.getElementById(link.getAttribute('href')!.slice(1))!
      expect(target.textContent).toBe(series[index].scope)
      expect(target.closest('details')).toBe(tree.querySelectorAll('#sizes details')[index])
    }
    expect(tree.querySelectorAll('#sizes details[open]')).toHaveLength(1)
    expect(markup).not.toContain('<script')
  })

  it('keeps numeric lists intact and explains restrictions before the table', () => {
    const coil = getProductSizeSeries('listovoy-prokat', 'holodnokatanyj').find((table) => table.title.includes('рулона'))!
    const markup = renderToStaticMarkup(createElement(ProductSizeSeries, { series: [coil], requestHref: '/?product=coil#request' }))
    const tree = new DOMParser().parseFromString(markup, 'text/html')
    const row = [...tree.querySelectorAll('tbody tr')].find((item) => item.querySelector('th')?.textContent === '1800')!
    expect(row.querySelectorAll('td.size-series-list')).toHaveLength(2)
    expect([...row.querySelectorAll('td')].map((cell) => cell.textContent)).toEqual(coil.rows.find((item) => item[0] === '1800')!.slice(1))
    const legend = tree.querySelector('.size-series-legend')!
    expect(legend.textContent).toBe(coil.notes[0])
    expect(legend.compareDocumentPosition(tree.querySelector('.size-series-scroll')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(tree.querySelector('caption')?.textContent).toContain(coil.standard)
    expect(tree.querySelectorAll('.size-series-nav')).toHaveLength(0)
  })

  it('separates sheet nominal series from thickness-dependent formats', () => {
    const numbers = (value: string) => [...value.matchAll(/\d+(?:[.,]\d+)?/g)].map((match) => Number(match[0].replace(',', '.')))
    const sheets = ['goryachekatanyj', 'holodnokatanyj'].map((slug) => getProductSizeSeries('listovoy-prokat', slug))
    for (const [index, tables] of sheets.entries()) {
      expect(tables).toHaveLength(3)
      const thicknesses = tables[0].rows.filter((row) => row[0] === 'Толщина').flatMap((row) => numbers(row[1]))
      expect(thicknesses).toHaveLength(index === 0 ? 117 : 34)
      expect(new Set(thicknesses).size).toBe(thicknesses.length)
      expect(thicknesses[0]).toBe(index === 0 ? 0.4 : 0.35)
      expect(thicknesses.at(-1)).toBe(index === 0 ? 160 : 5)
      expect(thicknesses).not.toContain(index === 0 ? 12.7 : 0.3)
      expect(tables[1].scope).toContain('справочного приложения')
    }
    const format = (rows: string[][], thickness: number, width: number) => rows.find((row) => {
      const bounds = numbers(row[0])
      return thickness >= bounds[0] && thickness <= (bounds[1] ?? bounds[0]) && numbers(row[1]).includes(width)
    })
    const hot = sheets[0][1].rows
    expect(format(hot, 0.4, 500)?.slice(2)).toEqual(['1200', '1200'])
    expect(format(hot, 1, 710)?.slice(2)).toEqual(['1420', '2000'])
    expect(format(hot, 2, 900)?.slice(2)).toEqual(['1800', '6000'])
    expect(format(hot, 0.4, 4400)).toBeUndefined()
    expect(format(hot, 160, 500)).toBeUndefined()
    const cold = sheets[1][1].rows
    expect(format(cold, 2.5, 1000)?.slice(2)).toEqual(['1500', '4000'])
    expect(format(cold, 1.4, 2300)?.slice(2)).toEqual(['2200', '3500'])
    expect(format(cold, 2, 2300)?.slice(2)).toEqual(['2000', '3500'])
    expect(format(cold, 0.35, 2350)).toBeUndefined()
    expect(format(cold, 5, 1000)).toBeUndefined()
  })

  it('preserves coil combinations and low-carbon-only restrictions separately from sheets', () => {
    const numbers = (value: string) => [...value.matchAll(/\d+(?:[.,]\d+)?/g)].map((match) => Number(match[0].replace(',', '.')))
    const hot = getProductSizeSeries('listovoy-prokat', 'goryachekatanyj').find((table) => table.title.includes('рулона'))!
    const cold = getProductSizeSeries('listovoy-prokat', 'holodnokatanyj').find((table) => table.title.includes('рулона'))!
    expect(hot.rows).toHaveLength(27)
    expect(cold.rows).toHaveLength(25)
    const thicknesses = (table: typeof hot, width: string, column = 1) => numbers(table.rows.find((row) => row[0] === width)![column])
    expect(thicknesses(hot, '550')).not.toContain(11)
    expect(thicknesses(hot, '500')).toContain(11)
    expect(thicknesses(hot, '(710)')).toContain(1.5)
    expect(thicknesses(hot, '2100')).toEqual([7, 7.5, 8, 8.5, 9, 9.5, 10])
    expect(thicknesses(hot, '500')).not.toContain(0.4)
    expect(thicknesses(cold, '1800')).not.toContain(0.8)
    expect(thicknesses(cold, '1800', 2)).toContain(0.8)
    expect(thicknesses(cold, '1900')).toEqual([2.2, 2.5])
    expect(thicknesses(cold, '1900', 2)).toEqual([0.9, 1, 1.1, 1.2, 1.3, 1.4])
    expect(thicknesses(cold, '2300')).toEqual([2.2, 2.5])
    expect(cold.rows.some((row) => row[0] === '2350')).toBe(false)
    expect(cold.notes.join(' ')).toContain('Только для низкоуглеродистых')
    expect(cold.columns.some((column) => /Длина/.test(column))).toBe(false)
  })

  it('separates modern beam types and preserves complete profile designations', () => {
    const tables = getProductSizeSeries('sortovoy-i-fasonny-prokat', 'balka-dvutavrovaya')
    const modern = tables.filter((table) => table.standard === 'ГОСТ 35087-2024')
    expect(tables[0].title).toContain('тип Б')
    expect(modern.map((table) => table.rows.length)).toEqual([49, 74, 51, 14, 77, 37, 17])
    const profiles = modern.flatMap((table) => table.rows.map((row) => row[0]))
    expect(new Set(profiles).size).toBe(319)
    expect(profiles).toContain('35К1,5')
    expect(profiles).toContain('40К4,5')
    expect(profiles).toContain('10У')
    expect(modern[0].rows[0]).toEqual(['10Б1', '100,0', '55,0', '4,1', '5,7', '8,10'])
    expect(tables.find((table) => table.standard === 'ГОСТ 8239-89')?.rows).toHaveLength(17)
  })

  it('keeps construction profile combinations distinct and preserves gaps in the normative wall series', () => {
    const all = getProductSizeSeries('truby-elektrosvarnye', 'profilnye')
    const construction = all.filter((table) => table.standard === 'ГОСТ 30245-2003')
    expect(construction).toHaveLength(2)
    expect(all.some((table) => table.standard === 'ГОСТ 8639-82')).toBe(true)
    expect(all.some((table) => table.standard === 'ГОСТ 8645-68')).toBe(true)
    const walls = (section: string) => {
      const row = construction.flatMap((table) => table.rows).find((row) => row[0] === section)!
      return row[1].split(';').map((value) => Number(value.trim().replace(',', '.')))
    }
    expect(walls('40×40')).toEqual([2, 2.5, 3, 3.5, 4])
    expect(walls('50×30')).toEqual([2, 2.5, 3, 3.5, 4, 5])
    expect(walls('50×30')).not.toContain(4.5)
    expect(walls('380×220')).toEqual([6, 6.5, 7, 7.5, 8])
    expect(walls('400×200')).toEqual([10, 10.5, 11, 11.5, 12])
    expect(walls('400×200')).not.toContain(8)
    expect(construction.flatMap((table) => table.columns).some((column) => /Масса/.test(column))).toBe(false)
  })

  it('renders the construction handbook with the two exact GOST tables and no other pipe assortment', () => {
    const standard = findStandard('ГОСТ 30245-2003')!
    const tables = productSizeSeries.filter((table) => table.standard === standard.code)
    const tree = new DOMParser().parseFromString(renderToStaticMarkup(createElement(StandardAssortment, { standard })), 'text/html')
    expect(tree.querySelectorAll('#sizes table')).toHaveLength(2)
    expect([...tree.querySelectorAll('caption')].every((caption) => caption.textContent?.includes(standard.code))).toBe(true)
    expect(tree.querySelectorAll('tbody tr')).toHaveLength(tables.reduce((count, table) => count + table.rows.length, 0))
    expect(tree.querySelectorAll('#sizes a[href^="https:"]')).toHaveLength(0)
    expect(tree.querySelectorAll('script')).toHaveLength(0)
  })

  it('preserves the complete cold-deformed matrix without filling gaps or mixing special sizes', () => {
    const tables = getProductSizeSeries('truby-besshovnye', 'holodnodeformirovannye')
    const main = tables[0]
    expect(main.title).toContain('Основной размерный ряд')
    expect(main.standard).toBe('ГОСТ 8734-75')
    expect(main.rows).toHaveLength(71)
    const walls = (diameter: number) => main.rows.find((row) => Number(row[0]) === diameter)?.[1]
      .split(';').map((value) => Number(value.trim().replace(',', '.'))) || []
    expect(main.rows.reduce((count, row) => count + row[1].split(';').length, 0)).toBe(1733)
    expect(walls(5)).toContain(1.5)
    expect(walls(5)).not.toContain(1.6)
    expect(walls(6)).toContain(2)
    expect(walls(6)).not.toContain(2.2)
    for (const diameter of [17, 18, 19, 28]) expect(walls(diameter)).not.toContain(7.5)
    expect(walls(32)).toContain(8)
    expect(walls(32)).not.toContain(8.5)
    expect(walls(160)).toContain(22)
    expect(walls(160)).not.toContain(24)
    expect(walls(170)).toContain(24)
    expect(walls(250)).toContain(4.5)
    expect(walls(250)).toContain(24)
    expect(walls(250)).not.toContain(4)
    expect(walls(125)).toEqual([])
    expect(walls(133)).toEqual([])
    expect(main.notes.join(' ')).toContain('D/s > 50')
    expect(main.notes.join(' ')).toContain('D/s < 4')
  })

  it('keeps cold-deformed special sizes separate from the full nominal series', () => {
    const table = getProductSizeSeries('truby-besshovnye', 'holodnodeformirovannye').find((table) => table.title.includes('Дополнительные размеры'))!
    expect(table.title).toContain('Дополнительные размеры')
    expect(table.scope).toContain('Основной размерный ряд таблицы 1 в этот список не включён')
    expect(table.rows).toContainEqual(['32', '8,5'])
    expect(table.rows).toContainEqual(['4', '0,2–1,2 (диапазон)'])
    expect(table.rows.filter((row) => row[0] === '46').map((row) => row[1])).toEqual(['3,0', '6,0'])
  })

  it('uses the current round bar nominal series without inventing agreement-only diameters', () => {
    const table = getProductSizeSeries('sortovoy-i-fasonny-prokat', 'krug-goryachekatanyj')[0]
    expect(table.standard).toBe('ГОСТ 2590-2006')
    expect(table.rows).toHaveLength(101)
    const diameters = table.rows.map((row) => Number(row[0].replace(',', '.')))
    expect(diameters[0]).toBe(5)
    expect(diameters.at(-1)).toBe(270)
    expect(diameters.slice(diameters.indexOf(72), diameters.indexOf(75) + 1)).toEqual([72, 73, 75])
    expect(diameters).toContain(6.3)
    expect(diameters).toContain(6.5)
    expect(diameters).not.toContain(49)
    expect(diameters).not.toContain(300)
    expect(diameters).not.toContain(330)
    expect(table.notes[0]).toContain('свыше 270 до 330')
    expect(table.notes[1]).toContain('ближайшему меньшему диаметру')
    expect(table.notes[1]).not.toContain('свыше 100')
    const item = productDetailCatalog.find((item) => item.slug === 'krug-goryachekatanyj')!
    expect(item.standards).toContain(table.standard)
    expect(item.title).toContain('5–270')
    expect(item.range[0].value).toContain('по согласованной спецификации')
  })

  it('keeps the hot-rolled square nominal series distinct from intermediate order sizes', () => {
    const table = getProductSizeSeries('sortovoy-i-fasonny-prokat', 'kvadrat').find((table) => table.standard === 'ГОСТ 2591-2006')!
    expect(table.rows).toHaveLength(65)
    const sides = table.rows.map((row) => Number(row[0].replace(',', '.')))
    expect(sides[0]).toBe(6)
    expect(sides.at(-1)).toBe(200)
    expect(sides).toContain(32)
    expect(sides).not.toContain(31)
  })

  it('keeps calibrated square sizes and tolerances separate from hot-rolled square', () => {
    const tables = getProductSizeSeries('sortovoy-i-fasonny-prokat', 'kvadrat')
    expect(tables[0].standard).toBe('ГОСТ 2591-2006')
    const table = tables.find((table) => table.standard === 'ГОСТ 8559-75')!
    expect(table.rows).toHaveLength(55)
    const sides = table.rows.map((row) => Number(row[0].replace(',', '.')))
    expect(sides[0]).toBe(3)
    expect(sides.at(-1)).toBe(100)
    expect(sides).toContain(6.3)
    expect(sides).not.toContain(6.5)
    expect(sides).not.toContain(99)
    expect(table.rows.find((row) => row[0] === '3,2')).toEqual(['3,2', '−0,048', '−0,075'])
    expect(table.rows.find((row) => row[0] === '65')).toEqual(['65', '−0,120', '−0,190'])
    expect(table.rows.find((row) => row[0] === '70')).toEqual(['70', '—', '−0,190'])
    expect(table.rows.find((row) => row[0] === '100')).toEqual(['100', '—', '−0,220'])
    expect(table.columns.join(' ')).not.toMatch(/h9|h12|Масса/)
    const item = productDetailCatalog.find((item) => item.categorySlug === 'sortovoy-i-fasonny-prokat' && item.slug === 'kvadrat')!
    expect(item.range[0].value).toContain('3–100')
  })

  it('uses the current hot-deformed pipe standard and preserves agreement-only dimensions', () => {
    const tables = getProductSizeSeries('truby-besshovnye', 'goryachedeformirovannye')
    expect(tables.length).toBeGreaterThan(0)
    expect(tables.every((table) => table.standard === 'ГОСТ 8732-2025')).toBe(true)
    const numbers = (value: string) => [...value.matchAll(/\d+(?:[.,]\d+)?/g)].map((match) => Number(match[0].replace(',', '.')))
    const smallest = tables.flatMap((table) => table.rows).find((row) => numbers(row[0])[0] === 20)!
    expect(numbers(smallest[1])).toEqual([2.5, 2.6, 2.8, 3, 3.2, 3.5, 4])
    expect(tables.flatMap((table) => table.notes).join(' ')).toMatch(/согласованию/)
  })

  it('distinguishes the original hot precision pipe contour from agreement sizes and parentheses', () => {
    const [table] = getProductSizeSeries('truby-besshovnye', 'precizionnye')
    const values = (cell: string) => cell === '—' ? [] : cell.split('; ')
    const plain = (cell: string) => cell.replace(/[()]/g, '')
    expect(table.rows).toHaveLength(37)
    expect(table.rows.reduce((n, row) => n + values(row[1]).length, 0)).toBe(405)
    expect(table.rows.reduce((n, row) => n + values(row[2]).length, 0)).toBe(452)
    expect(table.rows.flatMap(row => [...values(row[1]), ...values(row[2])]).filter(value => value.startsWith('('))).toHaveLength(222)
    for (const row of table.rows) {
      const inside = values(row[1]).map(plain)
      const agreement = values(row[2]).map(plain)
      expect(inside.filter(value => agreement.includes(value))).toEqual([])
    }
    for (const [diameter, wall] of [['89', '20'], ['194', '45'], ['127', '13'], ['146', '15']]) {
      expect(values(table.rows.find(row => row[0] === diameter)![1]).map(plain)).toContain(wall)
    }
    for (const [diameter, wall] of [['127', '12'], ['146', '14'], ['203', '45']]) {
      expect(values(table.rows.find(row => row[0] === diameter)![2]).map(plain)).toContain(wall)
    }
    expect(table.rows.find(row => row[0] === '25')![2]).toContain('(7,5)')
    expect(table.scope).toContain('Холоднодеформированный сортамент в эту таблицу не входит')
    expect(getDimensionGuide('truby-besshovnye', 'precizionnye')!.note).toContain('отдельных таблицах')
  })

  it('restores the complete nominal cold precision series including columns missing from HTML', () => {
    const tables = getProductSizeSeries('truby-besshovnye', 'precizionnye')
    expect(tables).toHaveLength(2)
    const cold = tables[1]
    const walls = (diameter: string) => cold.rows.find(row => row[0] === diameter)![1].split('; ').map(value => Number(value.replace(',', '.')))
    expect(cold.rows).toHaveLength(85)
    expect(cold.rows.reduce((n, row) => n + row[1].split('; ').length, 0)).toBe(2016)
    expect(walls('12')).not.toContain(4)
    expect(walls('13')).toContain(4)
    expect(walls('14')).not.toContain(4.5)
    expect(walls('15')).toContain(4.5)
    expect(walls('38')).toContain(3)
    expect(walls('710')).toEqual([2.8, 3, 3.2, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 28, 30, 32])
    expect(cold.columns).toEqual(['Наружный диаметр D, мм', 'Номинальные стенки, мм'])
    expect(cold.notes.join(' ')).toContain('100–250 мм включительно при D/s > 50')
    expect(cold.notes.join(' ')).toContain('D/s < 4')
    expect(cold.notes.join(' ')).toContain('D/s ≥ 50')
    for (const row of cold.rows) {
      const values = walls(row[0])
      expect(new Set(values).size).toBe(values.length)
      expect(values.every((wall, index) => wall > 0 && wall < Number(row[0]) / 2 && (index === 0 || wall > values[index - 1]))).toBe(true)
    }
  })

  it('separates boiler TU dimensions by process and grade and preserves source gaps', () => {
    const tables = getProductSizeSeries('truby-besshovnye', 'kotelnye')
    expect(tables).toHaveLength(5)
    expect(tables.map(table => table.rows.reduce((n, row) => n + row[1].split('; ').length, 0))).toEqual([965, 589, 374, 291, 171])
    const walls = (index: number, diameter: string) => tables[index].rows.find(row => row[0] === diameter)![1].split('; ').map(value => Number(value.replace(',', '.')))
    expect(walls(0, '159')).toContain(5.5)
    expect(walls(2, '54')).toContain(11)
    expect(walls(0, '465')).toEqual([16, 17, 18, 19, 20, 22, 24, 25, 26, 27, 28, 30, 32, 34, 36, 38, 40, 56, 65, 75])
    expect(walls(0, '530')).toEqual([25, 26, 28, 30, 32, 40, 65])
    expect(walls(2, '25')).not.toContain(6.5)
    expect(walls(2, '22')).toContain(2)
    expect(walls(4, '22')).not.toContain(2)
    expect(tables[0].scope).toContain('15Х1М1Ф')
    expect(tables[2].scope).not.toContain('15Х1М1Ф')
    expect(tables[2].scope).not.toContain('12Х1МФ')
    expect(tables[3].scope).toContain('12Х1МФ-ПВ')
    expect(tables[3].rows.at(-1)![0]).toBe('70')
    expect(tables[3].rows.some(row => row[0] === '73')).toBe(false)
    expect(tables[0].notes[0]).toContain('менее 57 мм')
    expect(tables[0].notes[0]).toContain('аттестационных испытаний')
    const tree = document.createElement('div')
    tree.innerHTML = renderToStaticMarkup(createElement(ProductSizeSeries, { series: tables, requestHref: '/#request' }))
    expect(tree.querySelector('h2')?.textContent).toBe('Размерный ряд по ТУ')
    expect(tree.querySelectorAll('.size-series-nav a')).toHaveLength(5)
    expect(tree.querySelector('a[href^="https:"]')).toBeNull()
    expect(pipeCatalog.find(item => item.slug === 'kotelnye')!.standards.join(' ')).not.toContain('5520')
  })

  it('keeps table dimensions complete, traceable and attached to existing products', () => {
    const routes = new Set([
      ...productDetailCatalog.map((item) => `${item.categorySlug}/${item.slug}`),
      ...pipeCatalog.map((item) => `${item.categorySlug}/${item.slug}`),
      ...sdtCatalog.map((item) => `sdt/${item.slug}`),
    ])
    expect(productSizeSeries.length).toBeGreaterThan(0)
    for (const table of productSizeSeries) {
      expect(routes.has(`${table.categorySlug}/${table.productSlug}`)).toBe(true)
      expect(table.standard).toMatch(/^(ГОСТ|ТУ)/)
      expect(table.scope.length).toBeGreaterThan(20)
      expect(table.source.url).toMatch(/^https:\/\//)
      expect(table.source.url).not.toContain('23met.ru')
      expect(table.rows.length).toBeGreaterThan(0)
      expect(new Set(table.rows.map((row) => row.join('|'))).size).toBe(table.rows.length)
      expect(table.rows.every((row) => row.length === table.columns.length && row.every((cell) => cell.trim().length > 0))).toBe(true)
    }
  })

  it('shows the verified inclined-flange beam dimensions with units and a direct request', () => {
    const beam = getProductSizeSeries('sortovoy-i-fasonny-prokat', 'balka-dvutavrovaya').find((table) => table.standard === 'ГОСТ 8239-89')!
    expect(beam.rows).toHaveLength(17)
    expect(beam.rows.find((row) => row[0] === '30')).toEqual(['30', '300', '135', '6,5', '10,2', '36,50'])
    const markup = renderToStaticMarkup(createElement(ProductSizeSeries, { series: [beam], requestHref: '/?product=beam#request' }))
    const tree = new DOMParser().parseFromString(markup, 'text/html')
    expect(tree.querySelector('#sizes table tbody')?.children).toHaveLength(17)
    expect(tree.querySelectorAll('th[scope="col"]')).toHaveLength(6)
    expect(tree.querySelectorAll('thead .size-series-number')).toHaveLength(5)
    expect(tree.querySelectorAll('tbody tr:first-child td.size-series-number')).toHaveLength(5)
    expect(tree.querySelector('.size-series-request')?.getAttribute('href')).toBe('/?product=beam#request')
    expect(markup).not.toContain('<script')
    expect(markup).not.toContain(beam.source.url)
  })

  it('keeps dimension lists left-aligned while preserving native table semantics', () => {
    const coil = getProductSizeSeries('listovoy-prokat', 'holodnokatanyj').find((table) => table.title.includes('рулона'))!
    const markup = renderToStaticMarkup(createElement(ProductSizeSeries, { series: [coil], requestHref: '/?product=coil#request' }))
    const tree = new DOMParser().parseFromString(markup, 'text/html')
    expect(tree.querySelectorAll('.size-series-number')).toHaveLength(0)
    expect(tree.querySelectorAll('tbody th[scope="row"]')).toHaveLength(25)
    expect(tree.querySelector('.size-series-scroll')?.getAttribute('tabindex')).toBe('0')
    expect(tree.querySelector('.size-series-mobile-help')?.textContent).toContain('прокручивать вбок')
    expect(markup).not.toContain('<script')
  })
})

describe('public and SaaS supplier data separation', () => {
  it('does not expose supplier identity in the public practical-size snapshot', () => {
    const snapshot = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/practical-size-snapshot.json'), 'utf8')) as Record<string, unknown>
    const serialized = JSON.stringify(snapshot)
    expect(snapshot.sizeCount).toBe(9989)
    expect(serialized).not.toContain('23met.ru')
    expect(serialized).not.toContain('sourceUrl')
    expect(serialized).not.toContain('sourcePages')
  })

  it.skipIf(!fs.existsSync(privateSupplierSnapshotPath))('keeps source attribution in the private SaaS snapshot', () => {
    const snapshot = JSON.parse(fs.readFileSync(privateSupplierSnapshotPath, 'utf8')) as { source: string; sourceUrl: string; sizeCount: number }
    expect(snapshot.source).toContain('23met.ru')
    expect(snapshot.sourceUrl).toBe('https://23met.ru/sitemap.xml')
    expect(snapshot.sizeCount).toBe(9989)
  })
})


describe('exact standard reference navigation', () => {
  it('links every table to its exact document edition and keeps both directions', () => {
    for (const table of productSizeSeries) {
      const links = getCatalogStandardLinks(table.standard)
      expect(links.map(link => link.code)).toEqual(getStandardReferences(table.standard))
      for (const link of links) {
        const record = getCatalogStandard(link.href.split('/').pop()!)!
        expect(record.code).toBe(link.code)
        expect(getSeriesForStandard(record.code)).toContain(table)
      }
    }
    expect(getCatalogStandardLinks('ГОСТ 8732-78')).toEqual([])
    expect(findCatalogStandard('ГОСТ 8732-78')).toBeUndefined()
    expect(findCatalogStandard('ГОСТ 8732-2025 — сортамент')?.code).toBe('ГОСТ 8732-2025')
    expect(findCatalogStandard('ГОСТ 8732-20250')).toBeUndefined()
    expect(getCatalogStandardLinks('ГОСТ 9567-75, таблица 1')[0]?.code).toBe('ГОСТ 9567-75')
    expect(getSeriesForStandard('ГОСТ 9567-75').length).toBeGreaterThan(1)
  })
})
