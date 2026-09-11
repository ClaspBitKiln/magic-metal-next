# RFQ Workbench MVP

## Purpose
Isolated manager workbench for turning a client RFQ into a procurement comparison and a client-safe quote. Production remains unchanged.

## Current flow
`RFQ → normalization → Metalinfo search → observed offers → landed cost → ranking → manager approval → client-safe quote`

## Branch
`rfq-workbench-mvp`

Based on Production commit `86d72207db1998bc755d5b9781fbc80d5f986d6e`.

## Live Metalinfo source
The workbench now uses Firecrawl Search API as the live acquisition layer for Metalinfo.

- Search is restricted to `metalinfo.ru` and its indexed subdomains used by Metalinfo results.
- Multiple size spellings are searched: `х`, `x`, `*`, `×`.
- Product, dimensions, grade and standard are included in the query when available.
- Search results are deduplicated by URL.
- Only results containing the requested dimensions/grade, an explicit parseable price, a supplier identity and a URL become internal offers.
- Explicit price formats accepted: RUB/kg, RUB/t, or thousand RUB.
- Supplier, city and quantity are extracted conservatively from result text.
- Missing quantity is not converted into artificial stock; the offer is marked `on-request`.
- Each offer retains an internal evidence URL and observation timestamp.

## Direct-fetch limitation
Firecrawl Search can find Metalinfo listings even when direct page fetching is blocked by Metalinfo's browser check. A direct scrape of a current bulletin returned HTTP 503/browser-check content, so the adapter treats search snippets as observed evidence and does not claim supplier confirmation.

## Benchmark vs offer
`src/lib/procurement/metalinfoBenchmark.ts` remains a separate market-monitoring layer. Benchmark values are not executable supplier offers and cannot by themselves create a procurement decision or client quote.

## Live source requirements
- `FIRECRAWL_API_KEY` is required for live application search.
- `RFQ_WORKBENCH_DEMO=true` is available only for deterministic local/demo testing.
- Without demo mode, the API uses the live Metalinfo adapter and does not silently fall back to synthetic offers.

## Deliberate limitations
A Metalinfo listing is an observed market offer, not a verified supplier commitment. Availability, price, terms and logistics must be verified before a commercial quote is released.

The adapter does not invent missing prices, stock, supplier identity or logistics costs.

## Manager acceptance scenario
1. Open RFQ-1024.
2. Click `Найти варианты`.
3. Confirm the Procurement Engine runs.
4. Review ranked options by landed cost, availability, lead time and risk.
5. Select an option.
6. Set/approve selling price.
7. Generate client-safe quote.

## Non-goals
- No changes to the Production homepage/catalog.
- No new CRM.
- No autonomous binding quote transmission.
- No invented live supplier prices or availability.
- No replacement of the existing Procurement Engine.
