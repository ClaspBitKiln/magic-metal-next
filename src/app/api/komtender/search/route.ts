import { getTemplate, getTender } from "@/lib/komtender/client";

type TenderShort = {
  id: number | string;
  url?: string;
  dts?: string;
  dte?: string;
  price?: { value?: number; currency?: string };
  place?: string;
  regions?: string;
  stage?: string;
};

function textOf(value: unknown) {
  return String(value ?? "").toLowerCase();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const templateId = url.searchParams.get("templateId") || process.env.KOMTENDER_SEARCH_TEMPLATE_ID || "1";
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const q = textOf(url.searchParams.get("q"));
  const customer = textOf(url.searchParams.get("customer"));
  const region = textOf(url.searchParams.get("region"));
  const full = url.searchParams.get("full") === "1";
  const fullLimit = Math.min(10, Math.max(0, Number(url.searchParams.get("fullLimit") || "5")));

  try {
    const result = await getTemplate(templateId, page, "new-first");
    const payload = result.data as { data?: TenderShort[]; _meta?: unknown };
    const rows = Array.isArray(payload?.data) ? payload.data : [];

    const filtered = rows.filter((tender) => {
      const haystack = [
        tender.id, tender.place, tender.regions, tender.stage,
        tender.url, tender.dts, tender.dte
      ].map(textOf).join(" ");
      return (!q || haystack.includes(q))
        && (!customer || haystack.includes(customer))
        && (!region || textOf(tender.regions).includes(region) || textOf(tender.place).includes(region));
    });

    const items = full
      ? await Promise.all(filtered.slice(0, fullLimit).map(async (item) => {
          try {
            const detail = await getTender(String(item.id));
            return { ...item, detail: detail.data };
          } catch (error) {
            return { ...item, detailError: error instanceof Error ? error.message : "detail error" };
          }
        }))
      : filtered;

    return Response.json({
      templateId,
      page,
      query: { q, customer, region },
      items,
      count: filtered.length,
      meta: payload?._meta ?? null,
    });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error
      ? Number((error as { status?: number }).status) || 500
      : 500;
    const message = error instanceof Error ? error.message : "KomTender error";
    return Response.json({ error: message }, { status });
  }
}
