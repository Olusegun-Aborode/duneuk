import { NextResponse } from "next/server";
import { getDuneQueryResults } from "@/lib/dune";
import { QUERY_IDS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDuneQueryResults(QUERY_IDS.CHAIN_DISTRIBUTION);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch chain distribution:", error);
    return NextResponse.json(
      { error: "Failed to fetch chain distribution" },
      { status: 500 }
    );
  }
}
