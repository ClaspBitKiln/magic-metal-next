import { spawn } from 'node:child_process'

const portArg = process.argv.indexOf('--port')
const port = portArg >= 0 ? process.argv[portArg + 1] : '3000'
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-H', '0.0.0.0', '-p', port], {
  env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
  stdio: 'inherit',
})

child.on('exit', (code) => process.exit(code ?? 0))
process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))
