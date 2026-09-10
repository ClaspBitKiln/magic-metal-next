# Phase 4 — Procurement Engine: real supplier data

## Implemented

The existing Payload `supplier-offers` collection is now the operational offer source for the Procurement Engine adapter. The adapter preserves supplier/source identifiers internally and converts stored offer signals into the domain `Offer` model.

The route registry provides a separate eligibility gate. A known manufacturer or supplier does not become a procurement route solely because it exists in the registry.

## Flow

`RFQ → normalize → Payload SupplierOffers → technical match → Offer → landed cost → ranking → split plans`

## Supplier rules

- confirmed supplier/manufacturer may participate in procurement discovery;
- `verify`, `reference`, `historical`, `disabled` entries cannot silently become procurement routes;
- ChZSI and KUMZ remain separate internal layers;
- client never receives supplier/source identifiers;
- market/reference data is evidence, not automatic stock confirmation.

## Split Procurement

The optimizer compares a baseline per-line procurement plan against split candidates and includes route logistics when a route is supplied. The model is deterministic for the MVP and deliberately avoids combinatorial explosion.

## Important limitation

The current Payload adapter still reads a bounded batch of active offers and filters them in application code. This is acceptable for the current MVP integration but must be replaced by indexed server-side filtering before production-scale supplier volumes.

Logistics tariffs remain data-driven. Unverified tariffs are not invented.

## Next

1. Replace bounded Payload scan with indexed normalized identity queries.
2. Add verified logistics lanes and allocation rules.
3. Add supplier reliability and freshness scoring from observed procurement history.
4. Add margin engine and minimum acceptable margin constraints.
5. Add QA gate before client quote.
