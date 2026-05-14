import { NextResponse } from "next/server";
import { getEurTopHoldersFromSim } from "@/lib/sim";
import { EUR_TOKEN_CONTRACTS, EUR_USD_RATE } from "@/lib/token-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await getEurTopHoldersFromSim(EUR_TOKEN_CONTRACTS, 50, EUR_USD_RATE);
    return NextResponse.json({
      data: rows,
      lastUpdated: new Date().toISOString(),
      source: "sim",
    });
  } catch (error) {
    console.error("Failed to fetch euro top holders via Sim:", error);
    return NextResponse.json({
      data: [],
      lastUpdated: new Date().toISOString(),
      source: "sim-degraded",
      error: (error as Error).message,
    });
  }
}
