import { NextResponse } from "next/server";
import { getDuneQueryResults } from "@/lib/dune";
import { QUERY_IDS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDuneQueryResults(QUERY_IDS.DEX_PLATFORMS);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch DEX platforms:", error);
    return NextResponse.json(
      { error: "Failed to fetch DEX platforms" },
      { status: 500 }
    );
  }
}
