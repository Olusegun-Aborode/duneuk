"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "duneuk_terminal_unlocked";

export default function EmailGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      setUnlocked(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? "Subscription failed. Please try again."
        );
      }

      localStorage.setItem(STORAGE_KEY, "true");
      setUnlocked(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className="relative">
      {/* Blurred content preview */}
      <div
        className="select-none max-h-[500px] overflow-hidden"
        style={{ filter: "blur(6px)", pointerEvents: "none" }}
      >
        {children}
      </div>

      {/* Terminal-style gate overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-[#0B0D0F]/70 backdrop-blur-sm">
        <div className="tui-panel max-w-md w-full mx-4">
          <div className="tui-panel-header">
            <span className="tui-panel-title">Access Required</span>
            <span className="tui-panel-badge">LOCKED</span>
          </div>
          <div className="p-6 space-y-5">
            {/* Terminal prompt style message */}
            <div className="text-[11px] text-[#6B7280] space-y-1">
              <p>
                <span className="text-[#00FF88]">&gt;</span> Full terminal
                access includes:
              </p>
              <p className="pl-4">
                - Supply over time charts (180d)
              </p>
              <p className="pl-4">
                - Daily active users (90d)
              </p>
              <p className="pl-4">
                - Transfer volume breakdown
              </p>
              <p className="pl-4">
                - Chain distribution analysis
              </p>
              <p className="pl-4">
                - Top holder rankings
              </p>
              <p className="mt-2">
                <span className="text-[#00FF88]">&gt;</span> Enter email to
                unlock
                <span className="cursor-blink" />
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center gap-2 bg-[#0B0D0F] border border-white/[0.08] rounded px-3 py-2.5 focus-within:border-[#00FF88]/40 transition-colors">
                <span className="text-[#00FF88] text-xs">&gt;</span>
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-[#6B7280] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#00FF88] text-[#0B0D0F] font-bold rounded py-2.5 text-xs uppercase tracking-wider hover:bg-[#00FF88]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Authenticating..." : "Unlock Terminal"}
              </button>
            </form>

            {error && (
              <p className="text-[#FF4444] text-[11px]">
                <span className="text-[#FF4444]">[ERR]</span> {error}
              </p>
            )}

            <p className="text-[10px] text-[#6B7280] text-center">
              Join the DuneUK newsletter for full access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
