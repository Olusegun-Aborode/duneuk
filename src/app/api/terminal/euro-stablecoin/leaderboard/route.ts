import { NextResponse } from "next/server";
import { getEurLeaderboard } from "@/lib/defillama";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getEurLeaderboard();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch euro leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch euro supply leaderboard" },
      { status: 500 }
    );
  }
}
