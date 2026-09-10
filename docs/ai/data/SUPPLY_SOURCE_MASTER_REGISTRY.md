# Magic Metal — Master Registry of Factories, Suppliers, Sources and Reference Layers

> MASTER FILE. Do not delete names from this registry merely because a source is not yet integrated. Every entity has an explicit role and verification status.
>
> Core rule: a product is sellable/procureable only when Magic Metal has at least one known real procurement route. A GOST/reference entry alone is NOT a procurement route.

## 1. Core procurement / trading sources

| Entity | Role | Scope | Status |
|---|---|---|---|
| Металлсервис | Supplier / trading source | Common marketable metal positions; base procurement reference | CONFIRMED AS BASE LAYER |
| MC.ru | Market / offer source | Moscow-region stock and prices | ACTIVE INTERNAL SOURCE |
| E-Metall | Aggregator / supplier-offer source | Russia/CIS offers, stock, prices, RFQ | SOURCE; API/partner access TO VERIFY |
| ПоискМеталла | Aggregator / supplier-offer source | Suppliers, offers, RFQ | SOURCE; integration TO VERIFY |
| HardHub | Aggregator / marketplace | Metal offers / supplier comparison | SOURCE; integration TO VERIFY |
| Metalinfo price lists | Supplier price-feed source | Company price lists | SOURCE; access/automation TO VERIFY |

## 2. Metalinfo — separate internal layers

Metalinfo is not a single source. Keep these roles separate:

- PRICE_FEEDS — price lists of individual companies.
- MARKET_BENCHMARK — regional average market prices / indexes.
- PRICE_HISTORY — historical price dynamics.
- MARKET_ANALYTICS — market reports and commentary.
- STEEL_REFERENCE — steel grades and technical reference.

Never treat a Metalinfo benchmark as proof of physical stock.

## 3. Major metallurgical manufacturers / groups

| Entity | Role | Scope | Status |
|---|---|---|---|
| ММК | Manufacturer | Flat steel, long products, pipes/bent profiles and other steel products | CONFIRMED |
| НЛМК | Manufacturer | Flat steel and related products | CONFIRMED |
| Северсталь | Manufacturer | Flat products, pipe products incl. Izhora Pipe Plant | CONFIRMED |
| ЕВРАЗ | Manufacturer | Long products, rails, steel products, pipes and related | CONFIRMED |
| Мечел | Manufacturer / group | Steel, long products, sheet, pipes, forgings, alloys | CONFIRMED |
| ОМК | Manufacturer / group | Pipes, flat products, long products; VMZ etc. | CONFIRMED |
| ТМК | Manufacturer / group | Seamless/welded pipes, OCTG, line pipe, stainless and industrial pipes | CONFIRMED |
| Уральская Сталь | Manufacturer / group | Steel and pipe-related products | CONFIRMED |

## 4. TMK — tube plants

- Волжский трубный завод (ВТЗ) — TMK.
- Северский трубный завод (СТЗ) — TMK.
- Синарский трубный завод (СинТЗ) — TMK.
- ТАГМЕТ / Таганрогский металлургический завод — TMK.
- Первоуральский новотрубный завод (ПНТЗ) — TMK.
- Челябинский трубопрокатный завод (ЧТПЗ) — TMK.
- TMK-INOX — stainless tube direction / group source.

## 5. OMK

- Выксунский металлургический завод (ВМЗ) — OMK.
- OMK Market — official commercial portal / procurement source.

## 6. Severstal

- Ижорский трубный завод (ИТЗ) — large-diameter electric-welded pipes.
- Severstal Market — official commercial portal / stock / ordering source.

## 7. Ural Steel / associated tube plants

- Загорский трубный завод (ЗТЗ).
- Новотроицкий трубопрокатный завод (НТЗ).
- ТД / торговый портал Урал Стали — distribution / procurement channel.

## 8. Independent / specialist tube manufacturers

| Entity | Scope | Status |
|---|---|---|
| Уралтрубпром | Electric-welded round/profile pipes, casing, carbon/low-alloy | CONFIRMED |
| НТЗ «ТЭМ-ПО» | Round/profile pipes, coated pipes, piles | CONFIRMED |
| Ирбитский трубный завод Металлинвест | Pipes | MARKET SOURCE / VERIFY CURRENT ROUTE |
| Нижнетагильский трубный завод Металлинвест | Pipes | MARKET SOURCE / VERIFY CURRENT ROUTE |
| Кольчугинский трубный завод Металлинвест | Pipes | MARKET SOURCE / VERIFY CURRENT ROUTE |
| НМЗ им. Кузьмина | Pipes / tube products | VERIFY CURRENT PROCUREMENT ROUTE |
| Ferrum | Tube products | VERIFY CURRENT PROCUREMENT ROUTE |
| ПО НВТЗ / Нижне-Волжский трубный завод | Tube products | VERIFY CURRENT PROCUREMENT ROUTE |
| СМК СТАМИ | Tube products | VERIFY CURRENT PROCUREMENT ROUTE |
| ИТПЗ | Tube products | VERIFY CURRENT PROCUREMENT ROUTE |
| НТПЗ | Tube products | VERIFY CURRENT PROCUREMENT ROUTE |
| ЛискиМонтажКонструкция | Tube products | VERIFY CURRENT PROCUREMENT ROUTE |
| Королёвский трубный завод | Small/medium tube products | VERIFY CURRENT PROCUREMENT ROUTE |
| Рязанский трубный завод | Small/medium tube products | VERIFY CURRENT PROCUREMENT ROUTE |
| Боровский трубный завод | Tube products | VERIFY CURRENT PROCUREMENT ROUTE |
| Альметьевский трубный завод | Tube products | VERIFY CURRENT PROCUREMENT ROUTE |
| Волгоградский завод малых диаметров | Small-diameter pipes | VERIFY CURRENT PROCUREMENT ROUTE |
| Трубосталь | Tube products | VERIFY CURRENT PROCUREMENT ROUTE |
| Московский трубный завод | Tube products | VERIFY CURRENT PROCUREMENT ROUTE |
| Трубодеталь | Pipe fittings / related products | VERIFY CURRENT PROCUREMENT ROUTE |
| Тольяттинский трубный завод (ТТПЗ) | Tube products | VERIFY CURRENT PROCUREMENT ROUTE |
| Белорусский металлургический завод (БМЗ) | Steel / tube-related products | VERIFY CURRENT PROCUREMENT ROUTE |

