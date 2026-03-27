import { NextResponse } from "next/server";
import { getEurDailyActiveUsers } from "@/lib/allium-stablecoins";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getEurDailyActiveUsers();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch euro daily active users:", error);
    return NextResponse.json(
      { error: "Failed to fetch euro daily active users" },
      { status: 500 }
    );
  }
}
