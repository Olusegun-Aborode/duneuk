import { NextResponse } from "next/server";
import { getEurMarketOverview } from "@/lib/defillama";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getEurMarketOverview();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch euro market overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch euro market overview" },
      { status: 500 }
    );
  }
}
