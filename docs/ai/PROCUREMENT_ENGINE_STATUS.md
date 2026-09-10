# Procurement Engine — Working Core Status

## Implemented

The repository now contains an executable domain core for procurement orchestration:

- typed normalized RFQ / offer / landed-cost / decision contracts;
- deterministic RFQ line normalization;
- source adapter contract;
- parallel source search orchestration;
- no-procurement-route detection;
- clarification detection when grade/standard is absent;
- landed-cost calculation including supplier charges, pickup, freight, handling, customs and destination costs;
- explainable offer ranking;
- exact/approved-alternative/clarification-required/non-qualifying match states;
- deterministic integration tests.

## Current files

- `src/lib/procurement/types.ts`
- `src/lib/procurement/normalize.ts`
- `src/lib/procurement/landedCost.ts`
- `src/lib/procurement/ranking.ts`
- `src/lib/procurement/engine.ts`
- `tests/int/procurement-engine.int.spec.ts`

## Deliberate non-fakes

No live supplier API is fabricated. The engine accepts adapters and can run against fixtures now. Live connectors are added only after their permitted access mechanism is verified.

## Remaining production layers

1. Connect normalized adapters to the existing Payload supplier/offer collections.
2. Build official/authorized source adapters and verified marketplace adapters.
3. Add logistics lanes and configurable tariffs, especially Russia → Uzbekistan/CIS.
4. Add supplier reliability history and procurement history.
5. Add internal procurement workspace.
6. Connect RFQ attachments and email intake.
7. Connect quote generation while enforcing public/private separation.
8. Add live integration tests against permitted sandbox/API endpoints.

## Business invariant

A reference/nomenclature entry is never enough to make a product sellable. At least one credible procurement route is required.
