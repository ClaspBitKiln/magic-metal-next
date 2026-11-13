// Authorized company611809 only. Idempotent updates by existing product IDs, never creates duplicates.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright-core');
const base=__dirname,jobs=JSON.parse(fs.readFileSync(path.join(base,'prom-updates.json'),'utf8'));
const approvedIds=new Set([1402458,1402459,1402460,1402461,1402462]);
if(jobs.length!==approvedIds.size||new Set(jobs.map(j=>j.id)).size!==approvedIds.size||jobs.some(j=>!approvedIds.has(j.id)))throw Error('Only the five approved existing IDs are allowed');
if(!process.argv.includes('--apply')){console.log(JSON.stringify(jobs.map(x=>({id:x.id,name:x.name,price:x.price_uzs_t,stock:'В наличии',delivery:x.delivery_ru,income_pct_net_purchase:x.income_pct_net_purchase})),null,2));process.exit(0)}
const resultPath=path.join(base,'prom-updated-20261113.json'),outDir=path.join(base,'results');fs.mkdirSync(outDir,{recursive:true});
let results=fs.existsSync(resultPath)?JSON.parse(fs.readFileSync(resultPath,'utf8')):[];
const persist=()=>fs.writeFileSync(resultPath,JSON.stringify(results,null,2));
function transform(html,job,uz){
 const rich=uz?job.rich_uz:job.rich_ru;if(rich)html=rich.split("\n\n").map(t=>"<p>"+t.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")+"</p>").join("");
 if(!uz){html=html.replaceAll('Поставка под заказ со склада в России в Ташкент.',job.location_ru).replaceAll('Наличие, срок и возможность поставки согласуются при заказе.','Количество, точный срок отгрузки и комплект документов согласуются при заказе.');if(!html.includes(job.delivery_ru))html='<p><strong>В наличии. '+job.delivery_ru+'</strong></p>'+html;}
 else{html=html.replaceAll('Rossiyadagi ombordan Toshkentga buyurtma asosida yetkazib beriladi.',job.location_uz).replaceAll('Mavjudlik, muddat va yetkazib berish imkoniyati buyurtma vaqtida kelishiladi.','Miqdor, aniq jo‘natish muddati va hujjatlar buyurtma vaqtida kelishiladi.');if(!html.includes(job.delivery_uz))html='<p><strong>Mavjud. '+job.delivery_uz+'</strong></p>'+html;}
 if(job.id===1402462)html=html.replace(/21(?:\s|&nbsp;|&#160;)*500(?:\s|&nbsp;|&#160;)*000/g,'24 000 000');
 if(/склад[а-я\s]*поставщик/i.test(html))throw Error('Unwanted supplier warehouse wording');
 return html;
}
(async()=>{const b=await chromium.connectOverCDP('http://127.0.0.1:9223');try{const c=b.contexts()[0];let p=c.pages().find(p=>p.url().startsWith('https://my.prom.uz/app/products/'))||await c.newPage();p.setDefaultTimeout(25000);
 async function load(job){await p.goto('https://my.prom.uz/app/products/'+job.id,{waitUntil:'domcontentloaded'});await p.waitForFunction(name=>document.querySelector('input[name="name"]')?.value===name,job.name,{timeout:30000});await p.waitForFunction(()=>{const a=[...document.querySelectorAll('[contenteditable="true"]')];return a.length===2&&a.every(e=>e.ckeditorInstance?.getData().length>150)},undefined,{timeout:30000});if(!await p.locator('a[href*="/statistics/611809"]').count())throw Error('Company mismatch')}
 function priceInput(){return p.locator('label').filter({hasText:/^Цена$/}).locator('..').locator('input')}
 for(const job of jobs){
  if(job.price_uzs_t/144.53+1e-5<job.owner_floor_rub_t)throw Error('Price below owner minimum');
  await load(job);const old=await p.locator('[contenteditable="true"]').evaluateAll(es=>es.map(e=>e.ckeditorInstance.getData()));
  if(!old[0].includes('Иллюстрация')&&!old[0].includes('иллюстрация'))throw Error('Expected saved description not present');
  const ru=transform(old[0],job,false),uz=transform(old[1],job,true);
  const already=+(await priceInput().inputValue()).replace(/\D/g,'')===job.price_uzs_t&&await p.getByLabel('В наличии',{exact:true}).isChecked()&&old[0]===ru&&old[1]===uz;
  if(!already){await priceInput().fill(String(job.price_uzs_t));await p.getByLabel('В наличии',{exact:true}).check({force:true});}
  if(!already){await p.locator('[contenteditable="true"]').nth(0).evaluate((e,d)=>e.ckeditorInstance.setData(d),ru);await p.locator('[contenteditable="true"]').nth(1).evaluate((e,d)=>e.ckeditorInstance.setData(d),uz);}
  const proof={id:job.id,name:job.name,editUrl:'https://my.prom.uz/app/products/'+job.id,price_uzs_t:job.price_uzs_t,stock:'В наличии',delivery_ru:job.delivery_ru,delivery_uz:job.delivery_uz,at:new Date().toISOString(),status:'save_started'};
  results=results.filter(x=>x.id!==job.id);results.push(proof);persist();
  if(!already){await p.getByRole('button',{name:'Сохранить',exact:true}).click();await p.getByText('Успешно сохранено',{exact:true}).filter({visible:true}).first().waitFor({state:'visible',timeout:45000});}
  await load(job);const val=+(await priceInput().inputValue()).replace(/\D/g,'');const texts=await p.locator('[contenteditable="true"]').allTextContents();
  if(val!==job.price_uzs_t||!await p.getByLabel('В наличии',{exact:true}).isChecked()||!texts[0].includes(job.delivery_ru)||!texts[1].includes(job.delivery_uz))throw Error('Saved readback mismatch '+job.id);
  if(texts.some(s=>/склад[а-я\s]*поставщик/i.test(s)))throw Error('Supplier wording remains');
  await p.setViewportSize({width:1280,height:1000});await p.evaluate(async()=>{await document.fonts.ready;return true});await p.screenshot({path:path.join(outDir,'card-'+job.id+'.jpg'),type:'jpeg',quality:65,fullPage:true});
  Object.assign(proof,{no_write_needed:already,status:'saved_and_readback_verified',verified_at:new Date().toISOString(),screenshot:'results/card-'+job.id+'.jpg',description_ru:texts[0],description_uz:texts[1],publicLinks:await p.locator('a[href]').evaluateAll(es=>es.map(e=>e.href).filter(u=>u.includes('prom.uz/ads/')))});persist();console.log('VERIFIED '+job.id+' '+job.name+' '+val+' UZS/t in_stock 5-7days');
 }
 console.log('DONE '+results.filter(x=>x.status==='saved_and_readback_verified').length+' verified updates; public moderation status must be checked separately');
}finally{await b.close()}})().catch(e=>{persist();console.error('STOP '+e.message+'; inspect saved IDs and state before retry');process.exitCode=1});
