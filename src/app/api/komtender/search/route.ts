import { getTemplate, getTender, komtenderGet } from "@/lib/komtender/client";

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

// Products that are present in the MMK product catalog.
// The search is based on the requested product, not on the customer's identity.
const MMK_PRODUCT_TERMS = [
  "арматур", "катанк", "св-08", "св08", "св-08а", "св08а",
  "круг", "уголок", "швеллер", "двутавр", "балк",
  "лист", "рулон", "полоса", "проволок",
  "оцинков", "холоднокатан", "горячекатан", "прокат",
  "труба", "трубопрокат", "бесшовн", "электросварн",
  "профильн", "профнастил"
];

const MMK_CUSTOMER_TERMS = [
  "ммк",
  "магнитогорский металлургический комбинат",
  "пao ммк",
  "пао «ммк»"
];

function textOf(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function productText(tender: TenderDetail) {
  return [
    tender.descr,
    ...(tender.positions || []).flatMap((p) => [p.name, p.unit]),
  ].map(textOf).join(" ");
}

function hasTerm(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function isMmkCustomer(name: string) {
  return hasTerm(textOf(name), MMK_CUSTOMER_TERMS);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const templateId = url.searchParams.get("templateId") || process.env.KOMTENDER_SEARCH_TEMPLATE_ID || "1";
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const scan = Math.min(30, Math.max(1, Number(url.searchParams.get("scan") || "20")));
  const q = textOf(url.searchParams.get("q"));
  const customer = textOf(url.searchParams.get("customer"));
  const region = textOf(url.searchParams.get("region"));

  try {
    const apiKey = request.headers.get("x-komtender-api-key");
    const headers = apiKey ? { "X-API-KEY": apiKey } : undefined;
    const result = await getTemplateWithKey(templateId, page, "new-first", headers);
    const payload = result.data as { data?: TenderShort[]; _meta?: unknown };
    const rows = Array.isArray(payload?.data) ? payload.data.slice(0, scan) : [];

    // The list endpoint has no positions/customer, so details are fetched only
    // for the limited scan window. This keeps API usage predictable.
    const details = await Promise.all(rows.map(async (item) => {
      try {
        const response = await getTenderWithKey(String(item.id), headers);
        return response.data as TenderDetail;
      } catch {
        return null;
      }
    }));

    const items = details
      .filter((detail): detail is TenderDetail => Boolean(detail))
      .map((detail) => {
        const customerName = detail.customer?.name ?? "";
        const products = productText(detail);
        const isMmkProduct = hasTerm(products, MMK_PRODUCT_TERMS);

        return {
          id: detail.id,
          url: detail.url,
          date: detail.dts,
          deadline: detail.dte,
          price: detail.price?.value ?? null,
          currency: detail.price?.currency ?? "RUB",
          customer: customerName,
          customerInn: detail.customer?.inn ?? "",
          description: detail.descr ?? "",
          positions: detail.positions ?? [],
          place: detail.place ?? "",
          regions: detail.regions ?? "",
          stage: detail.stage ?? "",
          isMmkCustomer: isMmkCustomer(customerName),
          isMmkProduct,
        };
      })
      // Ключевой фильтр: заказчик НЕ ММК, но в заявке есть продукция ММК.
      .filter((item) => !item.isMmkCustomer && item.isMmkProduct)
      .filter((item) => !q || [item.description, item.customer, ...item.positions.map((p) => p.name)].map(textOf).join(" ").includes(q))
      .filter((item) => !customer || textOf(item.customer).includes(customer))
      .filter((item) => !region || textOf(item.regions).includes(region) || textOf(item.place).includes(region));

    return Response.json({
      goal: "Заказчики не ММК → заявки с продукцией из номенклатуры ММК",
      templateId,
      page,
      scanned: rows.length,
      matched: items.length,
      quotaCost: rows.length + 1,
      query: { q, customer, region },
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

async function getTemplateWithKey(id: string, page: number, sort: string, headers?: Record<string,string>) {
  return komtenderGet("template/" + encodeURIComponent(id) + "?page=" + page + "&sort=" + encodeURIComponent(sort), { headers });
}
async function getTenderWithKey(id: string, headers?: Record<string,string>) {
  return komtenderGet(encodeURIComponent(id), { headers });
}
