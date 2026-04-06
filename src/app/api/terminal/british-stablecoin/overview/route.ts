import { NextResponse } from "next/server";
import { getDuneQueryResults } from "@/lib/dune";
import { QUERY_IDS } from "@/lib/constants";
import type { ChainDistributionEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fetch the headline market overview AND the chain-distribution table in
    // parallel so we can return an exact unique-chain list (instead of
    // mixing "deployments" and "chains" downstream).
    const [overview, chainDist] = await Promise.all([
      getDuneQueryResults(QUERY_IDS.MARKET_OVERVIEW),
      getDuneQueryResults(QUERY_IDS.CHAIN_DISTRIBUTION),
    ]);

    const chains = Array.from(
      new Set(
        ((chainDist.data ?? []) as unknown as ChainDistributionEntry[])
          .map((r) => r.blockchain?.toLowerCase())
          .filter((c): c is string => Boolean(c))
      )
    );

    return NextResponse.json({ ...overview, chains });
  } catch (error) {
    console.error("Failed to fetch market overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch market overview" },
      { status: 500 }
    );
  }
}
