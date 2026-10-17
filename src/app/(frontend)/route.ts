import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const dynamic = 'force-static'

const staticHome = readFile(path.join(process.cwd(), 'public', 'home-static.html'), 'utf8')

export async function GET() {
  const id = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || ''
  const enabled = /^[1-9]\d{0,14}$/.test(id) && Number.isSafeInteger(Number(id))
  const html = enabled ? (await staticHome).replace('</head>', `<script id="magicmet-analytics" src="/analytics.js?v=20261017-1&id=${id}" defer></script></head>`) : await staticHome
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  })
}
