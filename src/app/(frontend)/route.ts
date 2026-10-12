import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const dynamic = 'force-static'

const staticHome = readFile(path.join(process.cwd(), 'public', 'home-static.html'), 'utf8')

export async function GET() {
  return new Response(await staticHome, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  })
}
