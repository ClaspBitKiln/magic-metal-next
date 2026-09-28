# BicoTender integration — minimal reliable path

Use the official BicoTender API as the primary source. Public BicoTender pages are fallback/discovery only.

Pipeline: API -> normalize -> validate -> deduplicate -> procurement filters -> storage.

Environment: BICOTENDER_API_URL and BICOTENDER_API_TOKEN (if required by the account). Never hard-code credentials or an undocumented endpoint.

Important: a price shown as “see documentation” is NULL, never zero.

Live public verification on 2026-09-28 found current September records including pipe procurement, aluminium pipe AMg6 300x10x3000, NNK metal-roll supply, and Ural Turbine Plant metal-waste sale. These records expose the fields needed for normalization.

Next live step: configure the actual account API endpoint/credential, run a 20–100 record smoke test, compare API records with public pages, then connect to Procurement Engine.