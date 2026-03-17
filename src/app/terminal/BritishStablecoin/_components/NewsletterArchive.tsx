"use client";

import { useQuery } from "@tanstack/react-query";

interface Post {
  id: string;
  title: string;
  subtitle: string | null;
  web_url: string;
  thumbnail_url: string | null;
  publish_date: number;
}

export default function NewsletterArchive() {
  const { data, isLoading } = useQuery<{ data: Post[] }>({
    queryKey: ["newsletter"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/newsletter");
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const posts = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Newsletter Archive</span>
          <span className="tui-panel-badge">Beehiiv</span>
        </div>
        <div className="p-4">
          <div className="h-20 skeleton" />
        </div>
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className="tui-panel">
      <div className="tui-panel-header">
        <span className="tui-panel-title">Newsletter Archive</span>
        <span className="tui-panel-badge">{posts.length} editions</span>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {posts.map((post) => {
          const date = new Date(post.publish_date * 1000);
          const dateStr = date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          return (
            <a
              key={post.id}
              href={post.web_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 transition-colors hover:bg-[var(--card-hover)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: "var(--foreground)" }}>
                    {post.title}
                  </p>
                  {post.subtitle && (
                    <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {post.subtitle}
                    </p>
                  )}
                </div>
                <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>
                  {dateStr}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
