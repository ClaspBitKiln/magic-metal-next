import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getMetrikaCounterId } from '@/lib/analyticsConfig'

export const dynamic = 'force-static'

const staticHome = readFile(path.join(process.cwd(), 'public', 'home-static.html'), 'utf8')

export async function GET() {
  const id = getMetrikaCounterId()
  const html = id ? (await staticHome).replace('</head>', `<script id="magicmet-analytics" src="/analytics.js?v=20261021-1&id=${id}" defer></script></head>`) : await staticHome
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  })
}
