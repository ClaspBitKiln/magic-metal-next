# Supplier assortment workflow

## Purpose

Build one internal Commercial Master for Magic Metal from official factory/supplier evidence and controlled market signals, then expose a unified sales catalog without exposing supplier layers.

## Source hierarchy

1. Official manufacturer catalogue / product page / official stock page.
2. Official standard or normative source applicable to the product.
3. High-quality secondary catalogues and marketplaces for cross-checking and offer discovery.
4. GitHub and community implementations only for engineering patterns and tooling.

A secondary source may discover a position, but it does not by itself prove current factory capability or stock.

## Required record separation

**CAPABILITY** — what the producer can manufacture or supply according to defensible evidence.

**OFFER** — a commercial listing/quotation tied to a seller or channel.

**AVAILABILITY** — current confirmed stock, quantity and location with an observation timestamp.

This separation is mandatory for tubes and should also be used for sheet, long products, stainless, non-ferrous, forgings and pipeline components.

## Normalized fields

`productFamily`, `productType`, `size/geometry`, `diameter`, `wall`, `profile`, `grade`, `standard`, `execution`, `length`, `surface`, `coating`, `manufacturer`, `supplier`, `quantity`, `location`, `price`, `currency`, `VAT/unit`, `observedAt`, `leadTime`, `sourceUrl`, `evidence`, `confidence`, `status`.

## Commercial decision

Do not select a source using price alone. Rank by verified purchase price, lead time, lot, documentation, geography/logistics and supply risk. Keep reference price separate from the best commercial source.

## Public catalog rule

The sales catalog is a single tree. Customers never select or see the supplier. A sourced position may be public even when current stock is zero: use `Под заказ` or `Срок уточняется`. Do not publish a stock assertion without current evidence.

## Runtime independence

Supplier and marketplace sites are ingestion inputs only. Public rendering and manager search use Magic Metal's own stored data, local snapshots, or Payload. No live proxy/scrape is allowed in a page request. Supplier outage must not break the site.

## Current verified seeds

The first verified factory seeds now include KUMZ, EVRAZ, NLMK and Mechel at product-family level. Their official materials are intentionally used only to assert the product families they actually document; exact dimensional capability remains a separate discovery task.

KUMZ is especially valuable for the non-ferrous layer: its official site documents rolled, extruded and forged products, heat-exchanger blanks, special alloys and cutting/rough machining, and it publishes a dedicated current stock list. Exact dimensions and alloys are captured only where the official catalogue specifies them.

## Next expansion order

Prioritize: tube factories and tube stock → special/wear-resistant steels → stainless and heat-resistant materials → forgings/billets → sheet/coil → SДТ and flanges → non-ferrous → welding/fasteners → equipment.
