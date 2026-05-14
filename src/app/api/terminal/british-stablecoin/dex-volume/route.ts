import { NextResponse } from "next/server";
import { getDuneQueryResults } from "@/lib/dune";
import { QUERY_IDS } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Query 6276579 columns: Week, blockchain, symbol, project, volume_usd, trade_count
// Component expects: { week, token, volume_usd, ... }
function normalize(rows: Record<string, unknown>[]) {
  return rows.map((r) => ({
    week: (r.Week ?? r.week) as string,
    blockchain: r.blockchain as string,
    token: r.symbol as string,
    dex: r.project as string,
    volume_usd: Number(r.volume_usd ?? 0),
    trade_count: Number(r.trade_count ?? 0),
  }));
}

export async function GET() {
  try {
    const result = await getDuneQueryResults(QUERY_IDS.DEX_VOLUME);
    return NextResponse.json({ ...result, data: normalize(result.data) });
  } catch (error) {
    console.error("Failed to fetch DEX volume:", error);
    return NextResponse.json(
      { error: "Failed to fetch DEX volume" },
      { status: 500 }
    );
  }
}
