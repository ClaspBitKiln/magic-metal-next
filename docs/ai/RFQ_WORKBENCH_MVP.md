# RFQ Workbench MVP

## Purpose
Isolated manager workbench for testing the complete Magic Metal flow without changing the Production website:

`customer RFQ → normalized request → procurement search → ranked offers → manager approval → client-safe quote`

## Branch
`rfq-workbench-mvp`

Based on Production commit `86d72207db1998bc755d5b9781fbc80d5f986d6e`.

## Current MVP
- `/rfq-workbench` — isolated manager UI.
- `/api/rfq-workbench/search` — invokes the existing `runProcurement()` engine.
- Live `metalinfo-price-list` adapter searches Metalinfo through Firecrawl Search API.
- The adapter converts only results with requested dimensions/grade, an explicitly parseable price and an extracted supplier identity into internal offers.
- Each parsed offer keeps internal `evidenceUrl` / `evidenceNote` for verification.
- The client-safe quote preview remains separate from source and purchase economics.

## Metalinfo benchmark vs offer
`src/lib/procurement/metalinfoBenchmark.ts` remains a separate market-monitoring layer. Benchmark values are not executable supplier offers and cannot by themselves create a procurement decision or client quote.

## Live source requirements
- `FIRECRAWL_API_KEY` is required for live Metalinfo search.
- `RFQ_WORKBENCH_DEMO=true` is available only for deterministic local/demo testing.
- Without demo mode, the API uses the live Metalinfo adapter and fails clearly when the live source is not configured; it does not silently fall back to synthetic offers.

## Evidence and conservative parsing
- Search is restricted to `metalinfo.ru` / `ww1.metalinfo.ru`.
- Query is generated from normalized product, dimensions, grade and standard.
- Price is accepted only when explicitly expressed as RUB/kg, RUB/t or thousand RUB.
- Supplier identity is required; otherwise the result is rejected.
- Missing quantity does not become artificial stock; the offer is marked `on-request`.
- Source date is taken from the result text when available; otherwise the observation timestamp is used.

## Deliberate limitation
A parsed Metalinfo listing is still an observed market offer, not a verified supplier commitment. Availability, price and logistics must be verified before a commercial quote is released.

## Manager acceptance scenario
1. Open RFQ-1024.
2. Click `Найти варианты`.
3. Confirm the Procurement Engine runs.
4. Review ranked options by landed cost, availability, lead time and risk.
5. Select an option.
6. Set/approve selling price.
7. Generate client-safe quote.
8. Later connect send/approval and DealResults only after the deterministic flow is accepted.

## Non-goals
- No changes to the Production homepage/catalog.
- No new CRM.
- No autonomous binding quote transmission.
- No invented live supplier prices or availability.
- No replacement of the existing Procurement Engine.
