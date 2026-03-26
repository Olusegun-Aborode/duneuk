import { NextResponse } from "next/server";
import { getEurChainDistribution } from "@/lib/defillama";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getEurChainDistribution();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch euro chain distribution:", error);
    return NextResponse.json(
      { error: "Failed to fetch euro chain distribution" },
      { status: 500 }
    );
  }
}
