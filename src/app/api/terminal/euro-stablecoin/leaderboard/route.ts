import { NextResponse } from "next/server";
import { getDuneEurQueryResults } from "@/lib/dune-eur-adapter";
import { EURO_QUERY_IDS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDuneEurQueryResults(EURO_QUERY_IDS.SUPPLY_LEADERBOARD);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch euro leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch euro supply leaderboard" },
      { status: 500 }
    );
  }
}
