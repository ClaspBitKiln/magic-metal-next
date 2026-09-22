import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { homeCatalogGroups, homeCatalogItemCount } from '@/data/homeCatalog'

const privateSupplierSnapshotPath = path.join(process.cwd(), 'private/data/23met-practical-snapshot.json')

describe('unified homepage catalog', () => {
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

  it('renders a simple public section list without detailed sizes or prices', () => {
    const component = fs.readFileSync(path.join(process.cwd(), 'src/components/MagicMetalHome.tsx'), 'utf8')
    expect(component).toContain('homeCatalogGroups.map')
    expect(component).toContain('catalog-section-list')
    expect(component).toContain('Что мы<br /><em>можем поставить</em>')
    expect(component).not.toContain('item.size')
    expect(component).not.toContain('item.standards')
    expect(component).not.toContain('item.grades')
    expect(component.match(/homeCatalogGroups\.map/g)).toHaveLength(1)
  })

  it('keeps the section list responsive and visually separated', () => {
    const styles = fs.readFileSync(path.join(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')
    expect(styles).toContain('.catalog-section-list')
    expect(styles).toContain('.catalog-section-card')
    expect(styles).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))')
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
