import { NextResponse } from "next/server";
import { getAlliumData } from "@/lib/allium";

export const dynamic = "force-dynamic";

const GBP_SYMBOLS = ["tGBP", "VGBP", "GBPm", "GBPe", "GBPT", "eGBP"];

interface AlliumToken {
  chain: string;
  price: number | null;
  info: { name: string; symbol: string };
  attributes: {
    total_supply: number;
    fully_diluted_valuation_usd: number;
    holders_count: number;
  };
}

export async function GET() {
  try {
    // Search for each GBP token across all chains
    const searches = GBP_SYMBOLS.map((symbol) =>
      getAlliumData(`/api/v1/developer/tokens/search?q=${symbol}&limit=10`)
        .then((r) => r.data as unknown as AlliumToken[])
        .catch(() => [] as AlliumToken[])
    );

    const results = await Promise.all(searches);
    const allTokens = results.flat();

    // Filter and deduplicate — keep highest-priced entry per symbol (most liquid)
    const priceMap: Record<string, { price: number; chain: string }> = {};
    for (const token of allTokens) {
      const sym = token.info?.symbol;
      if (!sym || !GBP_SYMBOLS.includes(sym)) continue;
      if (token.price && (!priceMap[sym] || token.price > priceMap[sym].price)) {
        priceMap[sym] = { price: token.price, chain: token.chain };
      }
    }

    return NextResponse.json({
      data: priceMap,
      lastUpdated: new Date().toISOString(),
      source: "allium",
    });
  } catch (error) {
    console.error("Failed to fetch prices from Allium:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
