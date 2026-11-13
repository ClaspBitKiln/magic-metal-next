import json,csv,runpy
from pathlib import Path
root=Path(__file__).parent
mc=json.loads((root/'mc-prices-normalized.json').read_text())
uz=list(csv.DictReader((root/'uz-public-prices.csv').open(encoding='utf-8-sig')))
rows=[]
def add(label,needle,mprice,comp_index,quality):
    x=next(r for r in mc if needle in r['url'] and r['price_rub_t']==mprice)
    u=uz[comp_index]
    rows.append({'sku':label,'mc_gross_rub_t':mprice,'competitor_uzs_t':float(u['price_uzs_per_t']),
      'mc_url':x['url'],'competitor_url':u['url'],'comparison_quality':quality})
for t,p in [(20,65490),(30,66490),(40,66490),(50,68990),(60,76990)]:
    idx={20:0,30:2,40:3,50:4,60:5}[t]
    add(f'Лист {t}x1500x6000 Ст3 / 3сп-5',f'list_goryachekatanyy_{t}x1500x6000_',p,idx,'same_geometry; mc St3 broad, UZ 3sp-5; UZ VAT/date unknown')
add('Лист 20x1500x6000 Ст3 / Stal Trade Asia','list_goryachekatanyy_20x1500x6000_',65490,13,'close grade; UZ from-price incl VAT, not best market price')
add('Балка 40Б1 С255 / 3пс 12м','balka_40_b1_',83000,6,'grade/standard/rolling comparability NOT confirmed; UZ VAT/date unknown')
add('Балка 40К2 С255 / 3пс 12м','balka_40_k2_',93200,9,'grade/standard comparability NOT confirmed; UZ VAT/date unknown')
add('Швеллер 30У Ст3 / 3пс-6 12м','shveller_30_u_',139000,10,'UZ combines U/P; execution/grade not exact; VAT/date unknown')
add('Уголок 160x160x10 С255 / 3сп-5','ugolok_160x10_',132750,11,'grade not exact; UZ unit-price conflict 19.35 vs17.835m')
# Lower published cross-check is a stress assumption, not verified fresh quote.
rows.append({**rows[-1],'sku':'Уголок160 — нижний конфликтующий ориентир','competitor_uzs_t':17835000,'comparison_quality':'CONFLICT cross-check from unit arithmetic and 2025 PDF; NOT current quote'})
(root/'comparisons.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
model=runpy.run_path(str(root/'calculate.py'))['model']
summary=[]
for r in rows:
    b=model(r['mc_gross_rub_t'],r['competitor_uzs_t']); s=model(r['mc_gross_rub_t'],r['competitor_uzs_t'],uz_market_includes_vat=False)
    summary.append(dict(r,net_purchase=r['mc_gross_rub_t']/1.22,cost_with_5pct_reserve=b['cost_net_rub_t'],
      spread_if_uz_incl_vat=b['contribution_rub_t'],spread_if_uz_excl_vat=s['contribution_rub_t'],
      max_buy_for_break_even=b['max_purchase_gross_break_even'],breakeven_uz_incl_vat=b['breakeven_market_uzs_t'],
      spread_if_our_price_5pct_below_market=model(r['mc_gross_rub_t'],r['competitor_uzs_t'],market_change=-.05)['contribution_rub_t']))
with (root/'comparison-summary.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=summary[0],lineterminator="\n");w.writeheader();w.writerows(summary)
for x in summary:print(x['sku'],round(x['cost_with_5pct_reserve']),round(x['spread_if_uz_incl_vat']),round(x['spread_if_uz_excl_vat']),round(x['breakeven_uz_incl_vat']))
# Floors for all available procurement rows, not selling prices / proof of profitability.
priced={r['url']:r for r in mc if r['price_rub_t'] is not None}
floors=[]
for r in priced.values():
 c=r['price_rub_t']/1.22+24000
 floors.append(dict(sku=r['name'],grade=r['grade'],mc_price_gross_rub_t=r['price_rub_t'],purchase_net_rub_t=r['price_rub_t']/1.22,
  cash_per_20t_before_import=r['price_rub_t']*20+480000,cost_before_extras_rub_t=c,
  conditional_export_price_10pct_margin_rub_t=c*1.05/.9,
  conditional_uz_equivalent_incl_12pct=c*1.05/.9*144.53*1.12,
  price_with_extra5000_rub_t=(c+5000)*1.05/.9,
  url=r['url'],status='CALCULATION ONLY; unknown fees/duties/origin; not price approved for publication'))
with (root/'procurement-price-floors.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.DictWriter(f,fieldnames=floors[0],lineterminator="\n");w.writeheader();w.writerows(floors)
