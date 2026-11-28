const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(path.join(__dirname,'prom-add-one.cjs'),'utf8'),baseJob=JSON.parse(fs.readFileSync(path.join(__dirname,'prom-sixth-job.json'),'utf8'));
function blocked(patch,existing,expected){let browserUsed=false;const job={...baseJob,...patch};const fakeFs={readFileSync:()=>JSON.stringify(job),existsSync:()=>existing};const fakeChromium={connectOverCDP:()=>{browserUsed=true;throw Error('Unexpected browser connection')}};const ctx={require:n=>n==='fs'||n==='node:fs'?fakeFs:n==='path'||n==='node:path'?path:n==='playwright-core'?{chromium:fakeChromium}:require(n),__dirname,process:{argv:['node','script','--apply']},console};assert.throws(()=>vm.runInNewContext(code,ctx),expected);assert.equal(browserUsed,false)}
blocked({export_listing_release:false},false,/Export identification release missing/);
blocked({price_uzs_t:1},false,/Price below owner minimum/);
blocked({},true,/Attempt receipt already exists/);
console.log('PASS: unreviewed export, below-floor price and duplicate submission all stop before browser access.');
