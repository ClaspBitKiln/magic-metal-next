// Executes the real wrapper in PowerShell 7 with mocked Windows cmdlets/runtimes.
// It does not validate Windows itself, PowerShell 5.1, a real vault or network.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const engine = process.env.POWERSHELL_TEST_PATH || '/workspace/tooling/powershell-test/engine/pwsh'
const fixture = fileURLToPath(new URL('./fixtures/obsidian-recovery-wrapper/run-wrapper.ps1', import.meta.url))
const wrapper = fileURLToPath(new URL('../scripts/diagnose_remote_desktop_commander.ps1', import.meta.url))

function run(scenario, localStatus = 0) {
  const root = mkdtempSync(path.join(tmpdir(), 'obsidian-ps-flow-'))
  const eventsFile = path.join(root, 'events.log')
  const localData = path.join(root, 'localdata')
  const programFiles = path.join(root, 'programfiles')
  mkdirSync(path.join(localData, 'Obsidian'), { recursive: true })
  mkdirSync(programFiles, { recursive: true })
  writeFileSync(path.join(localData, 'Obsidian', 'Obsidian.exe'), 'offline fixture; never executed')
  try {
    const result = spawnSync(engine, ['-NoLogo', '-NoProfile', '-NonInteractive', '-File', fixture, '-WrapperPath', wrapper], {
      encoding: 'utf8', timeout: 15_000,
      env: { ...process.env, LOCALAPPDATA: localData, ProgramFiles: programFiles, MM_WRAPPER_EVENTS: eventsFile, MM_SCENARIO: scenario, MM_LOCAL_STATUS: String(localStatus) },
    })
    assert.ifError(result.error)
    return { code: result.status, output: result.stdout + result.stderr, events: existsSync(eventsFile) ? readFileSync(eventsFile, 'utf8').replaceAll('\ufeff', '').trim().split(/\r?\n/u) : [] }
  } finally { rmSync(root, { recursive: true, force: true }) }
}

test('PowerShell recovery flow guards', { skip: !existsSync(engine) ? 'Set POWERSHELL_TEST_PATH to an available PowerShell 7 executable' : false }, async t => {
  await t.test('existing Remote and Obsidian remain running; healthy local check exits 0', () => {
    const result = run('existing-healthy')
    assert.equal(result.code, 0, result.output)
    assert.equal(result.events.filter(x => x === 'local-diagnostic').length, 1)
    for (const event of ['npx-start', 'obsidian-start', 'broker-probe']) assert.equal(result.events.includes(event), false, event)
    assert.match(result.output, /running process alone does not prove ChatGPT tool availability/iu)
  })
  await t.test('existing Remote does not hide a failed local check', () => {
    const result = run('existing-unhealthy', 2)
    assert.equal(result.code, 2, result.output)
    assert.equal(result.events.includes('npx-start'), false)
    assert.equal(result.events.includes('obsidian-start'), false)
  })
  await t.test('missing helper exits 4 without reporting recovery', () => {
    const result = run('missing-helper')
    assert.equal(result.code, 4, result.output)
    assert.equal(result.events.includes('local-diagnostic'), false)
    assert.equal(result.events.includes('npx-start'), false)
  })
  await t.test('unavailable broker exits 3 without starting Remote', () => {
    const result = run('broker-unavailable')
    assert.equal(result.code, 3, result.output)
    assert.equal(result.events.includes('broker-probe'), true)
    assert.equal(result.events.includes('npx-start'), false)
  })
  await t.test('missing Node exits 2 before any application/network work', () => {
    const result = run('missing-node')
    assert.equal(result.code, 2, result.output)
    assert.deepEqual(result.events, [])
  })
  await t.test('missing Obsidian process starts only the existing local installation once', () => {
    const result = run('start-existing-obsidian')
    assert.equal(result.code, 0, result.output)
    assert.equal(result.events.filter(x => x === 'obsidian-start').length, 1)
    assert.equal(result.events.includes('npx-start'), false)
  })
  await t.test('missing Remote starts once after broker check and preserves local diagnostic failure', () => {
    const result = run('start-missing-remote', 2)
    assert.equal(result.code, 2, result.output)
    assert.equal(result.events.filter(x => x === 'npx-start').length, 1)
    assert.ok(result.events.indexOf('broker-probe') < result.events.indexOf('npx-start'))
    assert.equal(result.events.includes('obsidian-start'), false)
  })
  await t.test('failed process inspection exits 5 instead of starting a possible duplicate Remote', () => {
    const result = run('cim-unavailable')
    assert.equal(result.code, 5, result.output)
    assert.equal(result.events.includes('remote-process-check'), true)
    assert.equal(result.events.includes('broker-probe'), false)
    assert.equal(result.events.includes('npx-start'), false)
    assert.equal(result.events.includes('obsidian-start'), false)
  })
})
