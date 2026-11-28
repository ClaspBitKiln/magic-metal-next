#!/usr/bin/env node
// Next exports a root HTML Route Handler as `index`, not `index.html`.
import { existsSync, readFileSync, writeFileSync, renameSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

const target = process.argv[2]
if (!target || !path.isAbsolute(target)) throw new Error('Pass the absolute isolated preparation directory')
const manifestPath = path.join(target, 'STATIC_PREPARATION.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
if (manifest.deploymentReady !== false || !/^[0-9a-f]{40}$/.test(manifest.source)) throw new Error('Unexpected preparation manifest')
const out = path.join(target, 'out')
const index = path.join(out, 'index')
if (existsSync(index)) {
  if (existsSync(path.join(out, 'index.html'))) throw new Error('Both index and index.html exist; inspect manually')
  if (!/^<!doctype html>/i.test(readFileSync(index, 'utf8'))) throw new Error('Root route is not HTML')
  renameSync(index, path.join(out, 'index.html'))
}
const sitemap = readFileSync(path.join(out, 'sitemap.xml'), 'utf8')
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
const missing = urls.filter(url => {
  if (!url.startsWith('https://magicmet.ru')) throw new Error('Unexpected sitemap origin')
  const route = new URL(url).pathname.replace(/^\/|\/$/g, '')
  return !existsSync(path.join(out, route ? `${route}.html` : 'index.html'))
})
if (missing.length) throw new Error(`Missing sitemap pages: ${missing.join(', ')}`)
const files = []
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isSymbolicLink()) throw new Error('Symlink found in output')
    if (entry.isDirectory()) walk(full)
    else {
      const relative = path.relative(out, full).split(path.sep).join('/')
      if (relative.split('/').some(part => part === '.env' || part.startsWith('.env.') || ['private', 'node_modules', 'admin'].includes(part))) throw new Error(`Forbidden output path: ${relative}`)
      files.push({ path: relative, sha256: createHash('sha256').update(readFileSync(full)).digest('hex') })
    }
  }
}
walk(out)
const proof = { source: manifest.source, checkedAt: new Date().toISOString(), sitemapUrls: urls.length, missingPages: missing.length, files, deploymentReady: false, requestEndpointVerified: false }
writeFileSync(path.join(target, 'STATIC_EXPORT_PROOF.json'), JSON.stringify(proof, null, 2) + '\n')
console.log(JSON.stringify({ source: proof.source, sitemapUrls: urls.length, missingPages: 0, files: files.length, deploymentReady: false, requestEndpointVerified: false }))
