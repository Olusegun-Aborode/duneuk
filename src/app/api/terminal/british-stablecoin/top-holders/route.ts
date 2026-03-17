import { NextResponse } from "next/server";
import { getDuneQueryResults } from "@/lib/dune";
import { QUERY_IDS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDuneQueryResults(QUERY_IDS.TOP_HOLDERS);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch top holders:", error);
    return NextResponse.json(
      { error: "Failed to fetch top holders" },
      { status: 500 }
    );
  }
}
