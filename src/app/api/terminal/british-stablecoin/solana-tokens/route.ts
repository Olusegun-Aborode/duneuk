import { NextResponse } from "next/server";
import { getAlliumData } from "@/lib/allium";

export const dynamic = "force-dynamic";

const GBP_SYMBOLS = ["tGBP", "VGBP", "GBPm", "GBPe", "GBPT", "eGBP"];

export async function GET() {
  try {
    const result = await getAlliumData(
      "/api/v1/developer/tokens/search?q=GBP&chain=solana&limit=20"
    );

    // Filter to only GBP stablecoin symbols
    const gbpTokens = result.data.filter((token) => {
      const symbol = (token as { info?: { symbol?: string } }).info?.symbol;
      return symbol && GBP_SYMBOLS.includes(symbol);
    });

    return NextResponse.json({
      data: gbpTokens,
      lastUpdated: result.lastUpdated,
      source: "allium",
    });
  } catch (error) {
    console.error("Failed to fetch Solana tokens from Allium:", error);
    return NextResponse.json(
      { error: "Failed to fetch Solana token data" },
      { status: 500 }
    );
  }
}
