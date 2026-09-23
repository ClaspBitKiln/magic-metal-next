import { NextResponse } from "next/server";
import { KomTenderError, komtenderGet } from "@/lib/komtender/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const key = request.headers.get("x-komtender-api-key");
    const result = await komtenderGet("info", { headers: key ? { "X-API-KEY": key } : undefined });
    const payload = result.data as any;
    return NextResponse.json({
      ok: true,
      source: "komtender",
      quota: payload?.data ?? payload,
      rateLimit: {
        limit: result.headers.get("X-RateLimit-Limit"),
        remaining: result.headers.get("X-RateLimit-Remaining"),
      },
    });
  } catch (error) {
    if (error instanceof KomTenderError) {
      return NextResponse.json({ ok:false, status:error.status, message:error.message }, { status:error.status });
    }
    return NextResponse.json({ ok:false, message:"KomTender connection failed" }, { status:500 });
  }
}
