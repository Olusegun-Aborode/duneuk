import { NextResponse } from "next/server";
import { getDuneQueryResults } from "@/lib/dune";
import { EURO_QUERY_IDS } from "@/lib/constants";

export const dynamic = "force-dynamic";

function normalizeEurFields(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const mapping: Record<string, string> = {
    total_supply_eur: "total_supply_gbp",
    supply_eur: "supply_gbp",
    volume_eur: "volume_gbp",
    balance_eur: "balance_gbp",
    eur_token: "gbp_token",
  };
  return rows.map(row => {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(row)) {
      out[mapping[key] ?? key] = val;
    }
    return out;
  });
}

export async function GET() {
  try {
    const result = await getDuneQueryResults(EURO_QUERY_IDS.SUPPLY_OVER_TIME);
    const data = { ...result, data: normalizeEurFields(result.data) };
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch euro supply history:", error);
    return NextResponse.json(
      { error: "Failed to fetch euro supply history" },
      { status: 500 }
    );
  }
}
