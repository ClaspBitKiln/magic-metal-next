import { getTemplates } from "@/lib/komtender/client";

export async function GET() {
  try {
    const result = await getTemplates();
    return Response.json(result.data);
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error
      ? Number((error as { status?: number }).status) || 500
      : 500;
    const message = error instanceof Error ? error.message : "KomTender error";
    return Response.json({ error: message }, { status });
  }
}
