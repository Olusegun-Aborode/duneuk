import { NextResponse } from "next/server";
import { getEurSupplyHistory } from "@/lib/defillama";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getEurSupplyHistory();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch euro supply history:", error);
    return NextResponse.json(
      { error: "Failed to fetch euro supply history" },
      { status: 500 }
    );
  }
}
