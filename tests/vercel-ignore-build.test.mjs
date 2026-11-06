import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const script = fileURLToPath(new URL('../scripts/vercel-ignore-build.mjs', import.meta.url))

test('build decisions preserve unpublished changes and conserve preview storage', async (t) => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'magic-vercel-ignore-'))
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    return result.stdout.trim()
  }
  const commit = (file, content) => {
    mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true })
    writeFileSync(path.join(cwd, file), content)
    git('add', '.')
    git('commit', '-qm', 'fixture')
    return git('rev-parse', 'HEAD')
  }
  const decision = (baseline, extra = {}) => {
    const env = { ...process.env, VERCEL_ENV: 'production', ...extra }
    delete env.MAGICMET_BUILD_PREVIEW
    delete env.VERCEL_GIT_PREVIOUS_SHA
    Object.assign(env, extra)
    if (baseline !== undefined) env.VERCEL_GIT_PREVIOUS_SHA = baseline
    return spawnSync(process.execPath, [script], { cwd, env, encoding: 'utf8' }).status
  }
  try {
    git('init', '-q')
    git('config', 'user.name', 'Local test')
    git('config', 'user.email', 'test@example.invalid')
    const base = commit('src/page.tsx', 'initial')
    commit('MEMORY.md', 'status')
    commit('.agents/skills/example/SKILL.md', 'instructions')
    commit('docs/release.md', 'notes')
    await t.test('memory, agent instructions and documentation skip deployment', () => {
      assert.equal(decision(base), 0)
    })
    await t.test('initial deployment without known baseline builds', () => {
      assert.equal(decision(undefined), 1)
    })
    await t.test('missing shallow-history commit builds', () => {
      assert.equal(decision('a'.repeat(40)), 1)
    })
    await t.test('malformed baseline builds instead of interpreting a Git option', () => {
      assert.equal(decision('--help'), 1)
    })
    const app = commit('src/page.tsx', 'changed')
    commit('docs/release.md', 'notes after source change')
    await t.test('source change followed by docs in the same push still builds', () => {
      assert.equal(decision(base), 1)
    })
    await t.test('docs after an already deployed source revision skip', () => {
      assert.equal(decision(app), 0)
    })
    await t.test('automatic preview is skipped even with source changes', () => {
      assert.equal(decision(base, { VERCEL_ENV: 'preview' }), 0)
    })
    await t.test('explicit preview opt-in builds source changes', () => {
      assert.equal(decision(base, { VERCEL_ENV: 'preview', MAGICMET_BUILD_PREVIEW: '1' }), 1)
    })
    commit('vercel.json', '{}')
    await t.test('hosting configuration changes build', () => {
      assert.equal(decision(app), 1)
    })
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
