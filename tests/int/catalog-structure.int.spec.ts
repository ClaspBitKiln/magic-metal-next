import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { homeCatalogGroups, homeCatalogItemCount } from '@/data/homeCatalog'

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

  it('keeps SDT as a regular category, not a separate renderer', () => {
    const component = fs.readFileSync(path.join(process.cwd(), 'src/components/MagicMetalHome.tsx'), 'utf8')
    expect(component).toContain('homeCatalogGroups.map')
    expect(component).not.toContain('pipeCatalog.slice')
    expect(component).not.toContain('otherCatalogGroups.map')
    expect(component.match(/homeCatalogGroups\.map/g)).toHaveLength(1)
  })

  it('keeps every top-level category row aligned and highlighted through SDT and below', () => {
    const styles = fs.readFileSync(path.join(process.cwd(), 'src/app/(frontend)/styles.css'), 'utf8')
    const adjacentGroupRule = styles.match(/\.catalog-group \+ \.catalog-group\s*\{([^}]*)\}/)?.[1] ?? ''
    const groupSummaryRule = styles.match(/\.catalog-group > summary\s*\{([^}]*)\}/)?.[1] ?? ''

    expect(adjacentGroupRule).toMatch(/margin-top:\s*0/)
    expect(groupSummaryRule).toMatch(/grid-template-columns:\s*38px minmax\(0, 1fr\)/)
    expect(groupSummaryRule).toMatch(/min-height:\s*104px/)
    expect(styles).toContain('.catalog-group > summary:hover,')
    expect(styles).toContain('.catalog-group > summary:focus-visible')
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

  it('keeps source attribution in the private SaaS snapshot', () => {
    const snapshot = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'private/data/23met-practical-snapshot.json'), 'utf8')) as { source: string; sourceUrl: string; sizeCount: number }
    expect(snapshot.source).toContain('23met.ru')
    expect(snapshot.sourceUrl).toBe('https://23met.ru/sitemap.xml')
    expect(snapshot.sizeCount).toBe(9989)
  })
})
