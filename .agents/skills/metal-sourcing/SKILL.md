---
name: metal-sourcing
description: Research, normalize, and connect industrial metal products to verified supplier capabilities, offers, availability, and the unified Magic Metal sales catalog. Use for supplier discovery, assortment expansion, source ingestion, and catalog coverage work.
---

# Metal Sourcing

Use this skill for supplier, factory, assortment, sourcing, and catalog-coverage tasks.

## Source order

1. Start with the official supplier/factory/product documentation and the applicable official standard or normative source.
2. Use high-quality secondary sources, marketplaces, and GitHub only to enrich or cross-check the primary evidence.
3. Record the source URL, observation/check date, and evidence quality. Never silently upgrade weak evidence to confirmed capability or stock.

## Core data model

Keep these concepts separate:

- CAPABILITY: a factory can manufacture the requested form/size/grade/standard.
- OFFER: a commercial listing or quotation from a supplier/channel.
- AVAILABILITY: confirmed current stock/quantity/location with an observation timestamp.
- REFERENCE PRICE: an indicative market/reference value, not a floor and not a guaranteed sale price.
- BEST COMMERCIAL SOURCE: the source with the best verified combination of purchase price, lead time, lot, documents, location/logistics, and risk; do not rank by price alone.

## Normalization

Normalize, where applicable:

product family; product type; geometry/size; diameter; wall; profile; grade; standard; execution; length; surface; coating; manufacturer; supplier; quantity; location; price; currency; VAT/unit; observedAt; lead time; evidence URL; confidence/status.

For tubes, always preserve D×S and keep CAPABILITY, OFFER, and AVAILABILITY distinct. Exact D×S evidence outranks a broad marketing range when the query is exact.

## Catalog rules

- The public sales catalog is unified. Customers do not switch suppliers.
- Supplier identities, source URLs, internal scores, and raw supplier snapshots stay in the internal layer.
- A known source with zero stock can remain a public "Под заказ" / "Срок уточняется" position.
- A position without any defensible source/capability evidence is an internal sourcing target, not a public stock claim.
- Never invent a price, stock quantity, lead time, or manufacturer.
- Technical substitutions require written customer approval.

## Runtime independence

External supplier, factory, marketplace, and price sites are ingestion inputs only. Public pages and manager search must work from Magic Metal's own stored data/local snapshots/internal Payload. Never proxy or scrape a supplier site during a page request. If internal offers are unavailable, degrade to the local capability layer rather than calling an external site live.

## Efficient execution

Prefer the smallest reusable change: normalized data + an importer/adapter + deterministic tests. Do not create a new framework when an existing collection, parser, catalog structure, or skill already covers the job.

For every assortment expansion, leave a machine-checkable trail: source/evidence, normalized record, target catalog line, and status. Run focused catalog tests before broader build/QA.
