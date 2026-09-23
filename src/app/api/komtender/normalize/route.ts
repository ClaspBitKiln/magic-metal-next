import { NextResponse } from "next/server";
import { normalizeMetalName } from "@/lib/komtender/normalize";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body || typeof body.name !== "string") return NextResponse.json({ok:false,message:"name is required"},{status:400});
  return NextResponse.json({ok:true,data:normalizeMetalName(body.name, body.unit ?? null, typeof body.quantity === "number" ? body.quantity : null)});
}
