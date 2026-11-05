#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, copyFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const kit = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(kit, '../..')
const versions = JSON.parse(readFileSync(path.join(kit, 'versions.json'), 'utf8'))
const options = process.argv.slice(2)
const name = options.find(value => value.startsWith('--name='))?.slice('--name='.length)
  || `cloudflare-preview-${versions.sourceSha.slice(0, 12)}`
if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name)) throw new Error('Use a simple --name=<folder-name> inside .plan-b')
if (options.some(value => value !== '--no-install' && !value.startsWith('--name='))) throw new Error('Supported options: --no-install and --name=<folder-name>')
const base = path.join(root, '.plan-b')
if (existsSync(base) && lstatSync(base).isSymbolicLink()) throw new Error('Refusing a symlinked .plan-b directory')
mkdirSync(base, { recursive: true })
const target = path.join(base, name)
if (existsSync(target)) throw new Error(`Refusing to overwrite existing probe: ${target}`)
execFileSync('git', ['cat-file', '-e', `${versions.sourceSha}^{commit}`], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] })
mkdirSync(target)
const archive = spawnSync('git', ['archive', '--format=tar', versions.sourceSha], { cwd: root, maxBuffer: 256 * 1024 * 1024 })
if (archive.error || archive.status !== 0) throw archive.error || new Error('git archive failed')
execFileSync('tar', ['-xf', '-', '-C', target], { input: archive.stdout })
function sanitize(directory) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name)
    if (/^\.env(?:\.|$)/.test(item.name) || /\.env$/.test(item.name)
      || ['private', '.npmrc', '.git', '.next', 'node_modules'].includes(item.name)) {
      rmSync(file, { recursive: true, force: true })
    } else if (item.isSymbolicLink()) {
      throw new Error(`Unexpected symlink in archived source: ${path.relative(target, file)}`)
    } else if (item.isDirectory()) sanitize(file)
  }
}
sanitize(target)
const digest = file => createHash('sha256').update(readFileSync(file)).digest('hex')
const route = path.join(target, versions.routePath)
if (digest(route) !== versions.routeSha256Before) throw new Error('Verified homepage route hash differs; do not apply patch blindly')
execFileSync('patch', ['--strip=1', '--batch', '--forward', '--input', path.join(kit, 'route.patch')], { cwd: target, stdio: 'inherit' })
if (digest(route) !== versions.routeSha256After) throw new Error('Patched route hash differs from tested prototype')
if (digest(path.join(target, 'public/home-static.html')) !== versions.approvedHomeSha256) throw new Error('Approved homepage bytes changed')
for (const file of ['vite.config.ts', 'cloudflare.config.ts', 'worker-preview.ts', 'preview-policy.test.ts', 'vitest.preview.config.ts']) {
  copyFileSync(path.join(kit, `${file}.template`), path.join(target, file))
}
if (!options.includes('--no-install')) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const packages = Object.entries(versions.probePackages).map(([dependency, version]) => `${dependency}@${version}`)
  execFileSync(npm, ['install', '--save-exact', '--legacy-peer-deps', '--strict-ssl=true', '--no-audit', '--no-fund', ...packages], { cwd: target, stdio: 'inherit' })
}
console.log(`Prepared reserve-only local preview: ${target}`)
console.log('Default policy: analytics off, LOCAL_SMTP_TEST=0, no SMTP bindings, no login or deployment executed.')
