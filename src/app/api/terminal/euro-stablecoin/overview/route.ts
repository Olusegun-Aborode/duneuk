import { NextResponse } from "next/server";
import { getDuneEurQueryResults } from "@/lib/dune-eur-adapter";
import { EURO_QUERY_IDS } from "@/lib/constants";
import type { ChainDistributionEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fetch the headline market overview AND the chain-distribution table in
    // parallel so we can return an exact unique-chain list (mirrors what the
    // GBP overview route does, so the client can union chains across both
    // currencies for the "Tokens / Chains" counter).
    const [overview, chainDist] = await Promise.all([
      getDuneEurQueryResults(EURO_QUERY_IDS.MARKET_OVERVIEW),
      getDuneEurQueryResults(EURO_QUERY_IDS.CHAIN_DISTRIBUTION),
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
    console.error("Failed to fetch euro market overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch euro market overview" },
      { status: 500 }
    );
  }
}
