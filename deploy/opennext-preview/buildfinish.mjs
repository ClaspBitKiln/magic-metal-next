import { copyFileSync, existsSync, lstatSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const kit = path.dirname(fileURLToPath(import.meta.url))
const root = process.cwd()
const versions = JSON.parse(readFileSync(path.join(kit, 'versions.json'), 'utf8'))
const marker = JSON.parse(readFileSync(path.join(root, '.opennext-preview-source.json'), 'utf8'))
if (marker.sourceSha !== versions.sourceSha) throw new Error('Run inside the prepared preview copy with its exact source marker')
const output = path.join(root, '.open-next')
const worker = path.join(output, 'worker.js')
if (!existsSync(worker) || lstatSync(output).isSymbolicLink() || lstatSync(worker).isSymbolicLink()) {
  throw new Error('Build OpenNext first; refusing missing or symlinked worker output')
}
copyFileSync(path.join(kit, 'preview-worker.js.template'), path.join(output, 'preview-worker.js'))
console.log('Installed read-only OpenNext preview wrapper; no deployment performed.')
