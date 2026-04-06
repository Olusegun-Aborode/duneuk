import { NextResponse } from "next/server";
import { getDuneEurQueryResults } from "@/lib/dune-eur-adapter";
import { EURO_QUERY_IDS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // MARKET_SHARE returns currency_group/symbol/total_supply/total_supply_usd
    // — no _eur fields, but routing through the adapter keeps the architecture
    // consistent (and is a no-op for queries without the rename targets).
    const data = await getDuneEurQueryResults(EURO_QUERY_IDS.MARKET_SHARE);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch euro market share:", error);
    return NextResponse.json(
      { error: "Failed to fetch euro market share" },
      { status: 500 }
    );
  }
}
