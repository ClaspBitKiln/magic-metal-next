import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { homeCatalogGroups } from '../src/data/homeCatalog'
import { productDetailCatalog } from '../src/data/productDetailCatalog'
import { pipeCatalog } from '../src/data/pipeCatalog'
import { sdtCatalog } from '../src/data/sdtCatalog'
import { seoCatalog } from '../src/data/seoCatalog'
import { getProductSizeSeries } from '../src/data/productSizeSeries'
import { getDimensionGuide } from '../src/data/dimensionGuides'

// This is a reproducible inventory of claims and provenance, not a technical approval.
// The owner's paused product is excluded from output and from review counts.
const excludedPath = '/produkciya/metizy-i-svarochnye-materialy/kanaty'
const sourceCommit = process.env.CATALOG_SOURCE_SHA
if (!sourceCommit || !/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error('Set CATALOG_SOURCE_SHA to the clean catalog source commit')
const output = path.resolve(process.argv[2] || 'docs/catalog/coverage-2026-11-01')
const pathname = (href: string) => new URL(href, 'https://magicmet.ru').pathname.replace(/\/$/, '') || '/'
const status = () => ({ normative: 'not_assessed', independentReview: 'not_performed', live: 'not_checked_in_this_review' })
const source = (value: { label: string; url: string }) => ({
  ...value,
  kind: value.url.startsWith('internal:') ? 'internal_procurement_reference' : 'external_source_candidate',
  currentVerification: 'not_performed',
})
const catalogs = [
  ...productDetailCatalog.map(item => ({ ...item, catalog: 'productDetailCatalog', materials: item.grades })),
  ...pipeCatalog.map(item => ({ ...item, catalog: 'pipeCatalog', materials: item.grades })),
  ...sdtCatalog.map(item => ({ ...item, categorySlug: 'sdt', catalog: 'sdtCatalog' })),
]
const details = catalogs.filter(item => `/produkciya/${item.categorySlug}/${item.slug}` !== excludedPath).map(item => {
  const series = getProductSizeSeries(item.categorySlug, item.slug)
  const guide = getDimensionGuide(item.categorySlug, item.slug)
  return {
    url: `/produkciya/${item.categorySlug}/${item.slug}`, title: item.title, catalog: item.catalog,
    categorySlug: item.categorySlug,
    codeClaims: { standards: item.standards, materials: item.materials, range: item.range },
    series: series.map(table => ({
      title: table.title, kind: table.kind || 'dimensions', standard: table.standard,
      scope: table.scope, rowCount: table.rows.length, notes: table.notes, source: source(table.source),
    })),
    guide: guide ? { title: guide.title, standard: guide.standard, parameters: guide.parameters, note: guide.note, source: source(guide.source) } : null,
    coverageKind: series.some(table => table.kind !== 'requirements') ? 'size_series' : guide ? 'procurement_guide' : series.length ? 'requirements_table' : 'product_description',
    review: status(),
  }
})
if (new Set(details.map(item => item.url)).size !== details.length) throw new Error('Duplicate detail URLs')
const homeRows = homeCatalogGroups.flatMap((group, groupIndex) => group.items.flatMap((item, itemIndex) => {
  const route = pathname(item.href)
  if (route === excludedPath) return []
  const direct = details.filter(detail => detail.url === route).map(detail => detail.url)
  const category = seoCatalog.find(category => `/produkciya/${category.slug}` === route)
  const children = category ? details.filter(detail => detail.categorySlug === category.slug).map(detail => detail.url) : []
  const request = route === '/' && new URL(item.href, 'https://magicmet.ru').searchParams.has('product')
  return [{
    id: `home-${groupIndex + 1}-${itemIndex + 1}`, group: group.title, title: item.title, href: item.href,
    pathname: route, mapping: direct.length ? 'detail' : category ? 'category' : request ? 'request' : 'unresolved',
    detailUrls: [...direct, ...children],
    codeClaims: { dimensions: item.size, standards: item.standards, materials: item.grades },
    review: status(),
  }]
}))
const counts = {
  groups: homeCatalogGroups.length, homeRows: homeRows.length, details: details.length,
  productDetailCatalog: details.filter(item => item.catalog === 'productDetailCatalog').length,
  pipeCatalog: details.filter(item => item.catalog === 'pipeCatalog').length,
  sdtCatalog: details.filter(item => item.catalog === 'sdtCatalog').length,
  unmappedHomeRows: homeRows.filter(item => item.mapping === 'unresolved').length,
  withSizeSeries: details.filter(item => item.coverageKind === 'size_series').length,
  procurementGuides: details.filter(item => item.coverageKind === 'procurement_guide').length,
  externalSourceCandidates: new Set(details.flatMap(item => [...item.series.map(table => table.source), ...(item.guide ? [item.guide.source] : [])]).filter(item => item.kind === 'external_source_candidate').map(item => item.url)).size,
}
if (counts.homeRows !== 58 || counts.details !== 65) throw new Error(`Catalog scope changed: ${JSON.stringify(counts)}; review counts before regenerating`)
const result = { schemaVersion: 1, sourceCommit, excludedPaths: [excludedPath], original25RowAudit: 'not_recovered', counts, homeRows, details }
const cell = (value: string) => value.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
const md = `# Матрица покрытия каталога — без отложенного раздела\n\nИсточник кода: \`${sourceCommit}\`. Канаты исключены по указанию владельца.\nЭто новый реестр, а не восстановленный аудит 25 строк. Указанные в коде ГОСТы,\nмарки и диапазоны — **заявления для проверки**, а не нормативное заключение.\nСсылка на внешний источник не подтверждает, что он актуален или применим.\n\n## Объём\n\n${Object.entries(counts).map(([key, value]) => `- ${key}: ${value}`).join('\n')}\n\n41 запись productDetailCatalog + 16 трубных + 8 СДТ = 65 подробных URL.\n58 строк главной могут вести на карточку, категорию либо сразу в заявку;\nэти количества не обязаны совпадать. Fragment/query удалены только для\nсопоставления маршрутов; исходные ссылки сохранены в JSON.\n\n## Строки главной\n\n| Группа | Позиция | Маршрут | Тип связи | Карточек в связи |\n|---|---|---|---|---:|\n${homeRows.map(item => `| ${cell(item.group)} | ${cell(item.title)} | ${cell(item.pathname)} | ${item.mapping} | ${item.detailUrls.length} |`).join('\n')}\n\n## Подробные страницы и доказательства\n\n| Страница | URL | Покрытие в коде | Таблиц | Источник подбора | Нормативный review |\n|---|---|---|---:|---|---|\n${details.map(item => `| ${cell(item.title)} | ${item.url} | ${item.coverageKind} | ${item.series.length} | ${item.guide ? cell(item.guide.source.kind) : '—'} | не выполнен |`).join('\n')}\n\n## Как продолжать проверку\n\nПолный состав заявлений, размерных источников, их названия/URL и ограничения\nсодержит [coverage.json](coverage.json). \`internal:\` — внутренняя памятка\nпараметров заказа, **не нормативный первоисточник**. Исторические provenance\nи исследования связываются в [рабочем отчёте](../../ai/CATALOG_NEXT_2026-11-01.md);\nих результаты не превращены автоматически в новое одобрение всех карточек.\n\nДля каждой проверяемой позиции нужны точный раздел/таблица первоисточника,\nприменимость стандарта к форме и состоянию изделия, проверенные размеры и\nмарки, независимый reviewer и отдельное доказательство публикации.\nТекущие \`not_assessed\`/\`not_performed\` нельзя менять по одному HTTP 200\nили успешному поисковому тесту.\n\nВоспроизведение из корня checkout (сначала убедиться, что src/data не изменён):\n\n\`\`\`bash\ngit diff --quiet HEAD -- src/data\nCATALOG_SOURCE_SHA="$(git rev-parse HEAD)" node --import tsx scripts/generate-catalog-coverage.ts\n\`\`\`\n`
mkdirSync(output, { recursive: true })
writeFileSync(path.join(output, 'coverage.json'), JSON.stringify(result, null, 2) + '\n')
writeFileSync(path.join(output, 'README.md'), md)
console.log(JSON.stringify({ sourceCommit, counts, output }))
