"""Scenario model, not a customs quote. All outputs per metric tonne, RUB unless stated."""
import argparse, csv, json
from pathlib import Path


def model(purchase_gross, market_uzs, *, tonnes=20, rub_uzs=144.53,
          ru_input_credit=True, uz_market_includes_vat=True, uz_input_credit=True,
          freight=450000, documents=30000, extra_per_t=0, reserve_rate=0.05,
          purchase_change=0, market_change=0):
    if not uz_input_credit:
        raise ValueError('Non-creditable Uzbek import VAT requires invoice-based landed model; unsupported in this net-spread function')
    if tonnes <= 0 or rub_uzs <= 0:
        raise ValueError('Positive load and exchange rate required')
    purchase_cash = purchase_gross * (1 + purchase_change)
    purchase_net = purchase_cash / 1.22 if ru_input_credit else purchase_cash
    logistics = (freight + documents) / tonnes
    base = purchase_net + logistics + extra_per_t
    reserve = base * reserve_rate
    cost = base + reserve
    market = market_uzs * (1 + market_change) / rub_uzs
    market_net = market / 1.12 if uz_market_includes_vat and uz_input_credit else market
    contribution = market_net - cost
    return dict(cost_net_rub_t=cost, purchase_cash_rub_t=purchase_cash,
        purchase_input_vat_credit_rub_t=purchase_cash-purchase_net,
        logistics_rub_t=logistics, reserve_rub_t=reserve,
        market_comparable_rub_t=market_net,
        contribution_rub_t=contribution, contribution_per_load=contribution*tonnes,
        margin_pct=contribution/market_net*100,
        markup_pct=contribution/cost*100,
        breakeven_market_uzs_t=cost*rub_uzs*(1.12 if uz_market_includes_vat and uz_input_credit else 1),
        max_purchase_gross_break_even=((market_net/(1+reserve_rate)-logistics-extra_per_t)*(1.22 if ru_input_credit else 1)),
        note='Conditional spread against competitor, NOT achieved profit. Duties/fees not determined; extra_per_t is assumption.')


def main():
    p=argparse.ArgumentParser();p.add_argument('input',type=Path);p.add_argument('--out',type=Path,required=True)
    args=p.parse_args(); rows=json.loads(args.input.read_text())
    scenarios={
      'base_recoverable_vat':{},
      'no_ru_input_vat_credit':{'ru_input_credit':False},
      'uz_price_excludes_vat':{'uz_market_includes_vat':False},
      'load_15t':{'tonnes':15},'load_10t':{'tonnes':10},
      'purchase_plus_5pct':{'purchase_change':.05},
      'purchase_plus_10pct':{'purchase_change':.10},
      'market_minus_5pct':{'market_change':-.05},
      'market_minus_10pct':{'market_change':-.10},
      'ruble_strengthens_10pct':{'rub_uzs':144.53*1.1},
      'ruble_weakens_10pct':{'rub_uzs':144.53*.9},
      'extra_5000_per_t':{'extra_per_t':5000},
      'combined_stress':{'purchase_change':.05,'market_change':-.05,'rub_uzs':144.53*1.05,'extra_per_t':5000},
    }
    out=[]
    for r in rows:
        for name,s in scenarios.items():
            result=model(r['mc_gross_rub_t'],r['competitor_uzs_t'],**s)
            out.append(dict(sku=r['sku'],scenario=name,comparison_quality=r.get('comparison_quality','unknown'),**result))
    args.out.parent.mkdir(parents=True,exist_ok=True)
    with args.out.open('w',newline='') as f:
        w=csv.DictWriter(f,fieldnames=out[0],lineterminator="\n");w.writeheader();w.writerows(out)
    print(f'{len(rows)} comparisons, {len(out)} scenario rows → {args.out}')

if __name__=='__main__':main()
