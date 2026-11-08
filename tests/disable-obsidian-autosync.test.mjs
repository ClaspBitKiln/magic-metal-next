// PowerShell 7/Linux simulation: Windows task APIs are mocked. Real temporary
// shortcut bytes are moved and hashed. One exact Startup-folder expression is
// replaced in a temporary script copy; real Windows/PowerShell 5.1 is not tested.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const engine = process.env.POWERSHELL_TEST_PATH || '/workspace/tooling/powershell-test/engine/pwsh'
const fixture = fileURLToPath(new URL('./fixtures/disable-obsidian-autosync/run.ps1', import.meta.url))
const script = fileURLToPath(new URL('../scripts/disable_obsidian_autosync.ps1', import.meta.url))
const syncLinks = ['MagicMetal Catalog Sync.lnk', 'MagicMetal Obsidian Sync.lnk']
const preservedLinks = ['MagicMetal Desktop Commander Remote.lnk', 'Unrelated app.lnk']
const allLinks = [...syncLinks, ...preservedLinks]
const initialTasks = ['MagicMetal Catalog Sync', 'MagicMetal Remote Connection', 'Unrelated task'].map(TaskName => ({ TaskName, Settings: { Enabled: true } }))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')

function withFixture(callback) {
  const root = mkdtempSync(path.join(tmpdir(), 'obsidian-manual-sync-'))
  const startup = path.join(root, 'startup')
  const localData = path.join(root, 'localdata')
  const state = path.join(root, 'tasks.json')
  const events = path.join(root, 'events.txt')
  const copy = path.join(root, 'disable.ps1')
  mkdirSync(startup); mkdirSync(localData)
  const source = readFileSync(script, 'utf8')
  const replacement = "[Environment]::GetFolderPath('Startup')"
  assert.equal(source.split(replacement).length, 2, 'The single platform-dependent test seam must be reviewed if changed')
  writeFileSync(copy, source.replace(replacement, '$env:MM_DISABLE_STARTUP'))
  writeFileSync(state, JSON.stringify(initialTasks))
  const contents = Object.fromEntries(allLinks.map(name => [name, Buffer.from(`fixture shortcut: ${name}\n`)]))
  for (const [name, content] of Object.entries(contents)) writeFileSync(path.join(startup, name), content)
  const backupRoot = path.join(localData, 'MagicMetalObsidianSync', 'disabled-startup')
  const backupFiles = () => existsSync(backupRoot) ? readdirSync(backupRoot).flatMap(dir => readdirSync(path.join(backupRoot, dir)).map(name => ({ name, filename: path.join(backupRoot, dir, name) }))) : []
  const readTasks = () => JSON.parse(readFileSync(state, 'utf8'))
  const mutations = () => existsSync(events) ? readFileSync(events, 'utf8').trim().split(/\r?\n/u) : []
  const unchangedFiles = () => {
    for (const name of allLinks) assert.deepEqual(readFileSync(path.join(startup, name)), contents[name])
    assert.deepEqual(backupFiles(), [])
  }
  const run = ({ apply = false, scenario = 'normal', host = 'DESKTOP-BNPIVK2' } = {}) => {
    const result = spawnSync(engine, ['-NoLogo', '-NoProfile', '-NonInteractive', '-File', fixture, '-ScriptPath', copy], {
      encoding: 'utf8', timeout: 15000,
      env: { ...process.env, OS: 'Windows_NT', COMPUTERNAME: host, LOCALAPPDATA: localData, MM_DISABLE_STARTUP: startup, MM_DISABLE_STATE: state, MM_DISABLE_EVENTS: events, MM_DISABLE_SCENARIO: scenario, MM_DISABLE_APPLY: apply ? '1' : '0' },
    })
    assert.ifError(result.error)
    return { code: result.status, output: result.stdout + result.stderr }
  }
  try { callback({ run, readTasks, mutations, unchangedFiles, backupFiles, startup, contents }) }
  finally { rmSync(root, { recursive: true, force: true }) }
}

const options = { skip: !existsSync(engine) ? 'Set POWERSHELL_TEST_PATH to PowerShell 7' : false }
test('preview leaves task states and every shortcut untouched', options, () => withFixture(f => {
  const r = f.run()
  assert.equal(r.code, 0, r.output)
  assert.match(r.output, /Would disable/)
  assert.deepEqual(f.readTasks(), initialTasks)
  assert.deepEqual(f.mutations(), [])
  f.unchangedFiles()
}))

test('apply disables only note sync and preserves both shortcut backups byte-for-byte', options, () => withFixture(f => {
  const r = f.run({ apply: true })
  assert.equal(r.code, 0, r.output)
  assert.deepEqual(f.readTasks().map(t => [t.TaskName, t.Settings.Enabled]), initialTasks.map(t => [t.TaskName, t.TaskName !== 'MagicMetal Catalog Sync']))
  assert.deepEqual(f.mutations(), ['MagicMetal Catalog Sync'])
  for (const name of syncLinks) assert.equal(existsSync(path.join(f.startup, name)), false)
  for (const name of preservedLinks) assert.deepEqual(readFileSync(path.join(f.startup, name)), f.contents[name])
  const backups = f.backupFiles()
  assert.deepEqual(backups.map(b => b.name).sort(), syncLinks.toSorted())
  for (const b of backups) assert.equal(hash(readFileSync(b.filename)), hash(f.contents[b.name]))
  assert.match(r.output, /does not verify Obsidian read\/write access/)
}))

test('repeated apply creates no duplicate backups or task mutations', options, () => withFixture(f => {
  assert.equal(f.run({ apply: true }).code, 0)
  const backups = f.backupFiles()
  const r = f.run({ apply: true })
  assert.equal(r.code, 0, r.output)
  assert.match(r.output, /Already disabled/)
  assert.deepEqual(f.backupFiles(), backups)
  assert.deepEqual(f.mutations(), ['MagicMetal Catalog Sync'])
  for (const name of preservedLinks) assert.deepEqual(readFileSync(path.join(f.startup, name)), f.contents[name])
}))

test('task enumeration failure prevents all mutations', options, () => withFixture(f => {
  const r = f.run({ apply: true, scenario: 'enumeration-failure' })
  assert.equal(r.code, 1)
  assert.match(r.output, /Mock task enumeration failure/)
  assert.deepEqual(f.readTasks(), initialTasks)
  assert.deepEqual(f.mutations(), [])
  f.unchangedFiles()
}))

test('disable failure retains shortcuts and does not report success', options, () => withFixture(f => {
  const r = f.run({ apply: true, scenario: 'disable-failure' })
  assert.equal(r.code, 1)
  assert.match(r.output, /Mock task disable failure/)
  assert.doesNotMatch(r.output, /Disabled:|backup verified/)
  assert.deepEqual(f.readTasks(), initialTasks)
  f.unchangedFiles()
}))

test('task verification catches a disable operation with no effect', options, () => withFixture(f => {
  const r = f.run({ apply: true, scenario: 'disable-no-effect' })
  assert.equal(r.code, 1)
  assert.match(r.output, /Scheduled task is still enabled/)
  assert.doesNotMatch(r.output, /Disabled:|backup verified/)
  f.unchangedFiles()
}))

test('wrong-host refusal occurs before any task or shortcut mutation', options, () => withFixture(f => {
  const r = f.run({ apply: true, host: 'ANOTHER-PC' })
  assert.equal(r.code, 1)
  assert.match(r.output, /Run on the authorized Windows host/)
  assert.deepEqual(f.readTasks(), initialTasks)
  assert.deepEqual(f.mutations(), [])
  f.unchangedFiles()
}))
