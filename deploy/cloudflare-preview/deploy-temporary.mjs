import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

// Explicit one-time deployment, never called by prepare or local verification.
const root = process.cwd()
const assets = path.join(root, '.cloudflare/output/v0/workers/default/assets')
const files = directory => readdirSync(directory, { withFileTypes: true }).flatMap(item => {
  const file = path.join(directory, item.name)
  if (item.isSymbolicLink()) throw new Error('Unexpected asset symlink')
  return item.isDirectory() ? files(file) : [file]
})
const allAssets = files(assets)
if (allAssets.length > 1000 || allAssets.some(file => statSync(file).size > 5 * 1024 * 1024)) {
  throw new Error('Temporary account static asset limit exceeded before deployment')
}
const config = readFileSync('cloudflare.config.ts', 'utf8')
if (!config.includes("LOCAL_SMTP_TEST: bindings.text('0')") || /SMTP_HOST|SMTP_PASSWORD/.test(config)) {
  throw new Error('Public preview must keep email disabled')
}
const started = new Date()
const result = spawnSync(path.join(root, 'node_modules/.bin/cf'), ['deploy', '--prebuilt', '--temporary-account', '--no-provision'], {
  env: { ...process.env, CI: 'true', CF_TELEMETRY: 'false' },
  encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 300000,
})
// CLI prints a secret claim link. Never forward raw stdout/stderr to Actions logs.
writeFileSync(path.join(process.env.RUNNER_TEMP || '/tmp', 'magic-temporary-deploy-private.log'),
  (result.stdout || '') + (result.stderr || ''), { mode: 0o600 })
if (result.error || result.status !== 0) {
  console.error('Temporary Cloudflare deployment failed; raw diagnostics are private and were not uploaded.')
  process.exit(1)
}
const candidates = [...new Set(((result.stdout || '') + (result.stderr || '')).match(/https:\/\/[a-z0-9.-]+\.workers\.dev\b/gi) || [])]
if (candidates.length !== 1) {
  console.error('Deployment did not return one unambiguous public workers.dev URL; private claim links are not exposed.')
  process.exit(1)
}
const source = JSON.parse(readFileSync(new URL('./versions.json', import.meta.url), 'utf8')).sourceSha
const report = { url: candidates[0], source, workflowSha: process.env.GITHUB_SHA || null, startedAt: started.toISOString(),
  expiresAround: new Date(started.getTime() + 60 * 60000).toISOString(), temporary: true }
writeFileSync('preview-public.json', JSON.stringify(report, null, 2) + '\n')
console.log('Temporary read-only preview:', report.url)
console.log('Valid for at most 60 minutes; no automatic renewal or permanent hosting.')
if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `url=${report.url}\n`, { flag: 'a' })
if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY,
  `\nTemporary read-only preview: ${report.url}\n\nApp source: ${report.source}\n\nWorkflow: ${report.workflowSha}\n\nExpires around ${report.expiresAround} (UTC). This is not permanent hosting.\n`, { flag: 'a' })
