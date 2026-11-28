import json,re,csv
from pathlib import Path
p=Path(__file__).parent
files=[p/'catalog-sample.json']
if(p/'focus-sample.json').exists():files.append(p/'focus-sample.json')
pages=[]
for f in files:pages.extend(json.loads(f.read_text(encoding='utf-8-sig')))
def number(s):
 s=re.sub(r'\s*₽\s*за\s*шт$', '', s.split('-->')[0].strip()).replace('\xa0',' ').replace(' ','').replace(',','.')
 return float(s) if re.fullmatch(r'\d+(?:\.\d+)?',s) else None
rows=[];coverage=[]
for page in pages:
 ctx=' '.join(page.get('unit_context',[]));unit='kg' if 'Цена за кг' in ctx else 'tonne' if 'Цена за т ' in ctx else 'piece' if 'Цена за шт' in ctx else 'unverified'
 heads=page.get('headers',[]);family=page.get('path','').split('/')[0]
 coverage.append(dict(id=page['id'],url=page['url'],response_url=page.get('response_url'),status=page.get('status'),row_count=len(page.get('rows',[])),unit=unit,vat_included=page.get('vat_included'),sampling='captured category page, not entire catalog',error=page.get('error')))
 for row in page.get('rows',[]):
  c=row.get('cells',[])
  if len(c)<10:continue
  a,b,z=[number(c[k]) for k in [7,8,9]];factor=1000 if unit=='kg' else 1
  gross=z*factor if z is not None and unit in ('kg','tonne') else None
  rows.append(dict(source='mc.ru',category=family,source_page=page['url'],url=row['url'],captured_at=page.get('captured_at'),region=page['region'],warehouse=c[4],
   name=c[0],size=c[1],grade=c[2] if len(heads)>2 and heads[2]=='Марка' else None,wall_mm=c[2] if len(heads)>2 and 'тенка' in heads[2] else None,
   length_or_condition_raw=c[3],availability=row['availability'],price_unit=unit,
   price_tier1_raw=a,price_tier2_raw=b,price_tier3_raw=z,price_tier_headers=[h for h in heads if re.match(r'^от\s+\d',h,re.I)][:3],
   gross_rub_t=gross,net_rub_t=gross/1.22 if gross is not None and page.get('vat_included') else None,
   vat_included=page.get('vat_included'),stock_confirmed_t=None,origin_country=None,
   caution='Highest displayed volume tier; verify actual ordered qty/grade/stock/origin. Page sampling; no 20t reservation.'))
(p/'normalized.json').write_text(json.dumps(rows,ensure_ascii=False))
(p/'coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2))
with (p/'normalized.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=rows[0],lineterminator='\n');w.writeheader();w.writerows(rows)
print(f'{len(pages)} captured pages, {len(rows)} rows, {sum(x["gross_rub_t"] is not None for x in rows)} numeric normalized prices; not unique SKU count')
