import type { BicoClientOptions, BicoTender, TenderSearchOptions } from "./types";

const DEFAULT_TIMEOUT = 15_000;

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((v) => typeof v === "string" && v.trim()) as string | undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const n = Number(value.replace(/\s/g, "").replace(",", "."));
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function normalize(item: unknown): BicoTender | null {
  const x = asObject(item);
  const id = firstString(x.id, x.tenderId, x.tender_id, x.number, x.tenderNumber);
  if (!id) return null;

  return {
    id,
    url: firstString(x.url, x.link, x.href) ?? `https://www.bicotender.ru/tender/${id}`,
    title: firstString(x.title, x.name, x.subject, x.description) ?? "",
    customer: firstString(x.customer, x.customerName, x.organizer),
    customerInn: firstString(x.customerInn, x.customer_inn, x.inn, x.customerINN),
    price: firstNumber(x.price, x.amount, x.contractPrice, x.contract_price),
    currency: firstString(x.currency, x.currencyCode),
    publishedAt: firstString(x.publishedAt, x.publishDate, x.startDate, x.dateStart),
    deadline: firstString(x.deadline, x.endDate, x.dateEnd, x.closeDate),
    region: firstString(x.region, x.regionName, x.deliveryRegion),
    category: firstString(x.category, x.industry, x.okpd2),
    status: firstString(x.status, x.state),
    source: "bicotender",
    raw: item,
  };
}

function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const x = asObject(payload);
  for (const key of ["items", "results", "tenders", "data", "records"]) {
    if (Array.isArray(x[key])) return x[key];
  }
  return [];
}

export class BicoTenderClient {
  private readonly apiUrl: string;
  private readonly token?: string;
  private readonly timeoutMs: number;

  constructor(options: BicoClientOptions = {}) {
    this.apiUrl = options.apiUrl ?? process.env.BICOTENDER_API_URL ?? "";
    this.token = options.token ?? process.env.BICOTENDER_API_TOKEN;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT;
  }

  async search(options: TenderSearchOptions = {}): Promise<BicoTender[]> {
    if (!this.apiUrl) {
      throw new Error("BICOTENDER_API_URL is not configured");
    }

    const params = new URLSearchParams();
    if (options.keywords?.length) params.set("keywords", options.keywords.join(" "));
    if (options.minPrice != null) params.set("minPrice", String(options.minPrice));
    if (options.maxPrice != null) params.set("maxPrice", String(options.maxPrice));
    if (options.activeOnly != null) params.set("activeOnly", String(options.activeOnly));
    if (options.limit != null) params.set("limit", String(options.limit));

    const url = new URL(this.apiUrl);
    for (const [key, value] of params) url.searchParams.set(key, value);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`BicoTender API ${response.status}: ${await response.text()}`);
      }

      const payload: unknown = await response.json();
      return extractItems(payload).map(normalize).filter((x): x is BicoTender => x !== null);
    } finally {
      clearTimeout(timer);
    }
  }
}
