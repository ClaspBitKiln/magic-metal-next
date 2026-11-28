import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runWatch, collectMail, signal } from './watch.mjs';
const reply = x => ({ structuredContent: x });
test('pagination preserves folder query then cursor-only; repeated cursor fails', async () => {
  const calls = [];
  const client = { callTool: async (_, args) => { calls.push(args); return reply(calls.length === 1 ? {items:[{message_id:'1'}], next_cursor:'c'} : {items:[{message_id:'2'}]}); } };
  assert.equal((await collectMail(client,'9','2026-11-01T00:00:00Z','2026-11-22T00:00:00Z')).length,2);
  assert.deepEqual(calls[1],{cursor:'c'});
  await assert.rejects(collectMail({callTool:async()=>reply({items:[],next_cursor:'same'})},'9','a','b'),/pagination/);
});
test('idempotent digest, untrusted text escaped, no external mutation tools', async () => {
  const root=await mkdtemp(join(tmpdir(),'mm-watch-'));
  try {
    const called=[];
    const clients={mail:{callTool:async(name)=>{called.push(name);return reply({items:[{message_id:'m',folder_id:'9',subject:'[click](https://evil)',firstline:'Нужен лист ст45',received_at:'2026-11-21'}]});}},disk:{callTool:async(name)=>{called.push(name);return reply({items:[{name:'x.xlsx',resource_id:'f',modified:'2026-11-21'}]});}}};
    const config={reportDir:join(root,'notes'),folderIds:['9'],siteFolderId:'9',diskEnabled:true};
    const a=await runWatch({root,config,clients,now:new Date('2026-11-22T00:00:00Z')});
    const b=await runWatch({root,config,clients,now:new Date('2026-11-22T06:00:00Z')});
    assert.equal(a.newMail,1); assert.equal(b.newMail,0); assert.equal(b.diskNew,0);
    const note=await readFile(a.report,'utf8'); assert.match(note,/\\\[click/);
    assert(called.every(n=>n==='mail.list_messages_in_folder'||n==='disk.list_recent_items'));
  } finally {await rm(root,{recursive:true,force:true});}
});
test('failure leaves checkpoint unchanged and releases lock', async()=>{
  const root=await mkdtemp(join(tmpdir(),'mm-watch-'));
  try {
    const original=JSON.stringify({lastSuccess:'2026-11-21T00:00:00Z',mailSeen:[]});await writeFile(join(root,'watch-state.json'),original);
    await assert.rejects(runWatch({root,config:{reportDir:join(root,'notes'),folderIds:['9']},clients:{mail:{callTool:async()=>{throw Error('offline')}}}}));
    assert.equal(await readFile(join(root,'watch-state.json'),'utf8'),original);
    await assert.rejects(readFile(join(root,'watch.lock')), {code:'ENOENT'});
  } finally {await rm(root,{recursive:true,force:true});}
});
test('advertising signals never become confirmed leads',()=>{
  assert.match(signal({firstline:'Готов передавать клиентов за процент'}),/реклама/);
  assert.match(signal({firstline:'Нужен лист 45 20 мм'}),/проверить/);
});
