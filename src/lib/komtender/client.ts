const BASE_URL = "https://www.komtender.ru/api/tenders/get/";

export class KomTenderError extends Error {
  status: number;
  payload?: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message); this.name = "KomTenderError"; this.status = status; this.payload = payload;
  }
}
function apiKey(init: RequestInit) {
  const fromHeader = init.headers instanceof Headers
    ? init.headers.get("X-API-KEY")
    : Array.isArray(init.headers)
      ? new Headers(init.headers).get("X-API-KEY")
      : typeof init.headers === "object" && init.headers
        ? String((init.headers as Record<string, string>)["X-API-KEY"] || "")
        : "";
  const key = fromHeader || process.env.KOMTENDER_API_KEY;
  if (!key) throw new KomTenderError(503, "KomTender API key is not configured");
  return key;
}
export async function komtenderGet<T = unknown>(path = "", init: RequestInit = {}) {
  const url = new URL(path.replace(/^\//, ""), BASE_URL);
  const response = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...(init.headers || {}), "X-API-KEY": apiKey(init) },
    cache: "no-store",
  });
  const text = await response.text();
  let payload: unknown = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    const message = typeof payload === "object" && payload && "message" in payload
      ? String((payload as {message?: unknown}).message) : "KomTender HTTP " + response.status;
    throw new KomTenderError(response.status, message, payload);
  }
  if (typeof payload === "object" && payload && "success" in payload && (payload as {success?: boolean}).success === false) {
    throw new KomTenderError(response.status, String((payload as {message?: unknown}).message || "KomTender error"), payload);
  }
  return { data: payload as T, headers: response.headers };
}
export async function getInfo() { return komtenderGet("info"); }
export async function getTender(id: string) { return komtenderGet(encodeURIComponent(id)); }
export async function getTenderByEis(number: string) { return komtenderGet("eis/" + encodeURIComponent(number)); }
export async function getTemplates() { return komtenderGet("templates"); }
export async function getTemplate(id: string, page = 1, sort = "new-first") {
  return komtenderGet("template/" + encodeURIComponent(id) + "?page=" + page + "&sort=" + encodeURIComponent(sort));
}
