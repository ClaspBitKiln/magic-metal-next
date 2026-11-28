#!/usr/bin/env node
/** Cache-first public UN Comtrade helper. No paid services or credentials. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const finite = v => v === null || v === undefined || (typeof v === 'string' && v.trim() === '') || typeof v === 'boolean' ? null : Number.isFinite(Number(v)) ? Number(v) : null;
const nonnegative = v => { const n=finite(v); return n !== null && n >= 0 ? n : null; };
export function normalizeRecord(r, source = {}) {
  const kg=nonnegative(r.netWgt), usd=nonnegative(r.primaryValue), tonnes=kg===null?null:kg/1000;
  return { period: String(r.period ?? ''), frequency: r.freqCode ?? null,
    reporter_code: r.reporterCode ?? null, partner_code: r.partnerCode ?? null,
    partner2_code:r.partner2Code??null, flow:r.flowCode??null, hs:String(r.cmdCode??''),
    classification:r.classificationCode??null, customs:r.customsCode??null, transport:r.motCode??null,
    description:r.cmdDesc??null, net_kg:kg, tonnes, value_usd:usd,
    customs_unit_value_usd_t:tonnes!==null&&tonnes>0&&usd!==null?usd/tonnes:null,
    net_weight_estimated:r.isNetWgtEstimated??null, quantity_estimated:r.isQtyEstimated??null,
    aggregate:r.isAggregate??null, reported:r.isReported??null, original_classification:r.isOriginalClassification??null,
    source_family:'UN Comtrade', source_url:source.url??null, retrieved_at:source.retrieved_at??null,
    cache_key:source.cache_key??null, source_file:source.file??null,
    caveat:'HS trade aggregate, not an exact grade/size demand estimate, retail quote or proof of shortage.' };
}
const dimensionKey = r => JSON.stringify([r.period,r.frequency,r.reporter_code,r.partner_code,r.partner2_code,r.flow,r.hs,r.classification,r.customs,r.transport]);
export function normalizeResponse(payload, source={}) {
  const body=payload.response??payload;
  if(body.error) throw new Error(`Comtrade response error: ${typeof body.error==='string'?body.error:JSON.stringify(body.error)}`);
  if(!Array.isArray(body.data)) throw new Error('Expected Comtrade data array; missing data is not zero trade.');
  const origin={...payload.source,...source}, rows=[], conflicts=[], seen=new Map();
  for(const raw of body.data){const r=normalizeRecord(raw,origin),k=dimensionKey(r); if(!seen.has(k)){seen.set(k,r);rows.push(r)}else{const before=seen.get(k);if(before.net_kg!==r.net_kg||before.value_usd!==r.value_usd)conflicts.push({dimensions:k,reason:'Conflicting duplicate; first row preserved, not summed.'})}}
  const worlds=rows.filter(r=>r.partner_code!==null&&String(r.partner_code)==='0');
  return {source_family:'UN Comtrade', source:origin, record_count:rows.length,
    duplicates_removed:body.data.length-rows.length, conflicts, rows,
    coverage:{returned_rows:body.data.length,api_count:body.count??null,preview_record_cap:500,possible_truncation:body.data.length>=500||(Number.isFinite(body.count)&&body.count>body.data.length)},
    world_totals:worlds.map(r=>({period:r.period,hs:r.hs,reporter_code:r.reporter_code,tonnes:r.tonnes,value_usd:r.value_usd,customs_unit_value_usd_t:r.customs_unit_value_usd_t})),
    notes:['World rows are never added to partner rows.','No world total is invented when absent.','WITS/OEC may redistribute UN Comtrade; they are not automatically independent evidence.','Empty data is unavailable/absent in this response, not proof of zero imports.']};
}
export function toCsv(rows) {
  if(!rows.length)return '';
  const cols=Object.keys(rows[0]);
  const cell=v=>{if(v===null||v===undefined)return '';let s=String(v);if(typeof v==='string'&&/^[\s]*[=+\-@]|^[\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};
  return [cols.map(cell).join(','),...rows.map(r=>cols.map(k=>cell(r[k])).join(','))].join('\n')+'\n';
}
export function buildUrl({period,cmd,partners='0,643',reporter='860'}) {
  if(!/^\d{4}(\d{2})?$/.test(period??''))throw Error('Use one annual YYYY or monthly YYYYMM period, not a CSV.');
  if(period.length===6&&(+period.slice(4)<1||+period.slice(4)>12))throw Error('Monthly period must end with01–12.');
  const codes=(cmd??'').split(',').filter(Boolean);
  if(!codes.length||codes.length>5||codes.some(c=>!/^\d{2,6}$/.test(c)))throw Error('Supply 1–5 HS codes (2–6 digits).');
  if(!/^\d+(,\d+)*$/.test(partners)||!/^\d+$/.test(reporter))throw Error('Numeric country codes required.');
  const freq=period.length===4?'A':'M';
  const p=new URLSearchParams({period,reporterCode:reporter,cmdCode:codes.join(','),flowCode:'M',partnerCode:partners,partner2Code:'0',customsCode:'C00',motCode:'0',maxRecords:'500'});
  return `https://comtradeapi.un.org/public/v1/preview/C/${freq}/HS?${p}`;
}
export function retryDelay(value, now=Date.now()) {
  if(!value)return null;
  const seconds=Number(value);if(Number.isFinite(seconds)&&seconds>=0)return Math.ceil(seconds*1000);
  const date=Date.parse(value);return Number.isFinite(date)?Math.max(0,date-now):null;
}
export async function fetchComtrade({url,cacheDir,refresh=false,fetchImpl=globalThis.fetch,now=Date.now}) {
  await fs.mkdir(cacheDir,{recursive:true});const key=crypto.createHash('sha256').update(url).digest('hex');
  const target=path.join(cacheDir,key+'.json'), cooldown=path.join(cacheDir,'rate-limit.json');
  if(!refresh){try{return {payload:JSON.parse(await fs.readFile(target,'utf8')),cacheHit:true}}catch(e){if(e.code!=='ENOENT')throw e}}
  try{const lock=JSON.parse(await fs.readFile(cooldown,'utf8'));if(lock.until>now())throw Error(`Rate-limit cooldown until ${new Date(lock.until).toISOString()}; no request sent.`)}catch(e){if(e.code!=='ENOENT')throw e}
  const response=await fetchImpl(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(30000)});
  if(response.status===429){const delay=retryDelay(response.headers.get('retry-after'),now());const until=now()+(delay??60000);await fs.writeFile(cooldown,JSON.stringify({until,retry_after:response.headers.get('retry-after'),fallback_cooldown_assumption:delay===null}));throw Error(`HTTP429: no automatic retry; cooldown until ${new Date(until).toISOString()}.`)}
  if(!response.ok)throw Error(`HTTP${response.status}: ${String(await response.text()).slice(0,300)}`);
  const body=await response.json();normalizeResponse(body);
  const payload={source:{family:'UN Comtrade',url,retrieved_at:new Date(now()).toISOString(),cache_key:key},response:body};
  await fs.writeFile(target,JSON.stringify(payload,null,2));return {payload,cacheHit:false};
}
function parseArgs(args){const out={};for(let i=0;i<args.length;i++){const a=args[i];if(!a.startsWith('--'))throw Error('Expected --option');const key=a.slice(2);if(['fetch','refresh','help'].includes(key))out[key]=true;else{if(!args[i+1]||args[i+1].startsWith('--'))throw Error(`Missing value for ${a}`);out[key]=args[++i]}}return out}
async function main(){const a=parseArgs(process.argv.slice(2));if(a.help){console.log('Local: --input raw.json [--source-url URL] [--out normalized.json] [--csv rows.csv]\nExplicit network: --fetch --period YYYY --cmd 722540,730439 --partners 0,643 [--cache DIR] [--refresh]');return}
  if(Boolean(a.input)===Boolean(a.fetch))throw Error('Choose --input OR explicit --fetch. Default mode performs no network request.');
  let payload,source={};if(a.input){payload=JSON.parse(await fs.readFile(a.input,'utf8'));source.file=path.resolve(a.input);if(a['source-url'])source.url=a['source-url']}else{const url=buildUrl(a);({payload}=await fetchComtrade({url,cacheDir:a.cache??'.cache/uz-demand-research',refresh:!!a.refresh}))}
  const result=normalizeResponse(payload,source);if(a.out)await fs.writeFile(a.out,JSON.stringify(result,null,2));if(a.csv)await fs.writeFile(a.csv,toCsv(result.rows));
  console.log(JSON.stringify({records:result.record_count,duplicates_removed:result.duplicates_removed,conflicts:result.conflicts.length,world_rows:result.world_totals.length,out:a.out??null,csv:a.csv??null,source_family:result.source_family}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1});
