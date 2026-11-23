#!/usr/bin/env node
// Prepare an isolated source tree. This does not publish files or touch DNS.
import { spawn, spawnSync } from 'node:child_process'
import { pipeline } from 'node:stream/promises'
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const args = process.argv.slice(2)
function option(name, fallback) {
  const index = args.indexOf(name)
  return index < 0 ? fallback : args[index + 1]
}
const source = option('--source', '8deef5981e26e4d214deed857dcd71b92abe5205')
const targetArg = option('--target')
if (!targetArg || !/^[0-9a-f]{40}$/.test(source)) throw new Error('Use --target ABSOLUTE_NEW_DIRECTORY [--source FULL_COMMIT_SHA] [--deps NODE_MODULES]')
const target = path.resolve(targetArg)
if (!path.isAbsolute(targetArg) || target === repo || target.startsWith(repo + path.sep) || existsSync(target)) throw new Error('Target must be a NEW absolute directory outside the working repository')
const resolved = spawnSync('git', ['rev-parse', `${source}^{commit}`], { cwd: repo, encoding: 'utf8' })
if (resolved.status || resolved.stdout.trim() !== source) throw new Error('Source commit unavailable')
mkdirSync(target, { recursive: true })
const archive = spawn('git', ['archive', source], { cwd: repo, stdio: ['ignore', 'pipe', 'inherit'] })
const untar = spawn('tar', ['-x', '-C', target], { stdio: ['pipe', 'inherit', 'inherit'] })
const archiveExit = new Promise((resolve, reject) => archive.once('error', reject).once('exit', code => code ? reject(new Error(`git archive: ${code}`)) : resolve()))
const tarExit = new Promise((resolve, reject) => untar.once('error', reject).once('exit', code => code ? reject(new Error(`tar: ${code}`)) : resolve()))
await Promise.all([pipeline(archive.stdout, untar.stdin), archiveExit, tarExit])
const changes = []
function change(relative, before, after) {
  const file = path.join(target, relative)
  const original = readFileSync(file, 'utf8')
  if (!original.includes(before)) throw new Error(`Expected source fragment not found: ${relative}`)
  writeFileSync(file, original.replace(before, after))
  changes.push(relative)
}
for (const relative of ['src/app/(payload)', 'src/app/api', 'src/app/(frontend)/api', 'src/app/my-route', 'src/app/(frontend)/(catalog)/korzina', 'src/app/(frontend)/(catalog)/poziciya', 'src/app/(frontend)/(catalog)/spravochnik-nalichiya']) {
  rmSync(path.join(target, relative), { recursive: true, force: true })
  changes.push(`exclude:${relative}`)
}
writeFileSync(path.join(target, 'next.config.ts'), `import type { NextConfig } from 'next'\nconst config: NextConfig = {\n  output: 'export',\n  poweredByHeader: false,\n  images: { unoptimized: true },\n  experimental: { inlineCss: true },\n  // Keep the production public-build policy; internal CMS modules are not published.\n  typescript: { ignoreBuildErrors: process.env.SIMPLE_PUBLIC_SITE_BUILD === '1' },\n}\nexport default config\n`)
changes.push('next.config.ts')
change('src/app/(frontend)/(catalog)/poisk/page.tsx',
  "export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {\n  const { q } = await searchParams\n  const initialQuery = Array.isArray(q) ? q[0] || '' : q || ''",
  "export default function SearchPage() {\n  const initialQuery = ''")
change('src/components/CatalogSearch.tsx',
  "    window.addEventListener('popstate', restore)",
  "    restore()\n    window.addEventListener('popstate', restore)")
