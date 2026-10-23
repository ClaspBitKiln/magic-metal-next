# Procurement workbench: first usable slice

The existing RFQ workbench now supports reviewing every RFQ line and comparing a single supplier per line. Live discovery remains the existing Metalinfo adapter. No new site, source integration or deployment is introduced.

## Manager workflow

1. Enter one product per line, including grade, standard, quantity, unit and destination (or pickup location).
2. Search and select the RFQ line. Review source evidence and its date; listing stock is not a supplier confirmation.
3. Select a supplier and enter current price in RUB per tonne including VAT, confirmed stock in tonnes, and all extra costs in RUB for the whole requested line. These include delivery, handling and applicable charges. Enter zero explicitly when there are no extra costs.
4. Confirm price, stock, lead time, documents, order terms and expenses after checking them with the supplier. Editing any amount clears this check.
5. Reviewed, eligible options sort by total cost. The lowest total among these options is recommended. Unknown expenses are never assumed to be zero.
6. Generate a draft for the selected line and enter the selling price. Kilogram requests convert to tonnes before multiplication.

## Calculation and limits

`total RUB = requested tonnes × confirmed RUB/tonne including VAT + extra RUB for the whole line`

The quote gate requires an exact match, grade and standard, destination, supported positive tonnage, positive current price, sufficient confirmed stock, explicit expenses and manager confirmation. Known min/max/order-step restrictions also apply.

This is a comparison aid with manager verification, not autonomous procurement. Confirmation is local session state, not persisted supplier evidence. Search again or reload to clear it. Results do not optimize split allocations or consolidated transport across lines. The quote is a draft for one selected position, not the entire RFQ; there is no automatic sending. CSV and document import, server persistence, split optimization, live logistics and additional adapters remain separate work.

## Verification

Targeted suites: `workbench.int.spec.ts`, `rfq-workbench-ui.int.spec.ts`, plus existing Metalinfo and procurement engine suites in RFQ CI. The new suites cover delivered-cost ranking, quantity conversion, unknown expenses, insufficient stock, supplier lot constraints, per-line review isolation, quote gating and confirmation invalidation.

Production publication still requires the repository's lint/build gates and a live RFQ acceptance run.
