#!/usr/bin/env node
// Read-only verification: offline tests do not establish real account access.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { main } from './metrika-report.mjs'

const repository = fileURLToPath(new URL('../', import.meta.url))
const tests = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'scripts/metrika-report.test.mjs'], {
  cwd: repository, encoding: 'utf8', timeout: 60000,
})
console.log(JSON.stringify({ offlineTestsPassed: tests.status === 0, testsPassed: Number(tests.stdout?.match(/# pass (\d+)/)?.[1] || 0) }))
if (tests.status !== 0) {
  console.error('Offline client tests failed; account access was not checked.')
  process.exitCode = 1
} else if (!process.env.YANDEX_METRIKA_TOKEN) {
  console.log(JSON.stringify({ status: 'authorization-required', tokenConfigured: false, reportReady: false }))
  process.exitCode = 2
} else {
  try {
    await main(['--counter', process.env.YANDEX_METRIKA_COUNTER_ID || '113661397', '--days', '28'])
  } catch (error) {
    // The report client sanitizes API errors and never includes credentials.
    console.error(error.message)
    process.exitCode = 1
  }
}
