#!/usr/bin/env node
// Prepare an isolated source tree. This does not publish files or touch DNS.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, symlinkSync, realpathSync, copyFileSync } from 'node:fs'
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
const archivePath = path.join(target, '.source.tar')
const archive = spawnSync('git', ['archive', '--output', archivePath, source], { cwd: repo, stdio: 'inherit' })
if (archive.status !== 0) throw new Error('git archive failed')
const untar = spawnSync('tar', ['-xf', archivePath, '-C', target], { stdio: 'inherit' })
if (untar.status !== 0) throw new Error('tar extraction failed')
rmSync(archivePath)
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
change('public/home.js', "  if (data.getAll('files[]').reduce(", "  if (data.getAll('files[]').filter(file => file instanceof File && file.name).length > 99) {\n    track('request_validation_error')\n    status.textContent = 'Не более 99 файлов в одной заявке. Объедините файлы или отправьте их на m1@magicmet.ru.'\n    return\n  }\n  if (data.getAll('files[]').reduce(")
change('src/components/RequestForm.tsx', "    if (data.getAll('files[]').reduce(", "    if (data.getAll('files[]').filter(value => value instanceof File && value.name).length > 99) {\n      trackAnalyticsGoal('request_validation_error')\n      setStatus('error')\n      setFormError('Не более 99 файлов в одной заявке. Объедините файлы или отправьте их на m1@magicmet.ru.')\n      return\n    }\n    if (data.getAll('files[]').reduce(")
change('src/components/QuoteCart.tsx', "    setStatus('sending')", "    if (data.getAll('files[]').filter(value => value instanceof File && value.name).length > 99) {\n      setStatus('error'); setError('Не более 99 файлов в одной заявке. Объедините файлы или отправьте их на m1@magicmet.ru.'); return\n    }\n    setStatus('sending')")
change('public/analytics.js', "(() => {\n", "(() => {\n  // Technical-host staging must not inflate production analytics.\n  if (!['magicmet.ru', 'www.magicmet.ru'].includes(location.hostname)) return\n")
for (const relative of ['src/app/robots.ts', 'src/app/(frontend)/sitemap.ts']) {
  const file = path.join(target, relative)
  writeFileSync(file, readFileSync(file, 'utf8') + "\nexport const dynamic = 'force-static'\n")
  changes.push(relative)
}
copyFileSync(path.join(repo, 'scripts/hosting/spaceweb-static.htaccess'), path.join(target, 'public/.htaccess'))
const depsArg = option('--deps')
if (depsArg) {
  const deps = realpathSync(path.resolve(depsArg))
  if (!existsSync(path.join(deps, 'next/package.json'))) throw new Error('Dependencies must contain installed Next')
  symlinkSync(deps, path.join(target, 'node_modules'), 'dir')
}
const manifest = { source, preparedAt: new Date().toISOString(), changes, deploymentReady: false, blockers: ['SMTP form endpoint and attachment/security equivalence unimplemented', 'Production build and static hosting/browser acceptance required', 'No host upload, backup, DNS or Vercel changes performed'] }
writeFileSync(path.join(target, 'STATIC_PREPARATION.json'), JSON.stringify(manifest, null, 2) + '\n')
console.log(JSON.stringify({ target, source, changedPaths: changes.length, deploymentReady: false }))
