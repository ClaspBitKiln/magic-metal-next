#!/usr/bin/env python3
"""Rebuild standalone calculator from adjacent public normalized JSON; stdlib only."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FAMILIES = {'round_bar':'Круг', 'forging':'Поковка', 'sheet':'Лист / плита', 'profile_pipe':'Труба профильная', 'other_pipe':'Труба прочая', 'seamless_pipe':'Труба бесшовная', 'beam':'Балка', 'angle':'Уголок', 'channel':'Швеллер', 'wire':'Проволока', 'other':'Прочее'}
MC_FAMILIES = {'pokovka':'Поковка', 'krug_g_k':'Круг', 'krug_goryachekatanyj_konstrukcionnyj':'Круг', 'krug_nerzhaveyushchij_nikelsoderzhashchij':'Круг', 'truby_g_d':'Труба бесшовная', 'truby_h_d':'Труба бесшовная', 'truby_nerzhaveyushchie_besshovnye':'Труба бесшовная', 'balki_dvutavrovye':'Балка', 'shveller_katan':'Швеллер', 'ugolok_ravnopolochnyj':'Уголок'}

def number(value):
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) and value > 0 else None

def threshold(header):
    m = re.search(r'от\s*([\d.,]+)\s*(кг|т)', header or '', re.I)
    return float(m[1].replace(',', '.')) / (1000 if m[2].lower() == 'кг' else 1) if m else None

def build_rows():
    rows = []
    skipped = {'metallotorg':0, 'mc':0}
    for r in json.loads((ROOT/'metallotorg/normalized-all-chel-moscow.json').read_text()):
        if r.get('price_unit') != 'tonne':
            skipped['metallotorg'] += 1
            continue
        name = r.get('product_name', '')
        grade = re.search(r'(?i)(?:\bст)([\w/+-]+)', name)
        rows.append(dict(id='mt-'+str(r['row_id']), source='Металлоторг', warehouse=r.get('branch',''), group=FAMILIES.get(r.get('family'),'Прочее'), grade=('Ст'+grade[1]).upper() if grade else 'Не указана / см. описание', name=name, size=r.get('size_raw',''), detail=' · '.join(str(r.get(k) or '') for k in ('description_raw','standard_raw')), url=r.get('source_url',''), date=r.get('source_updated',''), stock=r.get('stock_t'), availability='Публичный остаток, т', tiers=[number(r.get('price_1_5_rub_t')),number(r.get('price_5_15_rub_t')),number(r.get('price_over_15_rub_t'))], thresholds=[1,5,15], tierLabels=['1–<5 т','5–15 т','>15 т'], vat=True, unit='tonne'))
    for i,r in enumerate(json.loads((ROOT/'mc/normalized.json').read_text())):
        if r.get('price_unit') not in ('tonne','kg'):
            skipped['mc'] += 1
            continue
        category=r.get('category','')
        group=MC_FAMILIES.get(category)
        if not group:
            if 'krug' in category: group='Круг'
            elif 'list' in category or 'plita' in category: group='Лист / плита'
            elif 'kvadratnye' in category or 'pryamougolnye' in category: group='Труба профильная'
            elif 'truby' in category: group='Труба прочая'
            elif 'setka' in category: group='Сетка'
            elif 'shestigrannik' in category: group='Шестигранник'
            elif 'polosa' in category: group='Полоса'
            elif 'kvadrat' in category: group='Квадрат'
            elif 'provoloka' in category: group='Проволока'
            else: group=category
        factor=1000 if r.get('price_unit')=='kg' else 1
        headers=r.get('price_tier_headers') or []
        tiers=[number(r.get('price_tier'+str(n)+'_raw')) for n in (1,2,3)]
        tiers=[v*factor if v is not None else None for v in tiers]
        rows.append(dict(id='mc-'+str(i), source='МС / mc.ru', warehouse=r.get('warehouse') or r.get('region',''), group=group, grade=str(r.get('grade') or 'Не указана / см. описание').upper(), name=r.get('name',''), size=r.get('size',''), detail=' · '.join(str(r.get(k) or '') for k in ('wall_mm','length_or_condition_raw')), url=r.get('url') or r.get('source_page',''), date=r.get('captured_at',''), stock=r.get('stock_confirmed_t'), availability=r.get('availability') or 'Не указано', tiers=tiers, thresholds=[threshold(h) for h in headers], tierLabels=headers, vat=r.get('vat_included') is True, unit=r.get('price_unit'), gross=number(r.get('gross_rub_t'))))
    return rows, skipped

TEMPLATE = r'''<!doctype html>
<html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Закупка РФ → Ташкент — калькулятор</title>
<style>
:root{color-scheme:light;font:15px/1.5 system-ui,sans-serif;color:#172b3a;background:#f1f5f7}*{box-sizing:border-box}body{max-width:1500px;margin:auto;padding:24px}h1{font-size:27px;margin:0 0 8px}h2{font-size:20px;margin:0 0 12px}p{margin:8px 0}.muted,small{color:#536574}section{background:white;border:1px solid #d6e0e5;border-radius:12px;padding:20px;margin:18px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(205px,1fr));gap:12px}label{display:block;font-size:13px;font-weight:600}input,select{display:block;width:100%;padding:9px;border:1px solid #a9bbc5;border-radius:6px;font:inherit;background:white;margin-top:4px}input[type=checkbox]{display:inline;width:auto}button{font:inherit;background:#116674;color:white;border:0;border-radius:6px;padding:7px 12px;cursor:pointer}button:focus-visible,input:focus-visible,select:focus-visible,a:focus-visible{outline:3px solid #e2a62e;outline-offset:2px}.notice{border-left:4px solid #d29521;background:#fffae9;padding:10px 14px}.scroll{overflow:auto;max-height:650px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:10px;text-align:left;border-bottom:1px solid #e3e9ed;vertical-align:top}th{position:sticky;top:0;background:#e9f1f4;z-index:1}td.num,th.num{text-align:right;white-space:nowrap}.selected{background:#e4f4f5}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}.card{background:#eef6f7;padding:14px;border-radius:8px}.big{font-size:23px;font-weight:700}a{color:#075e7c}.warn{color:#87510a}#calculation:empty{display:none}@media(max-width:600px){body{padding:12px}section{padding:14px}h1{font-size:23px}}
</style>
<h1>Закупка РФ → Ташкент</h1>
<p>Публичные прайсы. Расчёт известной части себестоимости при возмещении российского НДС 22%. Дата сборки: <b>__DATE__</b>.</p>
<p class="notice">Перевозка до Ташкента: исходно 450 000 RUB за машину из Москвы или Челябинска. DAP: импортное оформление и налоги покупателя в Узбекистане вне расчёта. Пошлина, происхождение и соответствие продукции не проверены; неизвестные расходы не равны нулю. Остатки и цены требуют подтверждения, товар не зарезервирован.</p>
<section><h2>Параметры партии</h2><div class="grid">
<label>Масса груза в машине, т<input id="qty" type="number" min="0.001" step="0.1" value="20"></label>
<label>Закупка выбранной позиции, т<input id="purchaseQty" type="number" min="0.001" step="0.1" value="20"></label>
<label>Перевозка за партию, RUB<input id="freight" type="number" min="0" step="1000" value="450000"></label>
<label>Оформление за партию, RUB<input id="paper" type="number" min="0" step="1000" value="30000"></label>
<label>Доп. расходы за партию, RUB<input id="extra" type="number" min="0" step="1000" value="0"></label>
<label>Курс UZS за 1 RUB<input id="fx" type="number" min="0.001" step="0.01" value="144.53"></label>
<label>Резерв на известные статьи<input id="reserve" type="checkbox"> Добавить 5% к расчётной сумме</label>
</div><p class="muted">Формула на тонну: закупка с НДС ÷ 1,22 + (перевозка + оформление + доп. расходы) ÷ масса. Собственный минимум экспортной цены: закупка с НДС + расходы на тонну + резерв, если включён. Резерв 5% рассчитан от закупки без возмещаемого НДС и известных расходов; одна и та же сумма резерва включается в себестоимость и экспортный минимум. Возмещение НДС предполагает выполнение требований экспорта; сроки и финансирование НДС не учтены. Объем закупки позиции определяет ценовую ступень, масса всего груза — распределение перевозки. Для смешанного груза проверяйте, что суммарная масса всех позиций совпадает с массой в машине. При изменении массы расходы за машину автоматически не уменьшаются; вместимость и тариф следует подтвердить.</p><p id="inputError" class="warn" role="alert"></p></section>
<section><h2>Прайсы и выбор позиции</h2><div class="grid">
<label>Источник<select id="source"></select></label><label>Склад<select id="warehouse"></select></label><label>Группа<select id="group"></select></label><label>Марка — точное значение<select id="grade"></select></label>
<label>Поиск по названию, размеру, описанию<input id="search" type="search" placeholder="Например: 40ХН, 09Г2С, 100"></label>
<label>Сортировка<select id="sort"><option value="price">Цена с НДС ↑</option><option value="priceDesc">Цена с НДС ↓</option><option value="cost">Себестоимость ↑</option><option value="costDesc">Себестоимость ↓</option><option value="name">Название</option></select></label>
</div><p id="count" class="muted" aria-live="polite"></p><div class="scroll"><table><thead><tr><th>Позиция / марка</th><th>Источник / склад</th><th>Группа</th><th class="num">С НДС, RUB/т</th><th class="num">Известная себест., RUB/т</th><th>Объём / наличие</th><th>Выбор</th></tr></thead><tbody id="rows"></tbody></table></div>
<p class="muted">Показаны первые 100 совпадений. Позиции и марки не объединяются; круг и поковка разделены. Отсутствующая цена обозначена «—». Исключены строки с ценами за м²/метр/штуку или неподтверждённой единицей: __SKIPPED__. Цены МС за кг показаны в RUB/т; нормализованный gross_rub_t повторно не умножается.</p></section>
<section id="calculation" aria-live="polite"></section>
<section><h2>Условное сравнение с ценой в Узбекистане</h2><div class="grid"><label>Ориентир локальной цены УЗ, UZS/т<input id="market" type="number" min="0" step="1000" placeholder="Введите подтверждённую вами цену"></label><label>НДС Узбекистана в введённой цене<select id="marketVat"><option value="">Укажите явно</option><option value="yes">Включает НДС 12%</option><option value="no">Без НДС</option></select></label></div><div id="margin"><p class="muted">Выберите позицию, введите цену и укажите НДС. Рыночная цена автоматически не подставляется.</p></div><p class="notice">Локальная цена Узбекистана служит только ориентиром: это не прямая оферта на наш экспорт DAP. Собственная экспортная цена рассчитывается отдельно. Это условная маржа по заданной цене и известным затратам, не фактическая прибыль. Пошлины, сертификация, финансирование, хранение, сбыт и другие неуказанные расходы могут уменьшить результат. Торговая наценка в прайсах не доказывает возможность продажи.</p></section>
<script id="dataset" type="application/json">__DATA__</script>
<script>
'use strict';
const DATA=JSON.parse(document.getElementById('dataset').textContent), $=id=>document.getElementById(id);
const fmt=(v,d=0)=>Number.isFinite(v)?v.toLocaleString('ru-RU',{maximumFractionDigits:d,minimumFractionDigits:d}):'—';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selected=null;
for(const key of ['source','warehouse','group','grade']){const sel=$(key);sel.innerHTML='<option value="">Все</option>'+[...new Set(DATA.map(r=>r[key]))].sort((a,b)=>a.localeCompare(b,'ru')).map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('');}
function params(){const q=+$('qty').value,buy=+$('purchaseQty').value,f=+$('freight').value,p=+$('paper').value,e=+$('extra').value,fx=+$('fx').value;const valid=['qty','purchaseQty','freight','paper','extra','fx'].every(k=>$(k).value.trim()!=='')&&[q,buy,f,p,e,fx].every(Number.isFinite)&&q>0&&buy>0&&buy<=q&&fx>0&&f>=0&&p>=0&&e>=0;return {q,buy,f,p,e,fx,reserve:$('reserve').checked,valid};}
function priceFor(r,q){
 if(!(q>0))return {price:null,label:'Неверная масса'};
 let idx=-1;
 if(r.source==='Металлоторг')idx=q<1?-1:q<5?0:q<=15?1:2;
 else for(let i=0;i<r.thresholds.length;i++)if(r.thresholds[i]!==null&&q>=r.thresholds[i])idx=i;
 const price=idx>=0?r.tiers[idx]:null;
 if(!(price>0))return {price:null,label:idx<0?'Нет подтверждённого тарифа для этой массы':'Нет цены в применимом диапазоне; запросите поставщика'};
 return {price,label:r.tierLabels[idx]||'Условия объёма неизвестны'};
}
function compute(r,p){const t=priceFor(r,p.buy);if(!p.valid||!r.vat||!t.price)return {...t,net:null,cost:null,floor:null};const net=t.price/1.22,log=(p.f+p.p+p.e)/p.q,base=net+log,reserveAmount=p.reserve?base*.05:0;return {...t,net,log,base,reserveAmount,cost:base+reserveAmount,floor:t.price+log+reserveAmount};}
function stockText(r){return r.stock!==null&&r.stock!==undefined?fmt(r.stock,2)+' т (прайс)':({'InStock':'Есть в прайсе, объём неизвестен','PreOrder':'Под заказ'}[r.availability]||r.availability)+'; тоннаж не подтверждён';}
function render(){const p=params();$('inputError').textContent=p.valid?'':'Введите положительные массу и курс; закупка позиции не должна превышать массу груза; расходы неотрицательны.';const search=$('search').value.trim().toLocaleLowerCase('ru');let matches=DATA.filter(r=>['source','warehouse','group','grade'].every(k=>!$(k).value||r[k]===$(k).value)&&(!search||[r.name,r.size,r.grade,r.detail].join(' ').toLocaleLowerCase('ru').includes(search))).map(r=>({r,c:compute(r,p)}));const sort=$('sort').value;matches.sort((a,b)=>{if(sort==='name')return a.r.name.localeCompare(b.r.name,'ru');const key=sort.startsWith('cost')?'cost':'price',av=a.c[key],bv=b.c[key];if(av===null)return bv===null?0:1;if(bv===null)return -1;return (av-bv)*(sort.endsWith('Desc')?-1:1);});$('count').textContent='Совпадений: '+fmt(matches.length)+' из '+fmt(DATA.length)+'. Показано: '+Math.min(100,matches.length)+'. Цены для партии '+fmt(p.buy,2)+' т; груз в машине '+fmt(p.q,2)+' т.';$('rows').innerHTML=matches.slice(0,100).map(({r,c})=>'<tr class="'+(selected&&r.id===selected.id?'selected':'')+'"><td><b>'+esc(r.name)+'</b><br>'+esc(r.size)+' · '+esc(r.grade)+'<br><small>'+esc(r.detail)+'</small></td><td>'+esc(r.source)+'<br>'+esc(r.warehouse)+'</td><td>'+esc(r.group)+'</td><td class="num">'+fmt(c.price)+'<br><small>'+esc(c.label)+'</small></td><td class="num">'+fmt(c.cost)+'</td><td>'+esc(stockText(r))+'</td><td><button type="button" data-id="'+esc(r.id)+'">Рассчитать</button></td></tr>').join('');renderSelected(p);}
function renderSelected(p){if(!selected){$('calculation').innerHTML='';renderMargin(p,null);return;}const r=selected,c=compute(r,p);let warnings=[];if(!c.price)warnings.push(c.label);if(!r.vat)warnings.push('Включение российского НДС не подтверждено: себестоимость не рассчитывается.');if(r.stock!=null&&r.stock<p.buy)warnings.push('Публичный остаток меньше выбранной партии.');if(r.stock==null)warnings.push('Тоннаж наличия не подтверждён.');if(r.availability==='PreOrder')warnings.push('Позиция под заказ: цена и срок требуют подтверждения.');const safeURL=/^https?:\/\//.test(r.url)?r.url:'';
$('calculation').innerHTML='<h2>'+esc(r.name)+' · '+esc(r.size)+'</h2><p>'+esc(r.grade)+' · '+esc(r.group)+' · '+esc(r.warehouse)+'</p><p>'+esc(r.detail)+'</p><p><a target="_blank" rel="noopener noreferrer" href="'+esc(safeURL)+'">Открыть исходный прайс / карточку</a> · Дата источника: '+esc(r.date||'не указана')+'</p><p>Наличие: '+esc(stockText(r))+'. Не резерв.</p><p>Тариф: '+esc(c.label)+'. Исходные диапазоны: '+r.tierLabels.map((s,i)=>esc(s)+': '+fmt(r.tiers[i])+' RUB/т').join('; ')+'.</p>'+warnings.map(w=>'<p class="warn">'+esc(w)+'</p>').join('')+'<div class="cards"><div class="card">Закупка с НДС, RUB/т<div class="big">'+fmt(c.price)+'</div></div><div class="card">Закупка без возмещаемого НДС, RUB/т<div class="big">'+fmt(c.net)+'</div></div><div class="card">Net-себестоимость известных статей, RUB/т<div class="big">'+fmt(c.cost)+'</div></div><div class="card">Net-себестоимость известных статей, UZS/т<div class="big">'+fmt(c.cost===null?null:c.cost*p.fx)+'</div></div><div class="card">Собственный минимум экспорта DAP, RUB/т<div class="big">'+fmt(c.floor)+'</div></div><div class="card">Собственный минимум экспорта DAP, UZS/т<div class="big">'+fmt(c.floor===null?null:c.floor*p.fx)+'</div></div></div>'+(c.cost!==null?'<p>Закупка без НДС '+fmt(c.net,2)+' + расходы на тонну '+fmt(c.log,2)+(p.reserve?' + резерв 5% ('+fmt(c.reserveAmount,2)+')':'')+' RUB/т. На всю партию: '+fmt(c.cost*p.buy)+' RUB. Вычет российского НДС в цене: '+fmt(c.price-c.net,2)+' RUB/т.</p><p>Минимум своей экспортной цены: закупка с НДС '+fmt(c.price,2)+' + известные расходы '+fmt(c.log,2)+' + резерв '+fmt(c.reserveAmount,2)+' = '+fmt(c.floor,2)+' RUB/т. Неустановленные расходы нужно добавить отдельно.</p><p>При продаже по этому минимуму разница с net-себестоимостью равна возмещаемому НДС: '+fmt(c.floor-c.cost,2)+' RUB/т, то есть 22% от закупки без НДС ('+fmt(c.net,2)+' RUB/т). Это не 22% маржи от выручки или полной себестоимости. Возмещение и отсутствие дополнительных расходов требуют подтверждения.</p>':'<p>Расчёт недоступен до подтверждения цены для выбранной массы и условий НДС.</p>');renderMargin(p,c);}
function renderMargin(p,c){const raw=$('market').value,market=+raw,vat=$('marketVat').value;if(!p.valid||!c||c.cost===null||!raw||!(market>0)||!vat){$('margin').innerHTML='<p class="muted">Для условной маржи нужны выбранная позиция с применимой ценой, корректные параметры, ваша цена продажи и явное указание НДС.</p>';return;}const revenue=market/(vat==='yes'?1.12:1),cost=c.cost*p.fx,diff=revenue-cost;$('margin').innerHTML='<p>Введённая цена: '+fmt(market)+' UZS/т; выручка без НДС: '+fmt(revenue)+' UZS/т.</p><div class="cards"><div class="card">Условная маржа, UZS/т<div class="big">'+fmt(diff)+'</div></div><div class="card">Условная маржа / выручка без НДС<div class="big">'+fmt(diff/revenue*100,1)+'%</div></div></div><p>Разница по партии '+fmt(p.buy,2)+' т: '+fmt(diff*p.buy)+' UZS. Только по введённой цене и известным расходам.</p>';}
$('rows').addEventListener('click',e=>{const b=e.target.closest('button[data-id]');if(b){selected=DATA.find(r=>r.id===b.dataset.id);render();}});
for(const id of ['qty','purchaseQty','freight','paper','extra','fx','reserve','source','warehouse','group','grade','search','sort'])$(id).addEventListener('input',render);
for(const id of ['market','marketVat'])$(id).addEventListener('input',()=>renderSelected(params()));
render();
</script></html>'''

def main():
    from datetime import datetime, timezone
    rows, skipped = build_rows()
    html = TEMPLATE.replace('__DATE__',datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')).replace('__SKIPPED__',str(sum(skipped.values()))+' (Металлоторг '+str(skipped['metallotorg'])+', МС '+str(skipped['mc'])+')').replace('__DATA__',json.dumps(rows,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c'))
    target=ROOT/'price-calculator.html'
    target.write_text(html,encoding='utf-8')
    print(f'{target}: {len(rows)} rows; excluded {skipped}; {target.stat().st_size} bytes')

if __name__ == '__main__':
    main()
