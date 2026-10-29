// Magic Metal research fallback: public page reader with Russian legacy encoding support.
const fs=require('node:fs'),path=require('node:path');
const targets=process.argv.slice(2);
(async()=>{for(const url of targets){try{
 if(!/^https:\/\//i.test(url))throw Error('HTTPS required');
 const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),18000);
 let r;try{r=await fetch(url,{signal:ctrl.signal,headers:{'user-agent':'Mozilla/5.0 (compatible; MagicMetalCatalogResearch/1.0)','accept':'text/html,application/xhtml+xml'}})}finally{clearTimeout(timer)}
 const buf=Buffer.from(await r.arrayBuffer());
 const headers=r.headers.get('content-type')||'';
 let charset=headers.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1];
 if(!charset){const prefix=buf.subarray(0,2000).toString('latin1');charset=prefix.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1]||'utf-8'}
 const html=new TextDecoder(charset).decode(buf);
 const title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g,' ').trim()||'';
 const content=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/\s+/g,' ').trim();
 const result={url,status:r.status,charset,title,characters:html.length,sample:content.slice(0,1800)};
 console.log(JSON.stringify(result));
 }catch(e){console.log(JSON.stringify({url,error:e.message}))}}})()