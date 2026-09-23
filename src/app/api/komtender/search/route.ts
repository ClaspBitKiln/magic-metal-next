import { getTender, getTemplate, komtenderGet } from "@/lib/komtender/client";

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

type Position = { name?: string; unit?: string; price?: number; quantity?: number };

type TenderDetail = TenderShort & {
  customer?: { name?: string; inn?: string };
  descr?: string;
  positions?: Position[];
};

const MMK_CUSTOMER_TERMS = [
  "ммк",
  "магнитогорский металлургический комбинат",
  "пao ммк",
  "пао «ммк»",
];

const PRODUCT_TERMS = [
  "арматур", "катанк", "круг", "уголок", "швеллер", "двутавр", "балк",
  "лист", "листов", "листовой", "рулон", "полоса", "проволок",
  "оцинк", "холоднокатан", "горячекатан", "прокат",
  "труба", "трубопрокат", "бесшовн", "электросварн", "профильн",
  "профнастил", "09г2с", "17г1с", "08пс", "ст3", "ст20", "aisi",
];

const THIN_SHEET_TERMS = [
  "лист", "листов", "листовой", "горячекатан", "холоднокатан",
  "оцинк", "оцинкован", "рулон", "х/к", "г/к", "aisi",
  "ст3", "ст08", "08пс", "09г2с", "17г1с",
];

function textOf(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/ё/g, "е");
}

function tenderText(tender: TenderDetail) {
  return [
    tender.descr,
    ...(tender.positions || []).flatMap((p) => [p.name, p.unit, p.quantity]),
  ].map(textOf).join(" ");
}

