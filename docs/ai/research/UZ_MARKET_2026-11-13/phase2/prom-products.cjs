// Runs on the authorized Windows machine. Public catalog jobs only; no credentials are read/exported.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright-core');
const base=__dirname,jobs=JSON.parse(fs.readFileSync(path.join(base,'prom-jobs.json'),'utf8'));
const resultPath=path.join(base,'prom-batch-products-20261113.json');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const html=s=>s.split('\n\n').map(s=>'<p>'+esc(s)+'</p>').join('');
if(!process.argv.includes('--apply')){console.log(JSON.stringify(jobs.map(({name,price_uzs_t,basis})=>({name,price_uzs_t,basis})),null,2));process.exit(0)}
let results=fs.existsSync(resultPath)?JSON.parse(fs.readFileSync(resultPath,'utf8')):[];
const persist=()=>fs.writeFileSync(resultPath,JSON.stringify(results,null,2));
(async()=>{const browser=await chromium.connectOverCDP('http://127.0.0.1:9223');try{
 const context=browser.contexts()[0];let page=context.pages().find(p=>p.url().startsWith('https://my.prom.uz/app/products'));
 if(!page)throw Error('Authorized product tab absent');page.setDefaultTimeout(20000);
 const save=()=>page.getByRole('button',{name:'Сохранить',exact:true}).click();
 const choose=async(root,label)=>{await root.focus();await page.waitForTimeout(100);if(!((await root.getAttribute('class'))||'').includes('is-open'))await root.press('ArrowDown');const option=root.getByText(label,{exact:true}).filter({visible:true}).last();await option.waitFor({state:'visible'});for(let attempt=0;attempt<2;attempt++){await option.hover();await page.waitForTimeout(100);await root.press('Enter');await page.waitForTimeout(150);if((await root.innerText()).trim()===label)return}throw Error('Option selection not confirmed: '+label)};
 const field=async label=>{const id=await page.locator('label').filter({hasText:new RegExp('^'+label+'$')}).getAttribute('for');if(!id)throw Error('Missing labeled field: '+label);return page.locator('[id="'+id+'"]')};
 for(const job of jobs){
  if(results.some(r=>r.name===job.name&&r.status==='submit_started'))throw Error('Previous submission requires manual readback before retry: '+job.name);
  if(results.some(r=>r.name===job.name&&r.status==='moderation_confirmed')){console.log('SKIP confirmed '+job.name);continue}
  if(!Number.isFinite(job.price_uzs_t)||job.price_uzs_t<=0)throw Error('Invalid price');
  if(!fs.existsSync(path.join(base,job.image)))throw Error('Image missing: '+job.image);
  if(page.url().includes('/products-all')){
   const existing=page.getByRole('link',{name:job.name,exact:true});
   if(await existing.count()){results.push({name:job.name,status:'existing_record_preserved',url:await existing.first().getAttribute('href'),at:new Date().toISOString()});persist();console.log('SKIP existing '+job.name);continue}
  }
  await page.goto('https://my.prom.uz/app/products',{waitUntil:'domcontentloaded'});
  await page.getByPlaceholder('Введите название',{exact:true}).waitFor({state:'visible'});
  if(!await page.locator('a[href*="/statistics/611809"]').count())throw Error('Company611809 not confirmed');
  const name=page.getByPlaceholder('Введите название',{exact:true});if(await name.inputValue())throw Error('Existing form input preserved');
  await name.fill(job.name);await name.press('Tab');
  const hint=page.getByText(job.category,{exact:true}).filter({visible:true}).first();
  let hasHint=true;try{await hint.waitFor({state:'visible',timeout:3000})}catch{hasHint=false}
  if(hasHint)await hint.click();else{const category=await field('Раздел');await category.locator('input').fill(job.category);const option=category.getByText(job.category,{exact:true}).filter({visible:true}).first();await option.waitFor({state:'visible'});await option.hover();await category.press('Enter')}
  await save();await page.locator('label').filter({hasText:/^Цена$/}).waitFor({state:'visible'});
  const price=page.locator('label').filter({hasText:/^Цена$/}).locator('..').locator('input');
  if(await price.count()!==1)throw Error('Price input not unique');await price.fill(String(job.price_uzs_t));
  const currency=await field('Валюта');await choose(currency,'сум');
  await page.getByLabel('На заказ',{exact:true}).check({force:true});await page.getByLabel('Оптом',{exact:true}).check({force:true});
  const unit=await field('Единица измерения');await choose(unit,'тонна');
  await save();await page.locator('[contenteditable="true"]').first().waitFor({state:'visible'});
  await page.locator('[contenteditable="true"]').first().evaluate((e,data)=>e.ckeditorInstance.setData(data),html(job.description_ru));
  await page.locator('input[type="file"]').first().setInputFiles(path.join(base,job.image));
  await page.waitForTimeout(600);await save();
  await page.getByPlaceholder('Название на узбекском языке',{exact:true}).waitFor({state:'visible'});
  await page.getByPlaceholder('Название на узбекском языке',{exact:true}).fill(job.name_uz);
  await page.locator('[contenteditable="true"]').nth(1).evaluate((e,data)=>e.ckeditorInstance.setData(data),html(job.description_uz));
  const editorTexts=await page.locator('[contenteditable="true"]').evaluateAll(es=>es.map(e=>e.ckeditorInstance.getData()));
  if(editorTexts.length!==2||editorTexts.some(s=>s.length<200))throw Error('Description not bound to editor');
  if(!await page.getByLabel('Оптом',{exact:true}).isChecked()||!await page.getByLabel('На заказ',{exact:true}).isChecked())throw Error('Wrong sales status');
  const proof={name:job.name,price_uzs_t:job.price_uzs_t,unit:'tonne',stock:'on_order',basis:job.basis,at:new Date().toISOString(),status:'submit_started'};results.push(proof);persist();
  await save(); // FINAL save exactly once. Never retry automatically if verification fails.
  await page.waitForURL(u=>u.pathname==='/app/products-all',{timeout:45000});
  await page.getByText('На модерации',{exact:true}).click();
  const link=page.getByRole('link',{name:job.name,exact:true});await link.waitFor({state:'visible',timeout:45000});
  const row=await link.locator('xpath=ancestor::tr[1]').innerText();
  if(!row.replace(/\s/g,'').includes(String(job.price_uzs_t))||!row.includes('сум/тонна')||!row.includes('На заказ'))throw Error('Saved product readback mismatch');
  Object.assign(proof,{status:'moderation_confirmed',url:await link.getAttribute('href'),row,verified_at:new Date().toISOString()});persist();console.log('CONFIRMED '+job.name+' '+proof.url);
 }
 console.log('DONE '+results.filter(r=>r.status==='moderation_confirmed').length+' new moderated records; no public publication assumed');
}finally{await browser.close()}})().catch(e=>{persist();console.error('STOP: '+e.message+'; inspect result JSON before any retry');process.exitCode=1});
