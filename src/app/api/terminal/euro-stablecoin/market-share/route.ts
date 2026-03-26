import { NextResponse } from "next/server";
import { getEurMarketShare } from "@/lib/defillama";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getEurMarketShare();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch euro market share:", error);
    return NextResponse.json(
      { error: "Failed to fetch euro market share" },
      { status: 500 }
    );
  }
}
