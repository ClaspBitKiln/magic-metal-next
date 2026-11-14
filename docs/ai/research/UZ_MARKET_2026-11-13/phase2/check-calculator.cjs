// Local formula and rendering checks. No browser, server, network or dependencies.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, 'price-calculator.html'), 'utf8');
const json = html.split('<script id="dataset" type="application/json">')[1].split('</script>')[0];
const js = html.split('<script>')[1].split('</script>')[0].replace(/render\(\);\s*$/, '');
const elements = {dataset: {textContent: json}};
const document = {getElementById(id) {return elements[id] ??= {value:'', checked:false, innerHTML:'', addEventListener(){}};}};
const ctx = vm.createContext({document, assert});
new vm.Script(js); // Syntax of actual generated application script.
vm.runInContext(js, ctx);
vm.runInContext(`
 const close=(a,b)=>assert(Math.abs(a-b)<1e-7, String(a)+' != '+String(b));
 const row={source:'Металлоторг',tiers:[102000,101000,100000],tierLabels:['1–<5 т','5–15 т','>15 т'],vat:true};
 const p={q:20,buy:20,f:450000,p:30000,e:0,fx:144.53,valid:true,reserve:false};
 const c=compute(row,p);
 assert.equal(c.floor,124000); // Owner's floor: 100000 gross + 24000 expenses.
 close(c.cost,100000/1.22+24000);
 close(c.floor-c.cost,c.net*.22);
 close(c.floor*p.fx,17921720);
 const reserved=compute(row,{...p,reserve:true});
 close(reserved.reserveAmount,c.base*.05);
 close(reserved.floor,124000+c.base*.05);
 close(reserved.cost,c.base*1.05);
 close(reserved.floor-reserved.cost,reserved.net*.22);
 const mixed=compute(row,{...p,buy:5});
 assert.equal(mixed.price,101000);assert.equal(mixed.log,24000);
 assert.equal(priceFor(row,1).price,102000);
 assert.equal(priceFor(row,15).price,101000);
 assert.equal(priceFor(row,.5).price,null);
 assert.equal(compute(row,{...p,valid:false}).floor,null);
 const kg=DATA.find(r=>r.source==='МС / mc.ru'&&r.unit==='kg'&&r.gross===131000);
 assert(kg);assert.equal(priceFor(kg,20).price,131000);
 selected={...row,name:'Тест',size:'100',grade:'40ХН',group:'Круг',warehouse:'Москва',stock:20,url:'https://example.org',date:'2026-11-13'};
 renderSelected(p);
 assert($('calculation').innerHTML.includes('Собственный минимум экспорта DAP, RUB/т'));
 assert($('calculation').innerHTML.includes('Собственный минимум экспорта DAP, UZS/т'));
 assert($('calculation').innerHTML.includes('22% от закупки без НДС'));
 $('market').value='11200000';$('marketVat').value='';renderMargin(p,c);
 assert(!$('margin').innerHTML.includes('class="big"'));
 $('marketVat').value='yes';renderMargin(p,c);
 assert($('margin').innerHTML.includes('10 000 000'));
`, ctx);
console.log('PASS: floor 100000 + 24000 = 124000 RUB/t; FX, shared reserve, VAT basis, net cost, mixed-load tiers, kg conversion, floor display and explicit UZ VAT.');
