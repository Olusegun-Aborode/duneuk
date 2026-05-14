import { NextResponse } from "next/server";
import { getEurDailyActiveUsers } from "@/lib/allium-stablecoins";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getEurDailyActiveUsers();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch euro daily active users:", error);
    // Degrade gracefully so GBP data still renders in the panel
    return NextResponse.json({
      data: [],
      lastUpdated: new Date().toISOString(),
      source: "allium-degraded",
      error: (error as Error).message,
    });
  }
}
