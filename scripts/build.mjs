import { spawn } from 'node:child_process'

// Public pages are statically generated and do not need a live database during
// compilation. These values exist only in the build subprocess so a fresh
// Vercel import can produce a visual staging deployment before Postgres is
// connected. Runtime CMS and request handling still require real project envs.
const env = {
  ...process.env,
  NODE_OPTIONS: '--no-deprecation --max-old-space-size=8000',
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || 'build-only-staging-secret',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@127.0.0.1:5432/magicmet_build_only',
}

const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
  env,
  stdio: 'inherit',
})

child.on('exit', (code) => process.exit(code ?? 1))
