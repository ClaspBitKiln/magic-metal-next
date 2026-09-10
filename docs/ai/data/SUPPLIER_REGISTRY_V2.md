# Magic Metal — Supplier Registry V2

> Internal registry. Supplier layers are never exposed to clients.

## Objective
Convert the existing master list into an operational registry used by Procurement Engine agents. Every entity is classified by role, product scope, procurement route and verification state.

## Status model

- `confirmed` — current real procurement route is confirmed.
- `verify` — entity is known, but current commercial route requires verification.
- `reference` — technical/nomenclature/market reference only.
- `historical` — preserve for history; do not use automatically.
- `disabled` — explicitly excluded from procurement.

## Operational source layers

### L1 — Base procurement
**Металлсервис**
- roles: supplier, trading source, base reference
- scope: common marketable metal positions
- priority: primary baseline
- route: supplier pickup → hired transport → client
- status: confirmed

### L2 — Moscow market / stock
**MC.ru**
- roles: market offer/stock source
- scope: Moscow-region offers
- status: active internal source
- rule: snapshot/market signal is not automatically equivalent to physically confirmed stock

### L3 — Aggregators / offer discovery
**E-Metall, ПоискМеталла, HardHub**
- roles: discovery / offer aggregation
- status: integration to verify where required
- rule: aggregator result requires verification before final procurement decision

### L4 — Price intelligence
**Metalinfo**
- PRICE_FEEDS: supplier price lists
- MARKET_BENCHMARK: market benchmark
- PRICE_HISTORY: historical prices
- MARKET_ANALYTICS: market analytics
- STEEL_REFERENCE: technical steel reference
- rule: benchmark never proves stock

### L5 — Major manufacturers
**ММК, НЛМК, Северсталь, ЕВРАЗ, Мечел, ОМК, ТМК, Уральская Сталь**
- role: manufacturer / potential direct commercial route
- direct procurement status: verify per product and route
- never assume manufacturer = available stock

### L6 — Tube specialists
TMK plants: ВТЗ, СТЗ, СинТЗ, ТАГМЕТ, ПНТЗ, ЧТПЗ, TMK-INOX.
OMK: ВМЗ, OMK Market.
Severstal: ИТЗ, Severstal Market.
Ural Steel: ЗТЗ, НТЗ, Ural Steel trade portal.
Independent: Уралтрубпром, НТЗ ТЭМ-ПО and other registry entities.
- scope: pipes/tube products
- route: verify by exact specification

### L7 — Special steels / non-ferrous — CHZSI
**ЧЗСИ**
- roles: manufacturer, specialist supplier
- internal layer code: `chzsi`
- scope: heat-resistant, corrosion-resistant, special steels, titanium/special products according to current catalogue
- route: direct commercial inquiry / confirmed stock or production order
- status: confirmed entity; individual product availability must be verified
- technical source: official technical/catalogue materials
- client rule: source identity hidden

### L8 — Non-ferrous — KUMZ
**КУМЗ**
- roles: manufacturer, specialist supplier
- internal layer code: `kumz`
- scope: aluminium/magnesium and other non-ferrous products including sheets, plates, bars, tubes, profiles, forgings according to current product range
- route: direct commercial inquiry / stock or production order
- status: confirmed entity; individual product availability must be verified
- technical source: official product/technical materials
- client rule: source identity hidden

### L9 — Special metallurgy
Красный Октябрь, Электросталь, Киберсталь, ГЗОЦМ, ВСМПО-АВИСМА, УМК, KSP Steel.
- specialist source
- exact product route must be verified before use

### L10 — SDT / valves
**УралАрм / UAZ74**
- roles: manufacturer + supplier + technical reference
- scope: SDT / pipeline valves and own products
- rule: not generic stock source for unrelated metal products

## Registry record contract

```ts
type SupplierRegistryRecord = {
  id: string
  entityName: string
  normalizedName: string
  entityType: 'manufacturer' | 'supplier' | 'trader' | 'aggregator' | 'marketplace' | 'reference'
  roles: string[]
  layer: string
  productScopes: string[]
  regions: string[]
  procurementRoute: 'pickup' | 'delivery' | 'direct-rfQ' | 'production-order' | 'marketplace' | 'reference-only'
  pickupAvailable: boolean | 'unknown'
  commercialPortal?: string
  priceSource?: string
  stockSource?: string
  technicalSource?: string
  integrationMethod: 'api' | 'file' | 'web' | 'manual-rfq' | 'none'
  integrationStatus: 'active' | 'planned' | 'verify' | 'manual'
  verificationStatus: 'confirmed' | 'verify' | 'reference' | 'historical' | 'disabled'
  lastVerifiedAt?: string
  reliabilityScore?: number
  notes?: string
}
```

## Decision rules

1. Discovery agent may use `verify` sources to find leads, but Verification Agent must confirm them.
2. Ranking agent may use only offers with sufficient evidence for the requested decision.
3. `reference` records never become offers.
4. Manufacturer records require a product-specific commercial route before being considered procurement-ready.
5. `chzsi` and `kumz` are independent internal layers; there is no client-facing supplier selector.
6. New suppliers are appended, not substituted for existing records.
7. Every active source must have freshness metadata.
8. Procurement route is evaluated per SKU/specification, not just per supplier.
