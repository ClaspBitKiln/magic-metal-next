# Magic Metal Trade Automation

## Purpose

This skill is the operating standard for Magic Metal tender intelligence.

**Non-negotiable objective: do not miss commercially relevant metal tenders.**

The engine must find a real tender -> exact product -> quantity -> supplier/manufacturer -> logistics -> landed cost -> margin -> next action.

## 1. Tender discovery — exhaustive first, ranking second

Do NOT rely on one generic keyword search or the first page of results.

For KomTender:
1. Check API quota with `info`.
2. Use 100-record template pages where quota permits.
3. Scan multiple pages, not only the first 20 records.
4. Fetch full tender cards so positions and quantities are available.
5. Process current/open tenders first.
6. Search by both product family and specification/quantity clues.
7. Keep a separate historical stream for closed tenders.

A tender must not be discarded merely because its title is generic ("Металлопрокат", "Поставка продукции", "Закупка металла"). The positions may contain the commercially important product.

### Why quantity matters

The title may omit the key commercial signal. Therefore extract and normalize:
- quantity;
- unit;
- tonnes;
- piece count;
- dimensions;
- grade;
- GOST/TU.

Explicit quantities such as **140 т / 140 тн / 140 тонн** are high-value discovery signals.

## 2. Thin sheet is a first-class Magic Metal category

**Thin sheet must never be hidden inside a generic "лист/металлопрокат" bucket.**

Always classify and separately surface:
- hot-rolled sheet;
- cold-rolled sheet;
- galvanized sheet;
- coated sheet;
- sheet in coils/rolls;
- structural thin sheet;
- special-grade sheet;
- AISI stainless sheet when it matches the catalog;
- 08ps / St3 / 09G2S / 17G1S and other catalog grades.

Search variants:
- лист;
- листовой прокат;
- лист стальной;
- лист горячекатаный;
- лист холоднокатаный;
- г/к;
- х/к;
- оцинкованный лист;
- рулон;
- 08пс;
- Ст3;
- 09Г2С;
- 17Г1С;
- AISI;
- exact dimensions;
- quantity patterns such as 50 т, 100 т, 140 т, 200 т.

Do not depend on the word "тонкий" being present.

## 3. MMK customer exclusion

The customer filter is:
**customer != MMK**.

It must be based on customer identity, not product text.

Never exclude a tender because MMK is mentioned in the description as a manufacturer, standard, source, or comparison.

## 4. Current/open logic

"Active" means the application deadline has not passed in **Moscow time**.

Always interpret KomTender deadline timestamps as Moscow-local time and convert to an absolute timestamp before filtering.

Do not mark a tender active merely because its calendar date is today.

## 5. Normalize the position

For every relevant position extract:
- product;
- family;
- steel grade;
- GOST/TU;
- dimensions;
- quantity;
- unit;
- quantity in tonnes when possible;
- delivery location;
- deadline.

Unknown remains unknown.

## 6. Suppliers and market map

For every important position search in this order:
1. manufacturer;
2. major distributor/stockist;
3. regional warehouse;
4. alternative producer;
5. import source when economically relevant.

Search the exact combination of product + grade + size + GOST.

Never invent price, stock, supplier access, winner, participant count, or technical equivalence.

## 7. Economics

Normalize:
**purchase price + logistics + mandatory costs = landed cost**

Then show target selling price, gross profit per tonne, total gross profit and margin.

Do not mix VAT-inclusive and VAT-exclusive values.

## 8. Customer history

For promising customers, search previous relevant procurements and identify:
- recurring products;
- quantities;
- purchase intervals;
- repeated seasonal/quarterly cycles.

History is a monitoring signal, not a guaranteed forecast.

## 9. Final output

For each opportunity:

**CLIENT**
- customer / INN
- tender
- deadline
- destination

**PRODUCT**
- exact specification
- quantity
- tonnes
- family

**SUPPLIERS**
- 2–5 serious sources
- manufacturer status
- current price/evidence

**ECONOMICS**
- purchase
- logistics
- landed cost
- client price
- profit
- margin

**ACTION**
- next commercial step

## 10. Evidence

Every important commercial fact needs a source.

A = official manufacturer/direct verified source  
B = established supplier with explicit product evidence  
C = marketplace/search listing requiring confirmation  
D = secondary mention

Separate FACT / SOURCE CLAIM / INFERENCE / UNKNOWN.

## 11. Quality gate

Before returning results, run these checks:
- Did we scan enough pages?
- Did we fetch full cards rather than rely on titles?
- Did we inspect positions?
- Did we extract quantities?
- Did we separately test thin-sheet rules?
- Did we exclude only MMK customers, not MMK products?
- Did we apply Moscow-time deadline logic?
- Did we include generic-title tenders?
- Did we search exact dimensions and quantity patterns?
- Did we preserve direct tender URLs?

If any answer is "no", the search is incomplete.

## Core commands

"Ищи тендера" =
exhaustive KomTender scan -> active/open filter -> exact product normalization -> quantity extraction -> thin-sheet priority -> supplier search -> logistics -> economics.

"Ищи тонкий лист" =
same workflow, but thin-sheet is a dedicated first-class filter and quantity-first search.

"Ищи глубоко" =
add alternative manufacturers, regional sources, warehouses, imports, customer history and repeated procurement cycles.

"Проверь клиента" =
analyze relevant customer procurement history.

"Сделай сделку" =
customer + tender + supplier market + logistics + trade economics.
