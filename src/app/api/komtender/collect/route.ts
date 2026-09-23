import { NextResponse } from "next/server";
import { getInfo, getTender, KomTenderError } from "@/lib/komtender/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.KOMTENDER_COLLECTOR_SECRET;
  if (!secret) return false;
  return request.headers.get("x-collector-secret") === secret;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ok:false,message:"Unauthorized"},{status:401});
  try {
    const info = await getInfo();
    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body.ids) ? body.ids.filter((x:any) => typeof x === "string").slice(0, 20) : [];
    const tenders = [];
    for (const id of ids) {
      const result = await getTender(id);
      tenders.push({id,data:result.data});
    }
    return NextResponse.json({
      ok:true,
      quota:(info.data as any)?.data ?? info.data,
      fetched:tenders.length,
      tenders
    });
  } catch(error) {
    if(error instanceof KomTenderError) return NextResponse.json({ok:false,status:error.status,message:error.message},{status:error.status});
    return NextResponse.json({ok:false,message:"Collector failed"},{status:500});
  }
}