function hasTerm(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function isMmkCustomer(name: string) {
  return hasTerm(textOf(name), MMK_CUSTOMER_TERMS);
}

function isMetalTender(tender: TenderDetail) {
  return hasTerm(tenderText(tender), PRODUCT_TERMS);
}

function isThinSheetTender(tender: TenderDetail) {
  const text = tenderText(tender);
  if (!hasTerm(text, THIN_SHEET_TERMS)) return false;
  return (tender.positions || []).some((p) => {
    const n = textOf(p.name);
    const u = textOf(p.unit);
    return hasTerm(n, THIN_SHEET_TERMS) || /лист|рулон/.test(u);
  }) || /лист|рулон/.test(text);
}

function tons(position: Position) {
  const unit = textOf(position.unit);
  const quantity = Number(position.quantity);
  if (Number.isFinite(quantity) && /(т|тонн|тонна|тонны|тн)/.test(unit)) return quantity;
  const name = textOf(position.name);
  const m = name.match(/(?:^|\s)(\d+(?:[.,]\d+)?)\s*(?:т|тн|тонн|тонны|тонна)(?:\b|$)/i);
  return m ? Number(m[1].replace(",", ".")) : null;
}

function deadlineMs(value?: string) {
  if (!value) return Number.POSITIVE_INFINITY;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return Number.POSITIVE_INFINITY;
  // KomTender supplies Moscow-local timestamps. Convert explicitly to UTC.
  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4] || "23"}:${m[5] || "59"}:${m[6] || "59"}+03:00`;
  return Date.parse(iso);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const templateId = url.searchParams.get("templateId") || process.env.KOMTENDER_SEARCH_TEMPLATE_ID || "1";
  const startPage = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pages = Math.min(5, Math.max(1, Number(url.searchParams.get("pages") || "1")));
  const scan = Math.min(100, Math.max(1, Number(url.searchParams.get("scan") || "100")));
  const q = textOf(url.searchParams.get("q"));
  const customer = textOf(url.searchParams.get("customer"));
  const region = textOf(url.searchParams.get("region"));
  const family = textOf(url.searchParams.get("family"));
  const activeOnly = url.searchParams.get("active") !== "false";

  try {
    const apiKey = request.headers.get("x-komtender-api-key");
    const headers = apiKey ? { "X-API-KEY": apiKey } : undefined;

    const infoResponse = await komtenderGet("info", { headers });
    const infoPayload = infoResponse.data as any;
    const remaining = Number(
      infoPayload?.data?.remaining ??
      infoPayload?.remaining ??
      infoResponse.headers.get("X-RateLimit-Remaining") ??
      0
    );

    // One list request costs quota too. Never blindly start a scan that can
    // consume more quota than is available.
    const maxDetails = Math.max(0, remaining - pages);
    const requestedDetails = Math.min(scan * pages, maxDetails);
    if (requestedDetails <= 0) {
      return Response.json({
        ok: false,
        error: "Недостаточно KomTender API quota для глубокого сканирования",
        remaining,
        requestedDetails: scan * pages,
        hint: "Уменьшите pages/scan или повторите после сброса суточной квоты.",
      }, { status: 429 });
    }

    const rows: TenderShort[] = [];
    const pageMeta: any[] = [];
    for (let i = 0; i < pages && rows.length < requestedDetails; i++) {
      const currentPage = startPage + i;
      const result = await komtenderGet(
        "template/" + encodeURIComponent(templateId) +
        "?page=" + currentPage + "&sort=new-first",
        { headers }
      );
      const payload = result.data as { data?: TenderShort[]; _meta?: unknown };
      const pageRows = Array.isArray(payload?.data) ? payload.data : [];
      pageMeta.push(payload?._meta ?? null);
      rows.push(...pageRows.slice(0, Math.min(scan, requestedDetails - rows.length)));
    }

    const details: TenderDetail[] = [];
    for (const item of rows) {
      try {
        const response = await komtenderGet(encodeURIComponent(String(item.id)), { headers });
        details.push(response.data as TenderDetail);
      } catch {
        // One bad tender must not abort the whole scan.
      }
    }

    const now = Date.now();
    const items = details
      .map((detail) => {
        const customerName = detail.customer?.name ?? "";
        const products = tenderText(detail);
        const thinSheet = isThinSheetTender(detail);
        const quantityTons = (detail.positions || [])
          .map(tons)
          .filter((x): x is number => x !== null)
          .reduce((a, b) => a + b, 0) || null;

        return {
          id: detail.id,
          url: detail.url || `https://www.komtender.ru/tender/${detail.id}`,
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
          isMmkProduct: hasTerm(products, PRODUCT_TERMS),
          productFamily: thinSheet ? "thin_sheet" : "other_metal",
          quantityTons,
          isActive: deadlineMs(detail.dte) > now,
        };
      })
      .filter((item) => !item.isMmkCustomer && item.isMmkProduct)
      .filter((item) => !activeOnly || item.isActive)
      .filter((item) => !family || item.productFamily === family)
      .filter((item) => !q || [item.description, item.customer, ...item.positions.map((p) => p.name)].map(textOf).join(" ").includes(q))
      .filter((item) => !customer || textOf(item.customer).includes(customer))
      .filter((item) => !region || textOf(item.regions).includes(region) || textOf(item.place).includes(region));

    items.sort((a, b) => {
      if (a.productFamily !== b.productFamily) return a.productFamily === "thin_sheet" ? -1 : 1;
      if ((b.quantityTons ?? 0) !== (a.quantityTons ?? 0)) return (b.quantityTons ?? 0) - (a.quantityTons ?? 0);
      return deadlineMs(a.deadline) - deadlineMs(b.deadline);
    });

    return Response.json({
      ok: true,
      goal: "Заказчики не ММК → продукция из номенклатуры ММК; тонкий лист — отдельный приоритет",
      templateId,
      startPage,
      pages,
      scanned: rows.length,
      detailed: details.length,
      matched: items.length,
      remainingBeforeScan: remaining,
      query: { q, customer, region, family, activeOnly },
      items,
      meta: pageMeta,
    });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error
      ? Number((error as { status?: number }).status) || 500
      : 500;
    const message = error instanceof Error ? error.message : "KomTender error";
    return Response.json({ error: message }, { status });
  }
}
