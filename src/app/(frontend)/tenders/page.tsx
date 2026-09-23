import KomTenderSearch from "@/components/KomTenderSearch";

export default function TendersPage() {
  return (
    <main>
      <header style={{maxWidth:1200, margin:"24px auto", padding:"0 20px"}}>
        <a href="/">← На главную</a>
        <h1 style={{marginTop:24}}>Поиск тендеров</h1>
        <p>Металлопрокат и трубы · приоритет продукции ММК</p>
      </header>
      <KomTenderSearch />
    </main>
  );
}
