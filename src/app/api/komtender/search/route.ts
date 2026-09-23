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

type TenderDetail = {
  id?: number | string;
  url?: string;
  dts?: string;
  dte?: string;
  price?: { value?: number; currency?: string };
  customer?: { name?: string; inn?: string };
  descr?: string;
  positions?: Array<{ name?: string; unit?: string; price?: number; quantity?: number }>;
  place?: string;
  regions?: string;
  stage?: string;
};

const METAL_TERMS = [
  "металл", "металлопрокат", "лист", "рулон", "полоса", "сортовой",
  "арматур", "катанк", "круг", "угол", "швеллер", "двутавр", "балк",
  "проволок", "оцинков", "профнастил", "труба", "трубопрокат",
  "бесшовн", "электросварн", "сварн", "профиль"
];

const MMK_TERMS = [
  "ммк", "магнитогорский металлургический комбинат",
  "пao ммк", "пао «ммк»", "публичное акционерное общество магнитогорский металлургический комбинат"
];

function textOf(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function haystack(tender: TenderDetail) {
  return [
    tender.customer?.name,
    tender.descr,
    tender.place,
    tender.regions,
    ...(tender.positions || []).flatMap((p) => [p.name, p.unit]),
  ].map(textOf).join(" ");
}

function hasTerm(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const templateId = url.searchParams.get("templateId") || process.env.KOMTENDER_SEARCH_TEMPLATE_ID || "1";
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const scan = Math.min(30, Math.max(1, Number(url.searchParams.get("scan") || "20")));
  const q = textOf(url.searchParams.get("q"));
  const customer = textOf(url.searchParams.get("customer"));
  const region = textOf(url.searchParams.get("region"));
  const mmkOnly = url.searchParams.get("mmk") !== "0";

  try {
    const result = await getTemplate(templateId, page, "new-first");
    const payload = result.data as { data?: TenderShort[]; _meta?: unknown };
    const rows = Array.isArray(payload?.data) ? payload.data.slice(0, scan) : [];

    // The list endpoint does not contain tender title/customer/positions.
    // Therefore we inspect only the first N newest cards, keeping quota use predictable.
    const details = await Promise.all(rows.map(async (item) => {
      try {
        const response = await getTender(String(item.id));
        return response.data as TenderDetail;
      } catch {
        return null;
      }
    }));

    const items = details
      .filter((detail): detail is TenderDetail => Boolean(detail))
      .map((detail) => {
        const text = haystack(detail);
        const isMetal = hasTerm(text, METAL_TERMS);
        const isMmk = hasTerm(text, MMK_TERMS);
        return {
          id: detail.id,
          url: detail.url,
          date: detail.dts,
          deadline: detail.dte,
          price: detail.price?.value ?? null,
          currency: detail.price?.currency ?? "RUB",
          customer: detail.customer?.name ?? "",
          customerInn: detail.customer?.inn ?? "",
          description: detail.descr ?? "",
          positions: detail.positions ?? [],
          place: detail.place ?? "",
          regions: detail.regions ?? "",
          stage: detail.stage ?? "",
          isMetal,
          isMmk,
        };
      })
      .filter((item) => item.isMetal)
      .filter((item) => !mmkOnly || item.isMmk)
      .filter((item) => !q || [item.description, item.customer, ...item.positions.map((p) => p.name)].map(textOf).join(" ").includes(q))
      .filter((item) => !customer || textOf(item.customer).includes(customer))
      .filter((item) => !region || textOf(item.regions).includes(region) || textOf(item.place).includes(region))
      .sort((a, b) => Number(b.isMmk) - Number(a.isMmk));

    return Response.json({
      goal: "Металлопрокат и трубы, приоритет продукции ММК",
      templateId,
      page,
      scanned: rows.length,
      matched: items.length,
      quotaCost: rows.length + 1,
      query: { q, customer, region, mmkOnly },
      items,
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
