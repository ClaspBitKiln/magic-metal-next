import { NextResponse } from "next/server";

type Supplier = {
  name: string;
  role: "manufacturer" | "supplier" | "stockist" | "import";
  query: string;
};

function q(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    product?: string;
    grade?: string;
    gost?: string;
    size?: string;
    quantity?: number;
    unit?: string;
    destination?: string;
    targetMargin?: number;
  } | null;

  if (!body?.product) {
    return NextResponse.json({ error: "product is required" }, { status: 400 });
  }

  const exact = q([
    body.product,
    body.grade,
    body.gost,
    body.size,
  ].filter(Boolean).join(" "));

  const queries = [
    exact + " производитель",
    exact + " цена купить оптом",
    exact + " склад",
  ];

  const suppliers: Supplier[] = [];
  const supplierSearchUrl = (query: string) =>
    "https://www.google.com/search?q=" + encodeURIComponent(query);

  queries.forEach((query, index) => {
    suppliers.push({
      name: index === 0 ? "Поиск производителей" : index === 1 ? "Поиск поставщиков" : "Поиск складов",
      role: index === 0 ? "manufacturer" : index === 1 ? "supplier" : "stockist",
      query: supplierSearchUrl(query),
    });
  });

  const targetMargin = Number(body.targetMargin ?? 15);
  const quantity = Number(body.quantity ?? 0);

  return NextResponse.json({
    product: {
      exact,
      quantity,
      unit: body.unit ?? "т",
      destination: body.destination ?? "",
    },
    search: {
      queries,
      suppliers,
    },
    economics: {
      targetMarginPercent: targetMargin,
      note: "Закупочная цена и логистика пока не подтверждены. Расчёт продажи выполняется после получения реальных котировок.",
      formulas: {
        landedCost: "purchasePrice + delivery",
        salePrice: "landedCost / (1 - margin)",
        totalProfit: "(salePrice - landedCost) * quantity",
      },
    },
    nextAction: "Проверить найденных производителей/поставщиков и запросить актуальную цену, наличие и условия поставки.",
  });
}
