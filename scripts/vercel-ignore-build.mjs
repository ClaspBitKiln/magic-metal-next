import { spawnSync } from 'node:child_process'

const previousCommit = spawnSync('git', ['rev-parse', 'HEAD^'], { stdio: 'ignore' })
if (previousCommit.status !== 0) process.exit(1)

const excludedPaths = [
  'docs/**',
  '.github/**',
  'tests/**',
  'qa/**',
  'skills/**',
  '.codex/**',
  '.vscode/**',
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'AUDIT-*.md',
  'DESIGN-QA.md',
  'GLOBAL-BENCHMARKS.md',
  'MOTION-AUDIT-*.md',
  'SENIOR-AUDIT-CHECKLIST.md',
  'playwright.config.ts',
  'playwright.production.config.ts',
  'lighthouserc.production.cjs',
  'vitest.config.mts',
  'vitest.setup.ts',
  'test.env',
]

const result = spawnSync(
  'git',
  ['diff', '--quiet', 'HEAD^', 'HEAD', '--', '.', ...excludedPaths.map((path) => `:(exclude)${path}`)],
  { stdio: 'ignore' },
)

process.exit(result.status === 0 ? 0 : 1)
