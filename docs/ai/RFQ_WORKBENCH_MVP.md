# RFQ Workbench MVP

## Purpose
Isolated manager workbench for testing the complete Magic Metal flow without changing the Production website:

`customer RFQ → normalized request → procurement search → ranked offers → manager approval → client-safe quote`

## Branch
`rfq-workbench-mvp`

Based on Production commit `86d72207db1998bc755d5b9781fbc80d5f986d6e`.

## Current MVP
- `/rfq-workbench` — isolated manager UI.
- `/api/rfq-workbench/search` — deterministic test endpoint that invokes the existing `runProcurement()` engine.
- Test adapter returns three synthetic offers so the complete ranking and landed-cost path can be exercised without inventing live supplier data.
- Client-facing quote preview hides source, purchase price and internal procurement data.

## Deliberate limitation
The test adapter is not a real supplier connector and must never be treated as live market data. The next integration step is to replace it with approved adapters from the Master Registry, one source at a time, with freshness/evidence controls.

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
