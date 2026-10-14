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
import ProductSizeSeries from '@/components/ProductSizeSeries'

const privateSupplierSnapshotPath = path.join(process.cwd(), 'private/data/23met-practical-snapshot.json')

describe('unified homepage catalog', () => {
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

describe('normative product size tables', () => {
  it('keeps the hot-rolled square nominal series distinct from intermediate order sizes', () => {
    const table = getProductSizeSeries('sortovoy-i-fasonny-prokat', 'kvadrat').find((table) => table.standard === 'ГОСТ 2591-2006')!
    expect(table.rows).toHaveLength(65)
    const sides = table.rows.map((row) => Number(row[0].replace(',', '.')))
    expect(sides[0]).toBe(6)
    expect(sides.at(-1)).toBe(200)
    expect(sides).toContain(32)
    expect(sides).not.toContain(31)
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

  it('keeps table dimensions complete, traceable and attached to existing products', () => {
    const routes = new Set([
      ...productDetailCatalog.map((item) => `${item.categorySlug}/${item.slug}`),
      ...pipeCatalog.map((item) => `${item.categorySlug}/${item.slug}`),
      ...sdtCatalog.map((item) => `sdt/${item.slug}`),
    ])
    expect(productSizeSeries.length).toBeGreaterThan(0)
    for (const table of productSizeSeries) {
      expect(routes.has(`${table.categorySlug}/${table.productSlug}`)).toBe(true)
      expect(table.standard).toMatch(/ГОСТ/)
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
    expect(tree.querySelector('.size-series-request')?.getAttribute('href')).toBe('/?product=beam#request')
    expect(markup).not.toContain('<script')
    expect(markup).not.toContain(beam.source.url)
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
