import { NextResponse } from "next/server";
import { getTender } from "@/lib/komtender/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AgentRole =
  | "triage"
  | "rfq-analyst"
  | "source-discovery"
  | "technical-verifier"
  | "market-benchmark"
  | "logistics"
  | "procurement-optimizer"
  | "quality-gate"
  | "commercial-quote";

const roles: AgentRole[] = [
  "triage",
  "rfq-analyst",
  "source-discovery",
  "technical-verifier",
  "market-benchmark",
  "logistics",
  "procurement-optimizer",
  "quality-gate",
  "commercial-quote",
];

const instructions: Record<AgentRole, string> = {
  triage: "Разбей тендер на независимые рабочие пакеты. Выдели критически отсутствующие поля. Не выбирай поставщика.",
  "rfq-analyst": "Нормализуй товар, размеры, марку, ГОСТ/ТУ, количество, единицу, сертификаты, место поставки и сроки. Не додумывай отсутствующие данные.",
  "source-discovery": "Определи, какие реальные каналы закупки нужно проверить: производитель, официальный дистрибьютор, склад, альтернативный производитель, импорт. Не выдумывай наличие или цены.",
  "technical-verifier": "Проверь техническое соответствие. Отделяй точное соответствие от допустимой альтернативы и от позиции, требующей уточнения.",
  "market-benchmark": "Определи необходимые рыночные ориентиры и сравни найденные данные. Не называй benchmark физическим наличием.",
  logistics: "Определи маршрут и необходимые элементы landed cost: забор, перевозка, консолидация, граница/таможня при наличии, доставка до места.",
  "procurement-optimizer": "Сопоставь техническое соответствие, цену, наличие, логистику, срок и риски. Сравни single-source и split procurement.",
  "quality-gate": "Проверь результат на выдуманные данные, устаревшую доступность, технические ошибки, отсутствующую логистику и слабые доказательства. Заблокируй небезопасные выводы.",
  "commercial-quote": "Сформируй внутренний проект коммерческого результата только из подтвержденных данных. Не раскрывай клиенту закупочные источники, закупочные цены и внутренние оценки.",
};

function extractText(value: unknown) {
  return JSON.stringify(value, null, 2);
}

async function callAgent(role: AgentRole, input: unknown, prior: unknown[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const model = process.env.OPENAI_AGENT_MODEL || "gpt-5.6-luna";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            `Ты агент внутреннего Procurement Engine Magic Metal. ${instructions[role]}\n` +
            "Никогда не выдумывай поставщиков, цены, остатки, сроки или техническое соответствие. " +
            "Отмечай evidence/confidence/risks/nextAction. Отвечай кратко и структурировано.",
        },
        {
          role: "user",
          content:
            `Исходные данные:\n${extractText(input)}\n\nРезультаты предыдущих агентов:\n${extractText(prior)}`,
        },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenAI HTTP ${response.status}`);
  }

  return {
    role,
    output: data.output_text ?? data.output ?? "",
    responseId: data.id,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let input: unknown = body.input ?? body.rfq ?? body.tender;

    if (!input && body.tenderId) {
      const tender = await getTender(String(body.tenderId));
      input = tender.data;
    }

    if (!input) {
      return NextResponse.json(
        { ok: false, message: "Provide input, rfq, tender or tenderId" },
        { status: 400 },
      );
    }

    const findings: unknown[] = [];

    for (const role of roles) {
      const result = await callAgent(role, input, findings);
      findings.push(result);
    }

    return NextResponse.json({
      ok: true,
      workflow: "magic-metal-procurement-swarm",
      model: process.env.OPENAI_AGENT_MODEL || "gpt-5.6-luna",
      agents: roles,
      findings,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Procurement swarm failed",
      },
      { status: 500 },
    );
  }
}