change('src/components/CatalogSearch.tsx',
  "        const response = await fetch(`/api/catalog-search?q=${encodeURIComponent(query)}`, { signal: controller.signal })\n        if (!response.ok) throw new Error('Поиск размеров временно недоступен. Откройте каталог или отправьте параметры в заявке.')\n        const data = await response.json() as { items: SearchItem[] }\n        setDimensionResponse({ query, items: data.items })",
  "        const { searchDimensionTables } = await import('@/lib/dimensionSearch')\n        if (!controller.signal.aborted) setDimensionResponse({ query, items: searchDimensionTables(query) })")
for (const relative of ['src/app/(frontend)/(catalog)/produkciya/[slug]/page.tsx', 'src/app/(frontend)/(catalog)/produkciya/[slug]/[detail]/page.tsx', 'src/app/(frontend)/(catalog)/produkciya/sdt/[detail]/page.tsx', 'src/app/(frontend)/(catalog)/spravochnik-materialov/[slug]/page.tsx', 'src/app/(frontend)/(catalog)/spravochnik-gost/[slug]/page.tsx']) {
  const file = path.join(target, relative)
  const original = readFileSync(file, 'utf8')
  if (!original.includes('export const dynamicParams = false')) {
    writeFileSync(file, `${original}\nexport const dynamicParams = false\n`)
    changes.push(relative)
  }
}
change('public/home-static.html', '/_next/image?url=%2Fimages%2Fclients%2Fuzbekneftegaz.png&amp;w=384&amp;q=75', '/images/clients/uzbekneftegaz.png')
// PHP preserves multiple upload parts only when their field has [] suffix.
for (const relative of ['public/home-static.html', 'public/home.js', 'src/components/RequestForm.tsx', 'src/components/QuoteCart.tsx']) {
  const file = path.join(target, relative)
  const original = readFileSync(file, 'utf8')
  const adapted = original.replaceAll('name="files"', 'name="files[]"').replaceAll("getAll('files')", "getAll('files[]')")
  if (adapted === original) throw new Error(`Upload field adaptation missing: ${relative}`)
  writeFileSync(file, adapted)
  changes.push(relative)
}
for (const relative of ['src/app/robots.ts', 'src/app/(frontend)/sitemap.ts']) {
  const file = path.join(target, relative)
  writeFileSync(file, readFileSync(file, 'utf8') + "\nexport const dynamic = 'force-static'\n")
  changes.push(relative)
}
writeFileSync(path.join(target, 'public/.htaccess'), `Options -Indexes -MultiViews\nDirectoryIndex index.html\nErrorDocument 404 /404.html\n<IfModule mod_headers.c>\nHeader always set X-Content-Type-Options nosniff\nHeader always set Referrer-Policy strict-origin-when-cross-origin\nHeader always set X-Frame-Options SAMEORIGIN\nHeader always set Permissions-Policy "camera=(), microphone=(), geolocation=()"\n</IfModule>\nRewriteEngine On\nRewriteRule ^(?:spravochnik-nalichiya|poziciya)/?$ /#products [R=301,L,NE]\nRewriteRule ^korzina/?$ /#request [R=301,L,NE]\n# Request handling is deliberately absent until a separately verified SMTP endpoint is installed.\n# Category paths may also be physical parent directories: serve their HTML first.\nRewriteCond %{REQUEST_FILENAME}.html -f\nRewriteRule ^(.+?)/?$ $1.html [L]\n`)
const depsArg = option('--deps')
if (depsArg) {
  const deps = realpathSync(path.resolve(depsArg))
  if (!existsSync(path.join(deps, 'next/package.json'))) throw new Error('Dependencies must contain installed Next')
  symlinkSync(deps, path.join(target, 'node_modules'), 'dir')
}
const manifest = { source, preparedAt: new Date().toISOString(), changes, deploymentReady: false, blockers: ['SMTP form endpoint and attachment/security equivalence unimplemented', 'Production build and static hosting/browser acceptance required', 'No host upload, backup, DNS or Vercel changes performed'] }
writeFileSync(path.join(target, 'STATIC_PREPARATION.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({ target, source, changedPaths: changes.length, deploymentReady: false }))
