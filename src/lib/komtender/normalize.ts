export type NormalizedMetal = {
  category: string | null; grade: string | null; diameter_mm: number | null;
  thickness_mm: number | null; width_mm: number | null; length_mm: number | null;
  gost: string | null; unit: string | null; quantity: number | null;
  source_name: string; confidence: number;
};
const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
function num(pattern: RegExp, s: string) {
  const m = s.match(pattern); return m ? Number(m[1].replace(",", ".")) : null;
}
export function normalizeMetalName(source_name: string, unit: string | null = null, quantity: number | null = null): NormalizedMetal {
  const s = norm(source_name);
  let category: string | null = null;
  if (/св[- ]?08а?/i.test(source_name) || /сварочн.*проволок/i.test(s)) category = "welding_wire";
  else if (/катанк/i.test(s)) category = "wire_rod";
  else if (/швеллер/i.test(s)) category = "channel";
  else if (/уголок/i.test(s)) category = "angle";
  else if (/круг/i.test(s)) category = "round_bar";
  else if (/лист|плита/i.test(s)) category = "sheet";
  else if (/труб/i.test(s)) category = "pipe";
  else if (/оцинков/i.test(s)) category = "galvanized";
  let grade: string | null = null;
  const gm = source_name.match(/св[- ]?\d+[а-яa-z0-9-]*/i);
  if (gm) grade = gm[0].replace(/\s+/g, "").replace(/^св08а?$/i, gm[0].toLowerCase().includes("а") ? "Св-08А" : "Св-08");
  const diameter_mm = num(/(?:Ø|ф|диаметр)\s*([0-9]+(?:[.,][0-9]+)?)/i, source_name);
  const thickness_mm = num(/(?:толщ(?:ина)?|т)\s*([0-9]+(?:[.,][0-9]+)?)/i, source_name);
  const gost = source_name.match(/(?:гост|ту)\s*[0-9а-я.\-]+/i)?.[0] ?? null;
  return { category, grade, diameter_mm, thickness_mm, width_mm: null, length_mm: null, gost, unit, quantity, source_name, confidence: category ? 0.8 : 0.2 };
}
