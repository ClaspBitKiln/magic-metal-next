#!/usr/bin/env python3
import argparse, getpass, json, os, sys, urllib.parse, urllib.request
from xml.sax.saxutils import escape
from datetime import datetime, timezone, timedelta

BASE="https://www.komtender.ru/api/tenders/get/"
PRODUCT_TERMS=["арматур","катанк","св-08","св08","св-08а","св08а","круг","уголок","швеллер","двутавр","балк","лист","рулон","полоса","проволок","оцинков","холоднокатан","горячекатан","прокат","труба","трубопрокат","бесшовн","электросварн","профильн","профнастил"]
MMK_TERMS=["ммк","магнитогорский металлургический комбинат","пао ммк","пао «ммк»"]

def api(path,key):
 req=urllib.request.Request(urllib.parse.urljoin(BASE,path.lstrip("/")),headers={"Accept":"application/json","X-API-KEY":key})
 with urllib.request.urlopen(req,timeout=45) as r:
  d=json.loads(r.read().decode("utf-8"))
  if isinstance(d,dict) and d.get("success") is False: raise RuntimeError(d.get("message","KomTender error"))
  return d

def text(v): return str(v or "").lower()
def has_term(s,terms): return any(t in s for t in terms)
def deadline_dt(v):
 s=str(v or "")
 for fmt in ("%Y-%m-%d %H:%M:%S","%Y-%m-%d %H:%M","%Y-%m-%d"):
  try: return datetime.strptime(s,fmt).replace(tzinfo=timezone(timedelta(hours=3)))
  except ValueError: pass
 return None

def is_match(t):
 c=text((t.get("customer") or {}).get("name"))
 body=" ".join([text(t.get("descr"))]+[" ".join([text(p.get("name")),text(p.get("unit"))]) for p in (t.get("positions") or [])])
 return not has_term(c,MMK_TERMS) and has_term(body,PRODUCT_TERMS)

def tons(p):
 q=p.get("quantity"); u=text(p.get("unit"))
 if q is not None and ("т" in u or "тон" in u): return float(q)
 m=__import__("re").search(r"(\d+(?:[.,]\d+)?)\s*(?:т|тн|тонн|тонны|тонна)\b",text(p.get("name")))
 return float(m.group(1).replace(",",".")) if m else None

def excel_xml(rows):
 cols=["ID","Дата","Срок","Заказчик","ИНН","Цена","Валюта","Количество, т","Позиции","Описание","Место","Регионы","URL"]
 def cell(v): return '<Cell><Data ss:Type="String">'+escape(str(v or ""))+"</Data></Cell>"
 out=['<?xml version="1.0"?>','<?mso-application progid="Excel.Sheet"?>','<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="KomTender"><Table>']
 out.append("<Row>"+"".join(cell(c) for c in cols)+"</Row>")
 for r in rows: out.append("<Row>"+"".join(cell(r.get(c,"")) for c in cols)+"</Row>")
 out.append("</Table></Worksheet></Workbook>")
 return "".join(out)

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--template",default=os.getenv("KOMTENDER_SEARCH_TEMPLATE_ID","1"))
 ap.add_argument("--pages",type=int,default=1)
 ap.add_argument("--scan",type=int,default=25)
 ap.add_argument("--active",action="store_true",default=True)
 ap.add_argument("--out",default="artifacts/komtender_results.xls")
 args=ap.parse_args()
 key=os.getenv("KOMTENDER_API_KEY") or getpass.getpass("KomTender API key: ").strip()
 if not key: sys.exit("API key is required")
 os.makedirs(os.path.dirname(args.out) or ".",exist_ok=True)
 info=api("info",key); info_data=info.get("data",info) if isinstance(info,dict) else {}
 remaining=int(info_data.get("remaining",0) or 0)
 if remaining < 2: sys.exit(f"Insufficient KomTender quota: {remaining}")
 matches=[]; seen=set(); now=datetime.now(timezone(timedelta(hours=3)))
 pages=min(args.pages,max(0,remaining-1))
 calls=1
 for page in range(1,pages+1):
  if remaining-calls < 1: break
  payload=api(f"template/{urllib.parse.quote(args.template)}?page={page}&sort=new-first",key); calls+=1
  data=payload.get("data",[]) if isinstance(payload,dict) else []
  if not data: break
  for short in data[:args.scan]:
   if remaining-calls < 1: break
   tid=str(short.get("id") or "")
   if not tid or tid in seen: continue
   seen.add(tid)
   try: detail=api(urllib.parse.quote(tid),key); calls+=1
   except Exception as e: print("skip",tid,e,file=sys.stderr); calls+=1; continue
   if not isinstance(detail,dict) or not is_match(detail): continue
   dl=deadline_dt(detail.get("dte"))
   if args.active and dl and dl < now: continue
   customer=detail.get("customer") or {}; positions=detail.get("positions") or []; price=detail.get("price") or {}
   qty=[tons(p) for p in positions]; qty=[x for x in qty if x is not None]
   matches.append({"ID":detail.get("id"),"Дата":detail.get("dts"),"Срок":detail.get("dte"),"Заказчик":customer.get("name"),"ИНН":customer.get("inn"),"Цена":price.get("value"),"Валюта":price.get("currency","RUB"),"Количество, т":sum(qty) if qty else "", "Позиции":"; ".join(str(p.get("name") or "") for p in positions),"Описание":detail.get("descr"),"Место":detail.get("place"),"Регионы":detail.get("regions"),"URL":detail.get("url") or f"https://www.komtender.ru/tender/{tid}"})
  print(f"page {page}: scanned {len(data)}, matches total {len(matches)}")
 with open(args.out,"w",encoding="utf-8") as f: f.write(excel_xml(matches))
 print(json.dumps({"ok":True,"rows":len(matches),"api_calls":calls,"file":args.out},ensure_ascii=False))
if __name__=="__main__": main()
