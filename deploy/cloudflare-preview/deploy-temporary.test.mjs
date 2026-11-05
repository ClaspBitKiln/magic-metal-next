import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
const helper = resolve('deploy/cloudflare-preview/deploy-temporary.mjs')
const secret = 'CLAIM_CREDENTIAL_MUST_STAY_PRIVATE'
function run(output, exitCode = 0) {
  const root = mkdtempSync(join(tmpdir(), 'magic-preview-policy-'))
  mkdirSync(join(root, 'node_modules/.bin'), { recursive: true })
  mkdirSync(join(root, '.cloudflare/output/v0/workers/default/assets'), { recursive: true })
  writeFileSync(join(root, 'cloudflare.config.ts'), "LOCAL_SMTP_TEST: bindings.text('0')")
  writeFileSync(join(root, 'node_modules/.bin/cf'), '#!/usr/bin/env node\nconsole.log(' + JSON.stringify(output) + ');process.exit(' + exitCode + ')', { mode: 0o700 })
  const result = spawnSync(process.execPath, [helper], { cwd: root, encoding: 'utf8',
    env: { ...process.env, RUNNER_TEMP: root, GITHUB_SHA: 'verified-source', GITHUB_OUTPUT: join(root, 'outputs'), GITHUB_STEP_SUMMARY: join(root, 'summary') } })
  return { root, result, cleanup: () => rmSync(root, { recursive: true, force: true }) }
}
test('publishes only the public preview URL and keeps the claim credential private', () => {
  const probe = run('Claim: https://dash.cloudflare.com/claim?token=' + secret + '\nDeployed https://magic-test.example.workers.dev')
  try {
    assert.equal(probe.result.status, 0)
    for (const output of [probe.result.stdout, probe.result.stderr, readFileSync(join(probe.root, 'outputs'), 'utf8'), readFileSync(join(probe.root, 'summary'), 'utf8')]) {
      assert(!output.includes(secret)); assert(!output.includes('dash.cloudflare.com'))
    }
    const report = JSON.parse(readFileSync(join(probe.root, 'preview-public.json')))
    assert.equal(report.url, 'https://magic-test.example.workers.dev')
    assert.equal(report.source, JSON.parse(readFileSync(new URL('./versions.json', import.meta.url))).sourceSha)
    assert.equal(report.workflowSha, 'verified-source')
  } finally { probe.cleanup() }
})
test('failed deployment never copies raw claim credentials into logs', () => {
  const probe = run('private claim=' + secret, 1)
  try { assert.equal(probe.result.status, 1); assert(!(probe.result.stdout + probe.result.stderr).includes(secret)) }
  finally { probe.cleanup() }
})
test('ambiguous public URLs are rejected instead of exposing raw output', () => {
  const probe = run(secret + ' https://one.example.workers.dev https://two.example.workers.dev')
  try { assert.equal(probe.result.status, 1); assert(!(probe.result.stdout + probe.result.stderr).includes(secret)) }
  finally { probe.cleanup() }
})
