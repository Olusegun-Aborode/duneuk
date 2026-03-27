"use client";

import { useTheme } from "@/app/theme-context";

export default function TerminalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen font-mono flex flex-col" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Top bar */}
      <nav style={{ borderBottom: "1px solid var(--border)", background: "var(--panel-header)" }}>
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 flex items-center justify-between h-10">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm tracking-tight" style={{ color: "var(--accent-green)" }}>
              DUNE<span style={{ color: "var(--foreground)" }}>UK</span>
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>|</span>
            <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "var(--text-muted)" }}>
              Terminal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              className="text-[10px] px-2 py-0.5 rounded transition-colors"
              style={{
                color: "var(--text-muted)",
                border: "1px solid var(--border-bright)",
                background: "var(--card)",
              }}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "LIGHT" : "DARK"}
            </button>
            <span className="text-[10px] hidden sm:inline" style={{ color: "var(--text-muted)" }}>
              Data by Dune + Allium
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent-green)" }} />
              CONNECTED
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-5">
          {children}
        </div>
      </main>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 lg:px-6 h-7 text-[11px]" style={{ borderTop: "1px solid var(--border)", background: "var(--panel-header)", color: "var(--text-muted)" }}>
        <div className="flex items-center gap-1.5">
          <span style={{ color: "var(--accent-green)" }}>&gt;</span>
          <span>duneuk.com/terminal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">Cache: 6h</span>
          <span>Powered by DefiLlama + Dune + Allium</span>
        </div>
      </div>
    </div>
  );
}
