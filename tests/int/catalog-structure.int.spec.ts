import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { homeCatalogGroups, homeCatalogItemCount } from '@/data/homeCatalog'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import CatalogTree from '@/components/CatalogTree'
import { gzipSync } from 'node:zlib'
import { sdtCatalog } from '@/data/sdtCatalog'

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
    expect(sdt.items.every((item) => sdtCatalog.some((detail) => item.href === `/produkciya/sdt/${detail.slug}`))).toBe(true)
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
    expect(tree.querySelectorAll('.catalog-group[open]')).toHaveLength(1)
    expect(tree.querySelectorAll('.catalog-item[open]')).toHaveLength(0)
    for (const item of tree.querySelectorAll('.catalog-item')) {
      expect(item.firstElementChild?.tagName).toBe('SUMMARY')
      expect(item.querySelectorAll('.home-size-series a')).toHaveLength(2)
    }
  })

  it('isolates the public launch from unfinished internal type errors', () => {
    const config = fs.readFileSync(path.join(process.cwd(), 'next.config.ts'), 'utf8')
    const build = fs.readFileSync(path.join(process.cwd(), 'scripts/build.mjs'), 'utf8')
    expect(config).toContain("ignoreBuildErrors: process.env.SIMPLE_PUBLIC_SITE_BUILD === '1'")
    expect(build).toContain("SIMPLE_PUBLIC_SITE_BUILD: process.env.SIMPLE_PUBLIC_SITE_BUILD || '1'")
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
