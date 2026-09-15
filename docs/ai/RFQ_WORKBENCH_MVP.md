# RFQ Workbench MVP

## Purpose
Isolated internal manager workbench for turning a client RFQ into a procurement comparison and a client-safe quote. Production remains unchanged.

## Current flow
`RFQ → normalization → Metalinfo search → observed offers → qualification gates → landed cost → ranking → manager approval → client-safe quote`

## Live Metalinfo source
The workbench uses Firecrawl Search API as the acquisition layer for Metalinfo.

- Search is restricted to `metalinfo.ru` and indexed Metalinfo subdomains.
- Multiple size spellings are searched: `х`, `x`, `*`, `×`.
- Product, dimensions, grade and standard are included when available.
- Search results are deduplicated by URL.
- Only results containing the requested dimensions/grade, an explicit parseable price, a supplier identity and a URL become internal offers.
- Accepted price formats are explicit RUB/kg, RUB/t, or thousand RUB.
- Supplier, city and quantity are extracted conservatively.
- Missing quantity is not converted into artificial stock; the offer is marked `on-request`.
- Each offer retains an internal evidence URL and observation timestamp.

## Procurement selection
The ranking layer now separates market ranking from executable procurement selection.

An offer cannot become the automatic winner when its price is missing, availability is explicitly unknown, technical matching requires unresolved clarification, or price/availability evidence is materially stale under the configured freshness policy.

The decision model evaluates landed cost, technical match, availability, lead time, supplier reliability, logistics efficiency, benchmark sanity check, evidence and freshness. Detailed criteria are documented in `docs/ai/PROCUREMENT_SELECTION_CRITERIA.md`.

## What the live test established
Firecrawl search successfully found multiple current/indexed Metalinfo board listings for the test family `бесшовная труба 09Г2С`, including results whose snippets contain the requested 219×10 size. Direct scraping of one Metalinfo bulletin returned HTTP 503/browser-check content, so search-result evidence is retained as `observed`, not as supplier confirmation.

## Benchmark vs offer
`src/lib/procurement/metalinfoBenchmark.ts` is a separate market-monitoring layer. Benchmark values are not executable supplier offers and cannot by themselves create a procurement decision or client quote.

## Live source requirements
- `FIRECRAWL_API_KEY` is required for live application search.
- `RFQ_WORKBENCH_DEMO=true` is available only for deterministic local/demo testing.
- Without demo mode, the API uses the live Metalinfo adapter and does not silently fall back to synthetic offers.

## Deliberate limitations
A Metalinfo listing is an observed market offer, not a verified supplier commitment. Availability, price, terms and logistics must be verified before a commercial quote is released.

The adapter does not invent missing prices, stock, supplier identity or logistics costs.

## Next MVP step
After the single-line winner is reliable, extend the same decision layer to procurement plans: compare one supplier against multi-supplier split procurement using quantity coverage, transport-run count, consolidation and total landed cost. Do not activate this layer until quantity and logistics data are sufficiently reliable.

## Non-goals
- No changes to the Production homepage/catalog.
- No new CRM.
- No autonomous binding quote transmission.
- No invented live supplier prices or availability.
- No replacement of the existing Procurement Engine.
