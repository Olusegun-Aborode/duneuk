import { NextResponse } from "next/server";
import { getDuneQueryResults } from "@/lib/dune";
import { QUERY_IDS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDuneQueryResults(QUERY_IDS.MARKET_SHARE);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch market share:", error);
    return NextResponse.json(
      { error: "Failed to fetch market share" },
      { status: 500 }
    );
  }
}
