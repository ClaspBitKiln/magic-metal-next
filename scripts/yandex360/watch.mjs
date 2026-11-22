/** Read-only scheduled inbox/Disk digest. No LLM calls, mail sending or supplier processing. */
import { readFile, writeFile, mkdir, rename, open, unlink } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Yandex360Client } from './client.mjs';

export const GENERATED_MARKER = '<!-- magicmetal-yandex360-watch:v1 -->';
const esc = value => String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/([\\`*_[\]#|])/g, '\\$1').slice(0,350);
export function unpack(result) {
  if (result?.isError) throw new Error('Read tool failed');
  if (result?.structuredContent) return result.structuredContent;
  const text = result?.content?.find(x => x.type === 'text')?.text;
  if (!text) throw new Error('Missing structured response');
  return JSON.parse(text);
}
export function signal(message) {
  const s = `${message.subject || ''} ${message.firstline || ''}`.toLowerCase();
  if (/продвижен|трафик|директ|передавать.*клиент|партн[её]рк|рассылк|выручк.*компан/.test(s)) return 'возможно реклама — проверить';
  if (/лист|круг|труб|поков|канат|электрод|проволок|швеллер|балк|отвод|тройник|плит|сталь|стали|металл/.test(s)) return 'есть признаки товарного запроса — проверить';
  return 'требует просмотра';
}
async function jsonOrMissing(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return fallback; throw new Error('Invalid local state/config'); }
}
async function atomic(path, text) {
  const tmp = path + `.tmp-${process.pid}`;
  await writeFile(tmp, text, { mode: 0o600 });
  await rename(tmp, path);
}
export async function collectMail(client, folderId, since, until) {
  const rows = [], cursors = new Set();
  let cursor;
  do {
    const args = cursor ? { cursor } : { folder_id: folderId, min_received_at: since, max_received_at: until, limit: 100 };
    const result = unpack(await client.callTool('mail.list_messages_in_folder', args));
    if (!Array.isArray(result.items)) throw new Error('Invalid message page');
    rows.push(...result.items);
    cursor = result.next_cursor;
    if (cursor && (cursors.has(cursor) || cursors.size >= 20)) throw new Error('Mail pagination incomplete');
    if (cursor) cursors.add(cursor);
  } while (cursor);
  return rows;
}
export async function runWatch({ config, root, clients, now = new Date() }) {
  if (!config.reportDir || !Array.isArray(config.folderIds) || config.folderIds.some(x => typeof x !== 'string')) throw new Error('Explicit reportDir/folderIds required');
  await mkdir(root, { recursive: true, mode: 0o700 });
  const lockPath = join(root, 'watch.lock');
  let lock;
  try { lock = await open(lockPath, 'wx', 0o600); }
  catch (e) { if (e.code === 'EEXIST') return { skipped: 'another run or stale lock; inspect before removing' }; throw e; }
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, at: now.toISOString() }));
    const statePath = join(root, 'watch-state.json');
    const state = await jsonOrMissing(statePath, { mailSeen: [], diskSeen: [], recentMail: [], recentDisk: [] });
    const start = state.lastSuccess ? new Date(new Date(state.lastSuccess).getTime() - 60000) : new Date(now.getTime() - 7 * 86400000);
    if (!Number.isFinite(start.getTime()) || start > now) throw new Error('Invalid checkpoint');
    const rows = [];
    for (const id of config.folderIds) rows.push(...await collectMail(clients.mail, id, start.toISOString(), now.toISOString()));
    const seen = new Set(state.mailSeen || []);
    const fresh = [];
    for (const m of rows) if (m.message_id && !seen.has(m.message_id)) {
      seen.add(m.message_id);
      fresh.push({ id: m.message_id, folder: m.folder_id, subject: m.subject, at: m.received_at, signal: m.folder_id === config.siteFolderId ? signal(m) : 'сервисное уведомление' });
    }
    const diskSeen = new Set(state.diskSeen || []), diskFresh = [];
    let diskWindowFull = false;
    if (config.diskEnabled) {
      const disk = unpack(await clients.disk.callTool('disk.list_recent_items', { limit: 50 }));
      if (!Array.isArray(disk.items)) throw new Error('Invalid Disk response');
      diskWindowFull = disk.items.length === 50;
      for (const f of disk.items) {
        const key = `${f.resource_id || f.path || f.name}:${f.modified || f.created || ''}`;
        if (!diskSeen.has(key)) { diskSeen.add(key); diskFresh.push({ name: f.name, modified: f.modified || f.created }); }
      }
    }
    const recentMail = [...fresh, ...(state.recentMail || [])].slice(0,100);
    const recentDisk = [...diskFresh, ...(state.recentDisk || [])].slice(0,50);
    const stamp = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Yekaterinburg', dateStyle: 'short', timeStyle: 'short' }).format(now);
    const report = [GENERATED_MARKER, '# Почта и Диск — автоматическая сводка', '', `Обновлено: ${stamp} (Екатеринбург).`, '', `Новых писем в этой проверке: ${fresh.length}. Новых записей в выборке Диска: ${diskFresh.length}.`, '', 'Это список уведомлений, а не количество подтверждённых клиентов. Классификация предварительная. Скрипт не отправляет письма, не меняет их прочитанность, не редактирует файлы Диска и не обрабатывает матрицу поставщиков.', '', '## Последние письма', '', ...recentMail.map(m => `- ${esc(m.at)} · ${esc(m.subject)} · ${esc(m.signal)} · папка ${esc(m.folder)}`), '', '## Последние документы Диска', '', ...recentDisk.map(f => `- ${esc(f.name)} · ${esc(f.modified)}`), '', 'Диск: только метаданные последних 50 загрузок; это не полный аудит изменений. Содержимое документов не скачивается.', ...(diskWindowFull ? ['Выборка Диска заполнена: более старые изменения могли не попасть в неё.'] : []), '', 'Запускается только по команде владельца. Расписание отключено. При следующем запуске проверка почты читает пропущенный интервал.', ''].join('\n');
    await mkdir(config.reportDir, { recursive: true });
    const target = join(config.reportDir, 'Почта и Диск — автоматическая сводка.md');
    try { const existing = await readFile(target, 'utf8'); if (!existing.startsWith(GENERATED_MARKER)) throw new Error('Refusing to overwrite a user note'); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
    await atomic(target, report);
    await atomic(statePath, JSON.stringify({ lastSuccess: now.toISOString(), mailSeen: [...seen], diskSeen: [...diskSeen], recentMail, recentDisk }, null, 2));
    const status = { at: now.toISOString(), ok: true, newMail: fresh.length, diskNew: diskFresh.length, report: target, readOnly: true };
    await atomic(join(root, 'watch-status.json'), JSON.stringify(status, null, 2));
    return status;
  } finally { await lock.close(); await unlink(lockPath); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = resolve(dirname(process.argv[1]));
  try {
    const config = JSON.parse(await readFile(join(root, 'watch-config.json'), 'utf8'));
    const mail = new Yandex360Client({ service: 'mail', token: process.env.YANDEX360_MAIL_TOKEN });
    await mail.initialize();
    const disk = config.diskEnabled ? new Yandex360Client({ service: 'disk', token: process.env.YANDEX360_DISK_TOKEN }) : undefined;
    if (disk) await disk.initialize();
    console.log(JSON.stringify(await runWatch({ config, root, clients: { mail, disk } })));
  } catch {
    const status = { at: new Date().toISOString(), ok: false, error: 'Watch failed; checkpoint not advanced. Inspect connectivity, credentials and private state.' };
    await writeFile(join(root, 'watch-status.json'), JSON.stringify(status), { mode: 0o600 }).catch(() => {});
    console.error(JSON.stringify(status)); process.exitCode = 1;
  }
}
