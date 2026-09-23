import { useEffect, useState } from "react";

type Item = {
  id: string | number;
  url?: string;
  date?: string;
  deadline?: string;
  price?: number | null;
  currency?: string;
  customer?: string;
  customerInn?: string;
  description?: string;
  positions?: Array<{ name?: string; quantity?: number; unit?: string; price?: number }>;
  place?: string;
  regions?: string;
};

export default function KomTenderSearch() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setApiKey(sessionStorage.getItem("komtender_api_key") || "");
  }, []);

  async function search() {
    setLoading(true); setError("");
    try {
      const key = apiKey.trim();
      if (!key) throw new Error("Введите тестовый KomTender API key");
      sessionStorage.setItem("komtender_api_key", key);
      const params = new URLSearchParams({ scan: "20" });
      if (q.trim()) params.set("q", q.trim());
      const response = await fetch("/api/komtender/search?" + params, {
        headers: { "X-Komtender-API-Key": key },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || "Ошибка поиска");
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка поиска");
    } finally { setLoading(false); }
  }

  return (
    <section style={{maxWidth:1200, margin:"40px auto", padding:"0 20px"}}>
      <div style={{display:"grid", gap:8, marginBottom:14}}>
        <label style={{fontSize:13, opacity:.75}}>KomTender API key — тестовый режим</label>
        <input value={apiKey} onChange={e=>setApiKey(e.target.value)} type="password"
          placeholder="Введите тестовый ключ" autoComplete="off"
          style={{padding:"12px 14px", border:"1px solid #ddd", borderRadius:8}} />
        <span style={{fontSize:12, opacity:.6}}>Ключ не записывается в репозиторий; он хранится только в текущей сессии браузера и передаётся серверу в заголовке.</span>
      </div>
      <div style={{display:"flex", gap:12, marginBottom:24}}>
        <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") search();}}
          placeholder="Например: труба, лист, швеллер, 09Г2С"
          style={{flex:1, padding:"14px 16px", border:"1px solid #ddd", borderRadius:8}} />
        <button onClick={search} disabled={loading} style={{padding:"14px 22px", borderRadius:8}}>
          {loading ? "Ищем…" : "Найти"}
        </button>
      </div>
      {error && <p style={{color:"#b00020"}}>{error}</p>}
      <p style={{marginBottom:16}}>Заказчики не ММК → заявки, содержащие продукцию из номенклатуры ММК.</p>
      <div style={{display:"grid", gap:12}}>
        {items.map(item => (
          <article key={item.id} style={{border:"1px solid #e5e5e5", borderRadius:10, padding:18}}>
            <strong>{item.positions?.map(p=>p.name).filter(Boolean).join("; ") || item.description || ("Тендер №"+item.id)}</strong>
            <div style={{marginTop:8}}>{item.customer}</div>
            <div style={{marginTop:6, opacity:.7}}>ИНН {item.customerInn || "—"} · {item.date || "—"} · до {item.deadline || "—"}</div>
            <div style={{marginTop:6}}>{item.price ? item.price.toLocaleString("ru-RU")+" "+(item.currency||"RUB") : "Цена не указана"}</div>
            {item.url && <a href={item.url} target="_blank" rel="noreferrer" style={{display:"inline-block", marginTop:10}}>Открыть тендер →</a>}
          </article>
        ))}
        {!loading && !items.length && !error && <p>Введите ключ и нажмите «Найти».</p>}
      </div>
    </section>
  );
}
