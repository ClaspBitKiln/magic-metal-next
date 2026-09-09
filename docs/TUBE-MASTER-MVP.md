# Tube Master — MVP architecture

## Goal

Create a single normalized technical layer for tubes so a manager can search by diameter, wall thickness, tube type, grade and standard, then see:

1. which factories can manufacture the requested item (`CAPABILITY`);
2. which commercial sources currently list an offer (`OFFER`);
3. which offers have verified current stock (`AVAILABILITY` after freshness/commercial checks).

Supplier identity is an internal sourcing attribute. It is never exposed in the public customer catalog.

## Core rule

`CAPABILITY != AVAILABILITY != OFFER`

A factory being able to make `219×8` does not mean that `219×8` is in stock today. A marketplace listing is a market signal until the current commercial condition is verified.

## Normalized product key

`type + outside_diameter_mm + wall_mm + grade + standard + execution + length_class`

For welded/profile products, `diameter` may be replaced by `width_mm + height_mm` while keeping the same search model.

## Factory capability record

Required fields:

- `factoryId`
- `factoryName`
- `region`
- `tubeFamily`
- `diameterMinMm`
- `diameterMaxMm`
- `wallMinMm`
- `wallMaxMm`
- `specificSizes[]` when the manufacturer's published table is discrete
- `grades[]`
- `standards[]`
- `lengthRange`
- `sourceUrl`
- `evidenceLevel` (`official-table`, `official-catalog`, `secondary-confirmation`)
- `checkedAt`
- `notes`

## Commercial offer record

Required fields:

- `sourceCode`
- `externalKey`
- `productType`
- `diameterMm`
- `wallMm`
- `grade`
- `standard`
- `quantity`
- `unit`
- `price`
- `currency`
- `vatMode`
- `location`
- `availabilityState`
- `observedAt`
- `sourceUrl`

## Source roles

### Factory / primary capability

Official factory catalogues and dimensional tables establish production capability.

### Commercial offer

E-Metall is a priority commercial offer aggregator. Its records can contain supplier, producer, stock, location, price and update timestamp and therefore are suitable for offer discovery and freshness checks.

### Market signal / discovery

23met and Metal100 expand discovery, price signals and supplier discovery but must not be treated as proof of current stock without verification.

### Reference assortment / price source

Metallservice is a reference assortment and one price source. It is not a market-price floor and is not assumed to be the cheapest source.

## Initial factory seed

The first verified factory layer should include, at minimum, regional and large producers already identified by the project:

- НТПЗ, Ногинск — welded round/profile tubes; official published discrete diameter/wall tables.
- Металл Сервис, Тамбов — welded tube production; additional commercial stock is discoverable through E-Metall.
- Уралтрубпром — round welded `D 114–630 mm`, wall `3–22 mm`, plus large-section profile tubes.
- ЗТЗ — large-diameter pipe production and catalog/stock layer.
- НТЗ «ТЭМ-ПО» — welded round/profile assortment; official catalog is used for capability verification.
- TMK plants (e.g. ЧТПЗ/ВТЗ/СинТЗ) — separate plant-level capabilities, not one generic `TMK` row.
- КЗСС, Киберсталь, Трубы Урала — stainless/special seamless families where applicable.

The list is intentionally expandable; discovery must continue by region and by tube family.

## Search behavior

The manager search should support these forms:

- `219×8`
- `219×8 ст20 ГОСТ 8732`
- `ГОСТ 8732 Ø219`
- `Ø219` then list all available walls
- factory → all supported sizes

Sort offers by `commercialScore`, not by raw lowest public price. Score inputs may include price, logistics, lead time, minimum lot, documentation, location, freshness and supply risk.

## Public vs internal

Public catalog may show:

- technical specification;
- `В наличии` / `Под заказ` / `Срок уточняется`;
- request CTA.

Internal manager view may additionally show:

- supplier/source;
- purchase price;
- stock quantity;
- warehouse;
- freshness;
- logistics estimate;
- commercial score;
- target customer price;
- margin.

## API roadmap

The first implementation is API-ready but can operate from snapshots/imports.

Adapters should implement:

`fetch -> parse -> normalize -> validate -> upsert -> freshness -> score`

Planned adapters:

- `e-metall`
- `23met`
- `metal100`
- `metalservice`
- factory-site parsers
- future official supplier APIs

No public API result should directly overwrite verified stock without passing source/freshness validation.
