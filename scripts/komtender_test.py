#!/usr/bin/env python3
import argparse, getpass, json, sys, urllib.parse, urllib.request
from xml.sax.saxutils import escape
BASE="https://www.komtender.ru/api/tenders/get/"
PRODUCT_TERMS=["арматур","катанк","св-08","св08","св-08а","св08а","круг","уголок","швеллер","двутавр","балк","лист","рулон","полоса","проволок","оцинков","холоднокатан","горячекатан","прокат","труба","трубопрокат","бесшовн","электросварн","профильн","профнастил"]
MMK_TERMS=["ммк","магнитогорский металлургический комбинат","пао ммк","пао «ммк»"]
def api(path,key):
 req=urllib.request.Request(urllib.parse.urljoin(BASE,path.lstrip("/")),headers={"Accept":"application/json","X-API-KEY":key})
 with urllib.request.urlopen(req,timeout=30) as r:
  d=json.loads(r.read().decode("utf-8"))
  if isinstance(d,dict) and d.get("success") is False: raise RuntimeError(d.get("message","KomTender error"))
  return d
def text(v): return str(v or "").lower()
def has_term(s,terms): return any(t in s for t in terms)
def is_match(t):
 c=text((t.get("customer") or {}).get("name"))
 body=" ".join([text(t.get("descr"))]+[" ".join([text(p.get("name")),text(p.get("unit"))]) for p in (t.get("positions") or [])])
 return not has_term(c,MMK_TERMS) and has_term(body,PRODUCT_TERMS)
def excel_xml(rows):
 cols=["ID","Дата","Срок","Заказчик","ИНН","Цена","Валюта","Позиции","Описание","Место","Регионы","URL"]
 def cell(v): return '<Cell><Data ss:Type="String">'+escape(str(v or ""))+"</Data></Cell>"
 out=['<?xml version="1.0"?>','<?mso-application progid="Excel.Sheet"?>','<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="KomTender"><Table>']
 out.append("<Row>"+"".join(cell(c) for c in cols)+"</Row>")
 for r in rows: out.append("<Row>"+"".join(cell(r.get(c,"")) for c in cols)+"</Row>")
 out.append("</Table></Worksheet></Workbook>")
 return "".join(out)
def main():
 ap=argparse.ArgumentParser(); ap.add_argument("--template",default="1"); ap.add_argument("--pages",type=int,default=3); ap.add_argument("--scan",type=int,default=100); ap.add_argument("--out",default="komtender_mmk_customers.xls"); args=ap.parse_args()
 key=getpass.getpass("KomTender API key: ").strip()
 if not key: sys.exit("API key is required")
 matches=[]
 for page in range(1,args.pages+1):
  payload=api(f"template/{urllib.parse.quote(args.template)}?page={page}&sort=new-first",key); data=payload.get("data",[]) if isinstance(payload,dict) else []
  for short in data[:args.scan]:
   try: detail=api(str(short.get("id")),key)
   except Exception as e: print("skip",short.get("id"),e,file=sys.stderr); continue
   if not isinstance(detail,dict) or not is_match(detail): continue
   customer=detail.get("customer") or {}; positions=detail.get("positions") or []; price=detail.get("price") or {}
   matches.append({"ID":detail.get("id"),"Дата":detail.get("dts"),"Срок":detail.get("dte"),"Заказчик":customer.get("name"),"ИНН":customer.get("inn"),"Цена":price.get("value"),"Валюта":price.get("currency","RUB"),"Позиции":"; ".join(text(p.get("name")) for p in positions if p.get("name")),"Описание":detail.get("descr"),"Место":detail.get("place"),"Регионы":detail.get("regions"),"URL":detail.get("url")})
  print(f"page {page}: scanned {len(data)}, matches total {len(matches)}")
 with open(args.out,"w",encoding="utf-8") as f: f.write(excel_xml(matches))
 print(f"Excel file: {args.out}; rows: {len(matches)}")
if __name__=="__main__": main()