## 9. Special steels / non-ferrous / high-value sources

| Entity | Role / scope | Status |
|---|---|---|
| ЧЗСИ | Manufacturer + supplier; heat-resistant, heat-resistant/corrosion-resistant steels, titanium/special products | CONFIRMED |
| КУМЗ | Manufacturer + supplier; aluminium/magnesium/non-ferrous sheets, plates, bars, tubes, profiles, forgings | CONFIRMED |
| Корпорация «Красный Октябрь» | Manufacturer; special/alloy steels | CONFIRMED SOURCE FROM PROJECT |
| Электросталь | Manufacturer; special steels / metallurgy | CONFIRMED SOURCE FROM PROJECT |
| Киберсталь (CYBERSTEEL) | Manufacturer; stainless / special tubes | CONFIRMED SOURCE FROM PROJECT |
| Гайский завод по обработке цветных металлов (ГЗОЦМ) | Manufacturer; copper/non-ferrous products | CONFIRMED SOURCE FROM PROJECT |
| ВСМПО-АВИСМА | Manufacturer; titanium products | CONFIRMED SOURCE FROM PROJECT |
| УМК — Уральская металлообрабатывающая компания | Manufacturer / specialist source | CONFIRMED SOURCE FROM PROJECT |
| ТД KSP Steel / KSP Steel | Supplier / manufacturer group source; stainless / special tube products | CONFIRMED SOURCE FROM PROJECT |

## 10. UralArm / UAZ74

**УралАрм / UAZ74** is a REAL manufacturer + supplier for SDT / pipeline valves.

Roles must remain separate:

- MANUFACTURER — its own SDT / valve products.
- SUPPLIER — procurement route for these products.
- REFERENCE — technical documentation for its own products.

It is NOT a generic metal-stock supplier for unrelated categories.

## 11. Additional historical supplier names — preserve, but re-verify before active use

These names appeared in earlier project research. Do not lose them, but do not automatically treat them as currently active suppliers until a current procurement route is confirmed:

- УМПС / МетПромУрал.
- МеталлСервис Тамбов.
- Мытищинский завод.
- ЛискиТрубПром.
- Загорский ТЗ (if not already classified under ZTZ/Ural Steel).
- Урал Метал База.

## 12. Direct online commercial portals to preserve

- ММК Market — market.mmk.ru.
- NLMK Shop — nlmk.shop.
- OMK Market — market.omk.ru.
- Severstal Market — market.severstal.com.
- EVRAZ Market — evraz.market.
- Mechel-Service — mechelservice.ru.
- Ural Steel trade portal — uralsteel.trade.

These are procurement/commercial channels, not client-facing source labels.

## 13. Reference / nomenclature / technical sources — NOT suppliers by default

| Source | Role |
|---|---|
| 23met | Practical market sizes / nomenclature reference |
| Metalline | Technical information / market prices / nomenclature reference |
| GOST / official standards | Technical and normative reference |
| UAZ74 technical documentation | Technical reference for UralArm SDT products |
| Factory technical catalogues | Technical reference; may also become supplier route only when procurement is confirmed |

## 14. Source-role rules

1. Manufacturer ≠ supplier automatically.
2. Supplier ≠ manufacturer automatically.
3. Aggregator ≠ physical supplier.
4. Benchmark ≠ offer.
5. Reference catalogue ≠ procurement route.
6. One entity may have several roles, but each role must be explicit.
7. Public website never exposes internal source/supplier identity.
8. Product enters public sellable catalog only when at least one real procurement route exists.
9. Default supplier terms for Magic Metal: **pickup from supplier by hired transport company**.
10. Procurement ranking uses landed cost, not supplier price alone.

## 15. Required fields for every future source

```text
entity_name
normalized_name
entity_type
roles[]
product_scopes[]
regions[]
procurement_route
pickup_available
warehouse_locations[]
commercial_portal
price_source
stock_source
technical_source
contact_route
integration_method
integration_status
last_verified_at
reliability_score
notes
```

## 16. Anti-loss rule

When a new factory, supplier, trader, aggregator, price source or technical source is discovered:

1. ADD it here first.
2. Assign role(s).
3. Assign scope.
4. Mark verification status.
5. Only then integrate it into the Procurement Engine.
6. Never delete an old name because it is temporarily inactive; move it to the appropriate historical/unverified status.
