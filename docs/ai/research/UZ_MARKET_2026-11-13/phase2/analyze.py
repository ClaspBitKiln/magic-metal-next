from pathlib import Path
import json,re,csv,runpy
p=Path(__file__).parent
s=(p/'uz/staltrade-tube-price.md').read_text()
clean=lambda v: re.sub('<[^>]+>',' ',v).split('  ')[0].strip()
uz=[];section=''
for line in s.splitlines():
 if not line.startswith('|'):continue
 c=[x.strip() for x in line.strip('|').split('|')]
 if '**' in c[0]:section=c[0].split('<br>')[0].strip('* ')
 if len(c)<8 or not re.match(r'^\d+<br>',c[0]):continue
 v=[x.split('<br>')[0].strip().replace('\\*','x') for x in c]
 money=re.sub(r'\D','',v[-1])
 if not money:continue
 name=v[2];g=v[3];seamless=any(t in (section+' '+name).lower() for t in ['бесшов','б/ш'])
 forming='hot' if ('8732' in section or 'г/д' in name) else 'cold' if ('8734' in section or 'х/д' in name) else None
 dims=re.search(r'(\d+(?:[.,]\d+)?)\s*[xх×]\s*(\d+(?:[.,]\d+)?)',name)
 uz.append(dict(name=name,grade=g,section=section,seamless=seamless,forming=forming,
  size=[float(x.replace(',','.')) for x in dims.groups()] if dims else None,
  manufacturer=v[1],length_m_raw=v[4],mass_kg_m_raw=v[5],price_uzs_t=float(money),vat_included=True,
  source_url='https://staltrade.uz/price/',price_date=None,captured='2026-11-13',status='informational public price, actual quote required'))
(p/'uz/staltrade-prices-normalized.json').write_text(json.dumps(uz,ensure_ascii=False,indent=2))
mt=json.loads((p/'metallotorg/normalized-all-chel-moscow.json').read_text());pairs=[]
model=runpy.run_path(str(p.parent/'calculate.py'))['model']
for u in uz:
 if not u['seamless'] or not u['size'] or not re.fullmatch(r'ст\.?\s*20',u['grade'].lower()):continue
 for r in mt:
  if r['family']!='seamless_pipe' or not r['price_over_15_rub_t'] or r.get('stock_t',0)<20:continue
  n=r['product_name'].lower();st=r['standard_raw'].lower();sz=r['size_raw']
  if not re.search(r'ст\.?\s*20(?:\s|$)',n):continue
  m=re.search(r'(\d+(?:[.,]\d+)?)\s*[xх×*]\s*(\d+(?:[.,]\d+)?)',sz)
  if not m or [float(x.replace(',','.')) for x in m.groups()]!=u['size']:continue
  forming='hot' if '8732' in st else 'cold' if '8734' in st else None
  if forming!=u['forming']:continue
  if any(x in st+n+r['description_raw'].lower() for x in ['китай','иран']):origin='explicit non-RF, preference not assumed'
  else:origin='not established'
  c=model(r['price_over_15_rub_t'],u['price_uzs_t']);z=model(r['price_over_15_rub_t'],u['price_uzs_t'],market_change=-.1,extra_per_t=5000)
  pairs.append(dict(sku=u['name'],grade='20',size=r['size_raw'],branch=r['branch'],stock_t=r['stock_t'],purchase_gross_rub_t=r['price_over_15_rub_t'],
    cost_with_5pct_rub_t=c['cost_net_rub_t'],uz_public_gross_uzs_t=u['price_uzs_t'],spread_at_public_ceiling_rub_t=c['contribution_rub_t'],
    spread_10pct_discount_extra5000=z['contribution_rub_t'],
    dap_invoice_if_buyer_landed_10pct_below_public=u['price_uzs_t']*.9/144.53/1.12,
    rf_standard=r['standard_raw'],rf_description=r['description_raw'],origin=origin,
    rf_source=r['source_url'],uz_source=u['source_url'],status='conditional chain spread; no current quote/origin/import duties+conformity confirmed'))
with (p/'pipe-comparisons.csv').open('w',encoding='utf-8-sig',newline='') as f:
 if pairs:
  w=csv.DictWriter(f,fieldnames=pairs[0],lineterminator='\n');w.writeheader();w.writerows(pairs)
(p/'pipe-comparisons.json').write_text(json.dumps(pairs,ensure_ascii=False,indent=2))
print('UZ source rows',len(uz),'seamless',sum(x['seamless'] for x in uz),'matched quotes stocked>=20t',len(pairs))
for r in sorted(pairs,key=lambda x:x['spread_10pct_discount_extra5000'],reverse=True)[:10]:print(r['sku'],r['branch'],r['purchase_gross_rub_t'],round(r['cost_with_5pct_rub_t']),round(r['spread_at_public_ceiling_rub_t']),round(r['spread_10pct_discount_extra5000']))
