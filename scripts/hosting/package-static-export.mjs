#!/usr/bin/env node
// Package public files only; SMTP config/vendor remain a separate private install.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const [targetArg, archiveArg] = process.argv.slice(2)
if (!targetArg || !archiveArg || !path.isAbsolute(targetArg) || !path.isAbsolute(archiveArg)) throw new Error('Usage: node package-static-export.mjs ABSOLUTE_PREPARED_TARGET ABSOLUTE_NEW_ARCHIVE.tar.gz')
const target = path.resolve(targetArg)
const archive = path.resolve(archiveArg)
const root = archive + '.root'
if (existsSync(archive) || existsSync(root)) throw new Error('Archive and staging root must be new paths')
const prep = JSON.parse(readFileSync(path.join(target, 'STATIC_PREPARATION.json'), 'utf8'))
const proof = JSON.parse(readFileSync(path.join(target, 'STATIC_EXPORT_PROOF.json'), 'utf8'))
if (proof.source !== prep.source || proof.missingPages !== 0 || !proof.sitemapUrls) throw new Error('Finalize and verify the static tree first')
mkdirSync(path.dirname(archive), { recursive: true })
cpSync(path.join(target, 'out'), root, { recursive: true, dereference: false })
mkdirSync(path.join(root, 'api'), { recursive: true })
cpSync(path.join(repo, 'scripts/hosting/php/request.php'), path.join(root, 'api/request.php'))
cpSync(path.join(repo, 'scripts/hosting/php/.user.ini.example'), path.join(root, 'api/.user.ini'))
const files = []
function walk(dir) {
  chmodSync(dir, 0o755)
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isSymbolicLink()) throw new Error('Symlink not allowed in public artifact')
    if (entry.isDirectory()) walk(full)
    else {
      const relative = path.relative(root, full).split(path.sep).join('/')
      if (relative.split('/').some(part => part === '.env' || part.startsWith('.env.') || ['private', 'node_modules', 'admin', 'request-config.php', 'request-config.example.php', 'request-lib.php', 'composer.lock', 'composer.json'].includes(part))) throw new Error(`Private path in output: ${relative}`)
      chmodSync(full, 0o644)
      const bytes = readFileSync(full)
      files.push({ path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') })
    }
  }
}
walk(root)
const result = spawnSync('tar', ['-czf', archive, '-C', root, '.'], { stdio: 'inherit' })
if (result.status !== 0) throw new Error('Archive failed')
chmodSync(archive, 0o600)
const bytes = readFileSync(archive)
const receipt = { source: prep.source, createdAt: new Date().toISOString(), archive, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), files, containsSmtpCredentials: false, deploymentReady: false, remaining: ['Actual hosting Apache/PHP/SMTP/TLS/browser acceptance before DNS'] }
writeFileSync(archive + '.manifest.json', JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 })
console.log(JSON.stringify({ archive, source: receipt.source, bytes: receipt.bytes, sha256: receipt.sha256, files: files.length, deploymentReady: false }))
