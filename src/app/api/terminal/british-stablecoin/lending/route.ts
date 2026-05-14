import { NextResponse } from "next/server";
import { getDuneQueryResults } from "@/lib/dune";
import { QUERY_IDS } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Query 6276573 columns:
//   week, blockchain, project, version, token_label, symbol,
//   borrow_tx_count, borrowers, borrow_volume_usd,
//   supply_tx_count, suppliers, supply_volume_usd, utilization_rate
// Component expects: { project, token, supply_usd, borrow_usd, utilization_rate, borrowers, event_count }
// The unified query carries EUR + USD comparison rows; GBP stables don't appear because they
// aren't deployed on lending markets on Ethereum yet (the panel already has copy explaining this).
function normalize(rows: Record<string, unknown>[]) {
  return rows.map((r) => ({
    week: r.week as string,
    blockchain: r.blockchain as string,
    project: r.project as string,
    version: r.version as string,
    token: r.symbol as string,
    token_label: r.token_label as string,
    supply_usd: Number(r.supply_volume_usd ?? 0),
    borrow_usd: Number(r.borrow_volume_usd ?? 0),
    utilization_rate: Number(r.utilization_rate ?? 0),
    borrowers: Number(r.borrowers ?? 0),
    suppliers: Number(r.suppliers ?? 0),
    event_count: Number(r.borrow_tx_count ?? 0) + Number(r.supply_tx_count ?? 0),
  }));
}

export async function GET() {
  try {
    const result = await getDuneQueryResults(QUERY_IDS.LENDING);
    return NextResponse.json({ ...result, data: normalize(result.data) });
  } catch (error) {
    console.error("Failed to fetch lending data:", error);
    return NextResponse.json(
      { error: "Failed to fetch lending data" },
      { status: 500 }
    );
  }
}
