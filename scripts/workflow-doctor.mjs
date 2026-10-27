#!/usr/bin/env node
// Read-only workspace diagnostics. Never print environment values or command logs.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const flags = new Set(process.argv.slice(2))
const allowed = new Set(['--network', '--json', '--help'])
if ([...flags].some((flag) => !allowed.has(flag))) {
  console.error('Unknown option. Use --help.')
  process.exit(2)
}
if (flags.has('--help')) {
  console.log('Usage: node scripts/workflow-doctor.mjs [--json] [--network]')
  console.log('Read-only checks; no installation, service startup, writes, or credential values.')
  console.log('Network checks use existing Git/CLI authentication and normal proxy routing.')
  console.log('Exit codes: 0 ready; 1 local prerequisite unavailable; 2 invalid invocation; 3 network check failed.')
  process.exit(0)
}

function run(command, args, timeout = 12000) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
    timeout,
    maxBuffer: 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  return {
    ok: !result.error && result.status === 0,
    output: result.stdout ?? '',
    exitCode: result.status,
    reason: result.error?.code === 'ENOENT'
      ? 'command_missing'
      : result.error?.code === 'ETIMEDOUT'
        ? 'timeout'
        : result.error ? 'execution_error' : result.status === 0 ? undefined : 'command_failed',
  }
}

function outcome(result) {
  return result.ok
    ? { status: 'passed' }
    : { status: 'failed', reason: result.reason, exitCode: result.exitCode }
}

const variableNames = [
  'DATABASE_URL', 'PAYLOAD_SECRET', 'OBSIDIAN_API_URL', 'OBSIDIAN_API_KEY',
  'VERCEL_TOKEN', 'GH_TOKEN', 'GITHUB_TOKEN',
]

function filePresence(filename) {
  let text
  try {
    text = readFileSync(path.join(root, filename), 'utf8')
  } catch (error) {
    return { status: error.code === 'ENOENT' ? 'absent' : 'unreadable' }
  }
  const variables = Object.fromEntries(variableNames.map((name) => [name, 'absent']))
  for (const line of text.split(/\r?\n/u)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u)
    if (!match || !variableNames.includes(match[1])) continue
    // Presence detection only: do not evaluate shell syntax or expand variables.
    const value = match[2].trim()
    variables[match[1]] = !value || value.startsWith('#') || /^(?:""|'')\s*(?:#.*)?$/u.test(value)
      ? 'empty'
      : 'present'
  }
  return { status: 'read', variables }
}

const npm = run('npm', ['--version'])
const npmVersion = npm.ok && /^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/u.test(npm.output.trim())
  ? npm.output.trim() : undefined
const gitRoot = run('git', ['rev-parse', '--show-toplevel'])
const gitStatus = run('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all'])
const changes = []
if (gitStatus.ok) {
  const records = gitStatus.output.split('\0')
  for (let index = 0; index < records.length; index++) {
    const record = records[index]
    if (!record) continue
    const change = { status: record.slice(0, 2), path: record.slice(3) }
    if (/[RC]/u.test(change.status)) change.from = records[++index]
    changes.push(change)
  }
}
const docker = run('docker', ['info', '--format', '{{.ServerVersion}}'])
const postgres = docker.ok
  ? run('docker', ['compose', 'exec', '-T', 'postgres', 'pg_isready', '-U', 'postgres', '-d', 'magicmet'])
  : null
const processPresence = Object.fromEntries(variableNames.map((name) => [
  name,
  Object.hasOwn(process.env, name) ? process.env[name]?.trim() ? 'present' : 'empty' : 'absent',
]))
const envFiles = { '.env': filePresence('.env'), '.env.local': filePresence('.env.local') }
const hasRuntimeVariable = (name) => processPresence[name] === 'present'
  || Object.values(envFiles).some((file) => file.variables?.[name] === 'present')
const report = {
  workspace: root,
  node: { status: 'available', version: process.version },
  npm: { ...outcome(npm), ...(npmVersion ? { version: npmVersion } : {}) },
  git: {
    ...outcome(gitRoot),
    checkoutAtExpectedRoot: gitRoot.ok ? path.resolve(gitRoot.output.trim()) === root : false,
    workingTree: gitStatus.ok ? changes.length ? 'dirty' : 'clean' : 'unknown',
    changes,
    ...(gitStatus.ok ? {} : { statusCheck: outcome(gitStatus) }),
  },
  docker: outcome(docker),
  postgres: postgres ? outcome(postgres) : { status: 'not_checked', reason: 'docker_unavailable' },
  bindings: {
    note: 'Presence only; values, validity, injection scope, and dotenv precedence are not inspected.',
    process: processPresence,
    files: envFiles,
  },
  mcp: { status: 'not_inspected', reason: 'MCP capabilities are not visible to this shell diagnostic.' },
  network: { status: 'not_requested' },
}

let networkFailed = false
if (flags.has('--network')) {
  const remote = run('git', ['ls-remote', 'origin', 'HEAD'], 20000)
  const match = remote.output.trim().match(/^([a-f0-9]{40}|[a-f0-9]{64})\s+HEAD$/u)
  const website = run('curl', [
    '-sS', '-I', '--max-time', '15', '-o', '/dev/null', '-w', '%{http_code} %{http_connect}',
    'https://magicmet.ru/',
  ], 18000)
  const statuses = website.output.trim().match(/^(\d{3}) (\d{3})$/u)
  const httpStatus = statuses ? Number(statuses[1]) : null
  const proxyConnectStatus = statuses ? Number(statuses[2]) : null
  const websitePassed = website.ok && httpStatus >= 200 && httpStatus < 400
  const api = run('gh', ['api', 'repos/ClaspBitKiln/magic-metal-next', '--silent'], 20000)
  report.network = {
    gitRead: { ...outcome(remote), ...(remote.ok && match ? { head: match[1] } : {}) },
    website: {
      status: websitePassed ? 'passed' : 'failed',
      httpStatus,
      proxyConnectStatus,
      ...(website.ok ? {} : { reason: website.reason, exitCode: website.exitCode }),
    },
    githubApi: outcome(api),
    note: 'Git read and GitHub API access are separate checks. No push, deployment, or secret validity is tested.',
  }
  networkFailed = !remote.ok || !match || !websitePassed || !api.ok
}

const localReady = npm.ok && gitRoot.ok && gitStatus.ok && report.git.checkoutAtExpectedRoot
  && docker.ok && postgres?.ok && hasRuntimeVariable('DATABASE_URL') && hasRuntimeVariable('PAYLOAD_SECRET')
report.result = {
  localPrerequisites: localReady ? 'passed' : 'failed',
  note: 'Readiness here covers workspace prerequisites only, not application behavior or production.',
  exitCode: !localReady ? 1 : networkFailed ? 3 : 0,
}
if (flags.has('--json')) console.log(JSON.stringify(report, null, 2))
else {
  for (const [name, value] of Object.entries(report)) console.log(`${name}: ${JSON.stringify(value)}`)
}
process.exitCode = report.result.exitCode
