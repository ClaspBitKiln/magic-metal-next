import { spawnSync } from 'node:child_process'

// Vercel: exit 0 skips a build, exit 1 requests a build.
// Preview builds are opt-in while the free storage budget is exhausted.
if (process.env.VERCEL_ENV === 'preview' && process.env.MAGICMET_BUILD_PREVIEW !== '1') {
  console.log('Skipping automatic preview; verification runs in GitHub CI.')
  process.exit(0)
}

// Compare the entire unpublished range, not just the last commit of a push.
// Unknown or shallow history must never hide an application change.
const baseline = process.env.VERCEL_GIT_PREVIOUS_SHA
if (!baseline || !/^[a-f0-9]{40}$/i.test(baseline)) process.exit(1)
const previousCommit = spawnSync('git', ['cat-file', '-e', `${baseline}^{commit}`], { stdio: 'ignore' })
if (previousCommit.status !== 0) process.exit(1)

const excludedPaths = [
  'docs/**',
  'MEMORY.md',
  '.agents/**',
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
  ['diff', '--quiet', baseline, 'HEAD', '--', '.', ...excludedPaths.map((path) => `:(exclude)${path}`)],
  { stdio: 'ignore' },
)

process.exit(result.status === 0 ? 0 : 1)
