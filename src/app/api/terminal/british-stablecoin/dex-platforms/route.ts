import { NextResponse } from "next/server";
import { getDuneQueryResults } from "@/lib/dune";
import { QUERY_IDS } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Query 6276579 columns: Week, blockchain, symbol, project, volume_usd, trade_count
// DexPlatforms component aggregates by `dex` and expects { dex, volume_usd, trade_count, token, unique_traders }
function normalize(rows: Record<string, unknown>[]) {
  return rows.map((r) => ({
    week: (r.Week ?? r.week) as string,
    blockchain: r.blockchain as string,
    token: r.symbol as string,
    dex: r.project as string,
    volume_usd: Number(r.volume_usd ?? 0),
    trade_count: Number(r.trade_count ?? 0),
    unique_traders: 0, // not present in 6276579; component falls back to 0
  }));
}

export async function GET() {
  try {
    const result = await getDuneQueryResults(QUERY_IDS.DEX_PLATFORMS);
    return NextResponse.json({ ...result, data: normalize(result.data) });
  } catch (error) {
    console.error("Failed to fetch DEX platforms:", error);
    return NextResponse.json(
      { error: "Failed to fetch DEX platforms" },
      { status: 500 }
    );
  }
}
