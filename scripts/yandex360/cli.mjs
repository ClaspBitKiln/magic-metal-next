#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { Yandex360Client, redact } from './client.mjs';

const HELP = `Usage (Node 22+):
  node scripts/yandex360/cli.mjs mail tools
  node scripts/yandex360/cli.mjs mail call --file /private/request.json [--write] [--output /private/result.json]
  node scripts/yandex360/cli.mjs disk tools

OAuth token: YANDEX360_MAIL_TOKEN or YANDEX360_DISK_TOKEN environment variable.
Request JSON: {"name":"mail.list_folders","arguments":{}}
Only verified read tools run by default. Mutations require --write.
No token, password or mailbox contents should be committed to Git. --output refuses overwrite.
Official mail MCP supports drafts, not sending mail. No scheduler is installed by this CLI.`;

export async function main(argv = process.argv.slice(2), env = process.env) {
  if (!argv.length || argv.includes('--help')) return { help: HELP };
  const [service, command, ...flags] = argv;
  if (!['mail', 'disk'].includes(service) || !['tools', 'call'].includes(command)) throw new Error(HELP);
  let file, output, write = false;
  for (let i = 0; i < flags.length; i++) {
    if (flags[i] === '--write') write = true;
    else if (flags[i] === '--file' && flags[i + 1]) file = flags[++i];
    else if (flags[i] === '--output' && flags[i + 1]) output = flags[++i];
    else throw new Error(`Unknown or incomplete argument: ${flags[i]}`);
  }
  if (command === 'call' && !file) throw new Error('call requires --file pointing to a private JSON request');
  if (command === 'tools' && (file || write)) throw new Error('tools does not accept --file or --write');
  const token = env[`YANDEX360_${service.toUpperCase()}_TOKEN`];
  const client = new Yandex360Client({ service, token });
  let request;
  if (file) {
    request = JSON.parse(await readFile(file, 'utf8'));
    if (!request || typeof request.name !== 'string' || !request.arguments) throw new Error('Expected name and arguments in request JSON');
  }
  await client.initialize();
  const result = command === 'tools'
    ? await client.listTools()
    : await client.callTool(request.name, request.arguments, { write });
  const safe = redact(result, token);
  if (output) {
    await writeFile(output, `${JSON.stringify(safe, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
    return { saved: true, path: output };
  }
  return safe;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => {
    let message = String(error?.message || error);
    for (const name of ['YANDEX360_MAIL_TOKEN', 'YANDEX360_DISK_TOKEN']) message = redact(message, process.env[name]);
    console.error(message);
    process.exitCode = 1;
  });
}
