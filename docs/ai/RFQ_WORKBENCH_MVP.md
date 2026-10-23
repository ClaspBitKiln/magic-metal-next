# RFQ Workbench MVP

## Purpose

Isolated manager workbench for turning a client RFQ into a procurement comparison and a client-safe quote. Production remains unchanged.

## Current flow

`RFQ → normalization → Metalinfo search → observed offers → freshness/evidence → landed cost → ranking → manager approval → client-safe quote`

## Live Metalinfo source

The workbench uses Firecrawl Search API as the acquisition layer for Metalinfo.

- Search is restricted to `metalinfo.ru` and indexed Metalinfo subdomains.
- Multiple size spellings are searched: `х`, `x`, `*`, `×`.
- Product, dimensions, grade and standard are included when available.
- Results are deduplicated by canonical evidence URL.
- An offer is accepted only when one local catalogue segment contains the requested diameter, wall/thickness, grade, standard and an explicit parseable price.
- Accepted price formats are explicit RUB/kg, RUB/t, or thousand RUB.
- Supplier identity and evidence URL are mandatory.
- Quantity, VAT, city and source dates are extracted conservatively.
- Missing quantity stays unknown and is never converted into artificial stock.
- Each offer retains `sourcePublishedAt`/`sourceUpdatedAt` separately from `observedAt`.

## Evidence status and freshness

A Metalinfo listing is observed market evidence, not a verified supplier commitment.

- `fresh`: source date is at most 30 days old.
- `aging`: source date is 31–90 days old.
- `stale`: source date is more than 90 days old.
- `unknown`: the source supplied no usable date.

Live Metalinfo results remain `needs-verification`; stale results are marked `stale`. A search observation timestamp never substitutes for the source publication/update date.

## Exact-match safety

The adapter rejects:

- neighboring sizes;
- another steel grade;
- another standard;
- prices that cannot be tied to the exact local product segment;
- results without supplier identity or evidence URL;
- RFQs missing a required exact-match field.

No result is safer than an invented or mismatched offer.

## Benchmark vs offer

`src/lib/procurement/metalinfoBenchmark.ts` is a separate market-monitoring layer. Benchmark values are not executable supplier offers and cannot by themselves create a procurement decision or client quote.

## Live source requirements

- `FIRECRAWL_API_KEY` is required for live application search.
- `RFQ_WORKBENCH_DEMO=true` is available only for deterministic local/demo testing.
- Without demo mode, the API uses the live Metalinfo adapter and does not silently fall back to synthetic offers.
- Secrets must be supplied through the runtime environment and never committed.

## Manager acceptance scenario

1. Paste or type a real RFQ.
2. Confirm the normalized size, grade, standard, quantity and destination.
3. Run Metalinfo search.
4. Review evidence URL, source date, freshness and verification status.
5. Compare ranked options by landed cost, availability, lead time and risk.
6. Select an option and approve the selling price.
7. Generate the client-safe quote.

The client version hides supplier identity, evidence URLs, purchase price, margin and internal assessments.

## Non-goals

- No changes to the production homepage or catalog.
- No new CRM.
- No autonomous binding quote transmission.
- No invented live supplier prices, availability or logistics.
- No replacement of the existing Procurement Engine.

## Selection criteria and manager review

The engine criteria from `PROCUREMENT_SELECTION_CRITERIA.md` are retained. Market ranking is distinct from a manager-reviewed procurement decision. Workbench chooses the lowest delivered cost only among options whose current terms, sufficient stock and expenses were explicitly checked for the selected RFQ line; merely opening an observation does not recommend it or enable a quote.

See `../../PROCUREMENT_WORKBENCH_MVP.md` for the implemented review flow and `../../PROCUREMENT_DECISION_METHOD.md` for the critical review and fallback method. Split procurement and shared transport remain a later step requiring reliable quantities and logistics.
