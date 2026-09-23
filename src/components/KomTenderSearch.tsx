import { useEffect, useState } from "react";

type Item = {
  id: string | number;
  url?: string;
  date?: string;
  deadline?: string;
  price?: number | null;
  currency?: string;
  customer?: string;
  description?: string;
  positions?: Array<{ name?: string; quantity?: number; unit?: string }>;
  isMmk?: boolean;
};

export default function KomTenderSearch() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ scan: "20", mmk: "1" });
      if (q.trim()) params.set("q", q.trim());
      const response = await fetch("/api/komtender/search?" + params);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка поиска");
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка поиска");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { search(); }, []);

  return (
    <section style={{maxWidth:1200, margin:"40px auto", padding:"0 20px"}}>
      <div style={{display:"flex", gap:12, marginBottom:24}}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") search(); }}
          placeholder="Например: труба, лист, швеллер, 09Г2С"
          style={{flex:1, padding:"14px 16px", border:"1px solid #ddd", borderRadius:8}}
        />
        <button onClick={search} disabled={loading} style={{padding:"14px 22px", borderRadius:8}}>
          {loading ? "Ищем…" : "Найти"}
        </button>
      </div>
      {error && <p>{error}</p>}
      <p style={{marginBottom:16}}>Последние тендеры по металлопрокату и трубам с приоритетом ММК.</p>
      <div style={{display:"grid", gap:12}}>
        {items.map((item) => (
          <article key={item.id} style={{border:"1px solid #e5e5e5", borderRadius:10, padding:18}}>
            <div style={{display:"flex", justifyContent:"space-between", gap:20}}>
              <strong>{item.positions?.map(p => p.name).filter(Boolean).join("; ") || item.description || ("Тендер №" + item.id)}</strong>
              {item.isMmk && <span>ММК</span>}
            </div>
            <div style={{marginTop:8}}>{item.customer}</div>
            <div style={{marginTop:8, opacity:.75}}>
              {item.date || "—"} · до {item.deadline || "—"} · {item.price ? item.price.toLocaleString("ru-RU") + " " + (item.currency || "RUB") : "Цена не указана"}
            </div>
            {item.url && <a href={item.url} target="_blank" rel="noreferrer" style={{display:"inline-block", marginTop:10}}>Открыть тендер →</a>}
          </article>
        ))}
        {!loading && !items.length && <p>Ничего не найдено.</p>}
      </div>
    </section>
  );
}
