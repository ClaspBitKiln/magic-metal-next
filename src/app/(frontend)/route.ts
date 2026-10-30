import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getMetrikaCounterId } from '@/lib/analyticsConfig'
import { productDetailCatalog } from '@/data/productDetailCatalog'

export const dynamic = 'force-static'

const staticHome = readFile(path.join(process.cwd(), 'public', 'home-static.html'), 'utf8')

/**
 * Keep the existing landing page design, but always inject product grades
 * from the same canonical catalog used by detailed product pages.
 * This eliminates manually maintained, stale grade lists in static HTML.
 */
function renderApprovedCatalogGrades(html: string): string {
  for (const item of productDetailCatalog.filter((entry) => entry.categorySlug === 'cvetnye-metally')) {
    const href = '/produkciya/cvetnye-metally/' + item.slug
    const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp('(<details class="catalog-item"><summary class="catalog-row">(?:(?!</details>).)*?<span>)([^<]*)(</span></summary><div class="home-size-series"><a href="' + escapedHref + '(?:#sizes)?")', 's')
    const grades = item.grades.join(' · ').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    html = html.replace(pattern, (_match, before: string, _old: string, after: string) => before + grades + after)
  }
  return html
}

export async function GET() {
  const id = getMetrikaCounterId()
  const base = renderApprovedCatalogGrades(await staticHome)
  const html = id ? base.replace('</head>', `<script id="magicmet-analytics" src="/analytics.js?v=20261021-1&id=${id}" defer></script></head>`) : base
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  })
}
