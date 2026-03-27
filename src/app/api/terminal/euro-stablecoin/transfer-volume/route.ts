import { NextResponse } from "next/server";
import { getEurTransferVolume } from "@/lib/allium-stablecoins";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getEurTransferVolume();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch euro transfer volume:", error);
    return NextResponse.json(
      { error: "Failed to fetch euro transfer volume" },
      { status: 500 }
    );
  }
}
