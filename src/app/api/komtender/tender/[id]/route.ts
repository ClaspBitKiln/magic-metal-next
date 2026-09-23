import { NextResponse } from "next/server";
import { getTender, KomTenderError } from "@/lib/komtender/client";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, {params}:{params:Promise<{id:string}>}) {
  try {
    const {id}=await params; const result=await getTender(id);
    return NextResponse.json({ok:true,data:result.data});
  } catch(error) {
    if(error instanceof KomTenderError) return NextResponse.json({ok:false,status:error.status,message:error.message},{status:error.status});
    return NextResponse.json({ok:false,message:"KomTender connection failed"},{status:500});
  }
}
