# Magic Metal — Procurement Engine: Execution Prompt

## Role
Act as a senior B2B procurement-platform architect, industrial metals sourcing expert, data engineer and Next.js/TypeScript engineer. Build a production-oriented procurement engine for Magic Metal, not a generic catalog.

## Business rule
Magic Metal may publish or quote a position only when there is a credible procurement route. A GOST, catalog entry or theoretical size range is not a procurement route.

## Objective
Given a customer RFQ in text, PDF, DOCX, XLSX, email or attachment:
1. extract line items;
2. normalize product, dimensions, grade, standard, quantity, unit, quality requirements, delivery destination and deadline;
3. identify missing/ambiguous fields without inventing facts;
4. search all eligible procurement sources in parallel;
5. normalize and deduplicate offers;
6. verify source freshness and procurement confidence;
7. calculate landed cost, logistics and target margin;
8. benchmark market price separately from procurement offers;
9. rank offers by total business value, not lowest nominal price only;
10. produce an internal procurement recommendation and a client-safe quotation.

## Source taxonomy
Every source must have explicit roles; never conflate them:
- manufacturer: produces the material/product;
- supplier: a route through which Magic Metal can actually buy;
- marketplace/aggregator: discovers offers from third parties;
- reference: technical/nomenclature/GOST information;
- market benchmark: price indices, market averages and trend information.

A source can have multiple roles, but each role must be explicit and scoped to a product family.

## Known source families
Direct/commercial: MMK Market, NLMK Shop, Severstal Market, OMK Market, EVRAZ Market, Mechel-Service, official manufacturer sales portals, Metallservice and confirmed specialist suppliers.
Aggregators/marketplaces: E-Metall, MC.ru, PoiskMetalla, HardHub and other verified commercial sources.
Reference: 23met, Metalline, manufacturer technical catalogs, GOST/TU documents.
Benchmark/intelligence: Metalinfo, Fastmarkets, Argus, LME and other verified benchmark sources.

Do not assume an API exists. For each connector, first establish the official access mechanism: API, feed, export, supplier upload, partner account or other permitted method. Do not build fragile scraping where an official integration exists.

## RFQ data model
A normalized RFQ must preserve:
- original customer wording;
- normalized product identity;
- dimensions and tolerances;
- steel/alloy grade;
- GOST/TU/ASTM/EN/other standard;
- quantity and unit;
- required certification/documents;
- delivery destination;
- required date;
- substitutions allowed or forbidden;
- commercial constraints;
- confidence per extracted field.

## Offer model
Each offer must retain:
- source;
- supplier;
- manufacturer, if known;
- normalized product ID;
- quoted price and currency;
- quantity/lot;
- availability status;
- warehouse/city;
- offer timestamp and source timestamp;
- lead time;
- delivery terms;
- certificates/documents;
- source confidence;
- historical supplier reliability;
- notes and restrictions.

## Ranking
Never rank by price alone. Use configurable weights based on RFQ context. At minimum consider:
- landed cost;
- price vs benchmark;
- confirmed availability;
- lead time;
- supplier reliability;
- specification match;
- document quality;
- logistics;
- required margin;
- risk.

For urgent RFQs, availability and lead time gain weight. For large-volume RFQs, price and logistics gain weight. For special steels, specification, manufacturer and certification gain weight.

## Verification
Distinguish:
- exact match;
- acceptable technical alternative requiring approval;
- uncertain match requiring clarification;
- non-qualifying offer.

Never silently substitute a grade, standard, dimension or manufacturer.

## Public/private boundary
Client-facing UI must never expose internal supplier/source selection, scraping source, benchmark source, internal margin, supplier score or procurement route unless explicitly approved. The public catalog remains unified; supplier switching is an internal function only. SDT remains a normal category in the unified catalog.

## Engineering rules
- inspect existing architecture before changing it;
- reuse the existing design system and data conventions;
- keep supplier/source data in internal layers;
- keep secrets out of the repository;
- use typed adapters and a common normalized offer contract;
- make connectors independently replaceable;
- make source freshness explicit;
- make every recommendation explainable internally;
- preserve an audit trail of source, timestamp and transformation;
- add tests for normalization, deduplication, ranking and publication eligibility.

## Delivery sequence
Phase 1: domain model + source taxonomy + procurement state machine.
Phase 2: RFQ parser and normalization.
Phase 3: offer/source adapter interface.
Phase 4: first commercial connectors, starting with the most reliable official/authorized integrations and E-Metall when an approved access method is confirmed.
Phase 5: benchmark layer.
Phase 6: logistics and landed-cost engine.
Phase 7: supplier reliability and historical learning.
Phase 8: internal procurement workspace.
Phase 9: client-safe quotation generation.

Do not implement fake live data or pretend an unavailable API works. Use fixtures/mocks for development and clearly mark integration status.

## Definition of done
A test RFQ with multiple line items can be parsed into normalized items, searched across source adapters, converted into comparable offers, benchmarked, ranked by landed business value, and turned into an internal recommendation without exposing internal sources to the customer.
