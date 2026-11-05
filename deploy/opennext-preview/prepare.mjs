#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const kit = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(kit, '../..')
const versions = JSON.parse(readFileSync(path.join(kit, 'versions.json'), 'utf8'))
const options = process.argv.slice(2)
if (options.some(value => value !== '--no-install' && !value.startsWith('--name='))) throw new Error('Supported options: --no-install and --name=<new-folder>')
const name = options.find(value => value.startsWith('--name='))?.slice(7) || `opennext-preview-${versions.sourceSha.slice(0, 12)}`
if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name)) throw new Error('Use a simple new folder name inside .plan-b')
const base = path.join(root, '.plan-b')
if (existsSync(base) && lstatSync(base).isSymbolicLink()) throw new Error('Refusing a symlinked .plan-b directory')
mkdirSync(base, { recursive: true })
const target = path.join(base, name)
if (existsSync(target)) throw new Error('Refusing to overwrite an existing preview directory')
execFileSync('git', ['cat-file', '-e', `${versions.sourceSha}^{commit}`], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] })
const archive = spawnSync('git', ['archive', '--format=tar', versions.sourceSha], { cwd: root, maxBuffer: 256 * 1024 * 1024 })
if (archive.error || archive.status !== 0) throw archive.error || new Error('git archive failed')
mkdirSync(target)
execFileSync('tar', ['-xf', '-', '-C', target], { input: archive.stdout })
function sanitize(directory) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name)
    if (/^\.env(?:\.|$)/.test(item.name) || /\.env$/.test(item.name)
      || ['private', '.npmrc', '.aws', '.codex', '.cloud', '.vercel', '.git', '.next', 'node_modules'].includes(item.name)) {
      rmSync(file, { recursive: true, force: true })
    } else if (item.isSymbolicLink()) throw new Error('Unexpected symlink in archived preview source')
    else if (item.isDirectory()) sanitize(file)
  }
}
sanitize(target)
const sha256 = value => createHash('sha256').update(value).digest('hex')
const home = readFileSync(path.join(target, 'public/home-static.html'), 'utf8')
if (sha256(home) !== versions.approvedHomeSha256) throw new Error('Approved homepage bytes differ from pinned source')
const route = path.join(target, versions.routePath)
let routeSource = readFileSync(route, 'utf8')
if (sha256(routeSource) !== versions.routeSha256Before) throw new Error('Pinned homepage route changed; review instead of patching blindly')
function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw new Error('Preview transformation no longer matches exactly once')
  return source.replace(before, after)
}
routeSource = replaceOnce(routeSource, "import { readFile } from 'node:fs/promises'\nimport path from 'node:path'", "import approvedHome from './approved-home.generated.json'")
routeSource = replaceOnce(routeSource, "const staticHome = readFile(path.join(process.cwd(), 'public', 'home-static.html'), 'utf8')", 'const staticHome = approvedHome')
writeFileSync(path.join(path.dirname(route), 'approved-home.generated.json'), JSON.stringify(home) + '\n')
writeFileSync(route, routeSource)
for (const directory of versions.excludedRoutes) rmSync(path.join(target, directory), { recursive: true, force: true })
writeFileSync(path.join(target, 'src/app/(frontend)/api/request/route.ts'), `export async function POST() {
  return Response.json({ error: 'Тестовая версия: заявки здесь не отправляются' }, {
    status: 503, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  })
}
`)
const nextConfigPath = path.join(target, 'next.config.ts')
let nextConfig = readFileSync(nextConfigPath, 'utf8')
nextConfig = replaceOnce(nextConfig, "import { withPayload } from '@payloadcms/next/withPayload'\n", '')
nextConfig = replaceOnce(nextConfig, 'export default withPayload(nextConfig, { devBundleServerPackages: false })', 'export default nextConfig')
nextConfig = replaceOnce(nextConfig, 'const nextConfig: NextConfig = {', "const nextConfig: NextConfig = {\n  output: 'standalone',\n  outputFileTracingRoot: dirname,")
nextConfig = replaceOnce(nextConfig, '  images: {', '  images: {\n    unoptimized: true,')
writeFileSync(nextConfigPath, nextConfig)
for (const [from, to] of [
  ['open-next.config.ts.template', 'open-next.config.ts'],
  ['wrangler.jsonc.template', 'wrangler.jsonc'],
  ['package.preview.json', 'package.json'],
  ['package-lock.preview.json', 'package-lock.json'],
]) copyFileSync(path.join(kit, from), path.join(target, to))
const manifest = JSON.parse(readFileSync(path.join(target, 'package.json'), 'utf8'))
for (const [dependency, version] of Object.entries(versions.packages)) {
  if ((manifest.dependencies?.[dependency] || manifest.devDependencies?.[dependency]) !== version) throw new Error('Preview dependency pins differ')
}
writeFileSync(path.join(target, '.opennext-preview-source.json'), JSON.stringify({ ...versions, transformedRouteSha256: sha256(routeSource) }, null, 2) + '\n')
if (!options.includes('--no-install')) {
  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--legacy-peer-deps', '--strict-ssl=true', '--no-audit', '--no-fund'], { cwd: target, stdio: 'inherit' })
}
console.log(`Prepared isolated stable preview: ${target}`)
console.log('CMS/cron excluded, mail disabled, approved homepage preserved. No build, login or deployment performed.')
