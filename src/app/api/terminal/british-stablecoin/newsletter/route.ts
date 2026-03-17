import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface BeehiivPost {
  id: string;
  title: string;
  subtitle: string | null;
  web_url: string;
  thumbnail_url: string | null;
  publish_date: number;
  displayed_date: string | null;
  status: string;
}

let cache: { data: BeehiivPost[]; timestamp: number } | null = null;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h

export async function GET() {
  try {
    const now = Date.now();
    if (cache && now - cache.timestamp < CACHE_TTL) {
      return NextResponse.json({ data: cache.data });
    }

    const apiKey = process.env.BEEHIIV_API_KEY;
    const pubId = process.env.BEEHIIV_PUBLICATION_ID;
    if (!apiKey || !pubId) {
      return NextResponse.json({ data: [] });
    }

    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${pubId}/posts?status=confirmed&limit=10&order_by=publish_date&direction=desc`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      console.error("Beehiiv API error:", res.status);
      return NextResponse.json({ data: [] });
    }

    const json = await res.json();
    const posts: BeehiivPost[] = (json.data ?? []).map((p: Record<string, unknown>) => ({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,
      web_url: p.web_url,
      thumbnail_url: p.thumbnail_url,
      publish_date: p.publish_date,
      displayed_date: p.displayed_date,
      status: p.status,
    }));

    cache = { data: posts, timestamp: now };
    return NextResponse.json({ data: posts });
  } catch (error) {
    console.error("Failed to fetch newsletter posts:", error);
    return NextResponse.json({ data: [] });
  }
}
