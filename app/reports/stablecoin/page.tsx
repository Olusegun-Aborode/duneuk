"use client"

import { useState } from "react"
import Link from "next/link"
import { DataCanvas } from "@/components/data-canvas"

export default function StablecoinReportPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "report_stablecoin",
        }),
      })

      if (!response.ok) {
        throw new Error("Subscription failed")
      }

      setSubmitted(true)
    } catch {
      setError("Failed to submit. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen md:h-screen bg-bg grid grid-cols-1 md:grid-cols-[40px_1fr_40px] grid-rows-[60px_1fr_40px] overflow-y-auto md:overflow-hidden">
      {/* Left Flank - Hidden on mobile */}
      <div className="hidden md:flex row-span-3 border-r border-border items-center justify-center">
        <span className="font-mono text-[9px] tracking-[0.3em] text-white/30 uppercase [writing-mode:vertical-lr] rotate-180">
          REP_2025_Q1+
        </span>
      </div>

      {/* Header */}
      <header className="col-start-1 md:col-start-2 border-b border-border px-4 md:px-6 lg:px-10 flex items-center justify-between">
        <Link 
          href="/"
          className="font-mono text-[9px] md:text-[10px] uppercase tracking-wide text-white/60 hover:text-white transition-colors"
        >
          {"<"} BACK
        </Link>
        <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-wide text-white/60">
          DEC_2025
        </span>
      </header>

      {/* Main Content */}
      <main className="col-start-1 md:col-start-2 row-start-2 px-4 md:px-6 lg:px-10 py-6 relative flex items-center">
        <DataCanvas />
        
        <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
          {/* Left Column - Content */}
          <div className="flex flex-col">
            {/* Header */}
            <div className="mb-4 md:mb-6">
              <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-wide text-white/60 block mb-2 md:mb-3">
                BY DUNE_UK RESEARCH
              </span>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium tracking-tight mb-2 text-balance text-white">
                STATE OF BRITISH STABLECOIN Q4 2025
              </h1>
              <p className="text-white/70 text-[13px] md:text-[14px]">
                Issuer Flows, Peg Stability, and Institutional Adoption
              </p>
            </div>

            {/* Description */}
            <div className="mb-4 md:mb-6">
              <p className="text-white/80 text-[12px] md:text-[13px] leading-relaxed mb-3 md:mb-4">
                British pound stablecoins are no longer just trading collateral — they{"'"}re becoming payment infrastructure. This report analyzes £300B+ in labeled payment volume across 150+ blockchains to answer the questions that matter: Who{"'"}s paying whom? Where is adoption actually happening? And which use cases are growing fastest?
              </p>
              <p className="text-white/60 text-[12px] md:text-[13px] italic">
                For payment networks, fintech builders, and institutional investors evaluating the GBP stablecoin opportunity.
              </p>
            </div>

            {/* Author */}
            <div className="mb-4 md:mb-6">
              <p className="text-[12px] md:text-[13px] text-white/60">
                By <span className="text-white underline">Research Team</span>, DuneUK Analytics
              </p>
            </div>

            {/* What's Inside */}
            <div className="mb-4 md:mb-6">
              <h2 className="font-mono text-[10px] md:text-[11px] uppercase tracking-wide text-white mb-3 md:mb-4">
                What{"'"}s inside:
              </h2>
              <ol className="space-y-1.5 md:space-y-2 text-[12px] md:text-[13px]">
                <li className="flex gap-2">
                  <span className="text-white/50">1.</span>
                  <span><span className="text-white font-medium">Payment adoption by use case</span> <span className="text-white/60">— B2B, B2C, C2B, C2C volume and growth rates.</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-white/50">2.</span>
                  <span><span className="text-white font-medium">Geographic flows & corridors</span> <span className="text-white/60">— Regional breakdown, top cross-border corridors.</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-white/50">3.</span>
                  <span><span className="text-white font-medium">Liquidity & holder concentration</span> <span className="text-white/60">— Who holds stablecoins: exchanges, consumers, businesses.</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-white/50">4.</span>
                  <span><span className="text-white font-medium">Velocity & maturity signals</span> <span className="text-white/60">— Turnover rates by chain and over time.</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-white/50">5.</span>
                  <span><span className="text-white font-medium">Blockchain infrastructure</span> <span className="text-white/60">— Supply, volume, and transaction count by chain.</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-white/50">6.</span>
                  <span><span className="text-white font-medium">Strategic implications</span> <span className="text-white/60">— What the data means for payment networks and builders.</span></span>
                </li>
              </ol>
            </div>

            {/* Download Button / Form */}
            {submitted ? (
              <div className="font-mono text-accent-orange text-[12px]">
                {"[ SUCCESS: CHECK YOUR INBOX ]"}
              </div>
            ) : showForm ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
                {error && (
                  <span className="font-mono text-accent-orange text-[11px]">{error}</span>
                )}
                <div className="flex items-center gap-2 font-mono text-[12px] border border-border bg-surface px-3 py-2">
                  <span className="text-accent-orange">{">"}</span>
                  <input
                    type="email"
                    required
                    placeholder="your@email.co.uk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="bg-transparent border-none text-white font-mono text-[12px] w-full outline-none placeholder:text-white/30 disabled:opacity-50"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-accent-orange text-bg font-mono text-[11px] uppercase tracking-wide px-4 py-2 hover:bg-accent-orange/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Send Report"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="font-mono text-[11px] text-white/60 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="w-fit bg-accent-orange text-bg font-mono text-[12px] uppercase tracking-wide px-6 py-3 hover:bg-accent-orange/90 transition-colors"
              >
                Download the Report
              </button>
            )}
          </div>

          {/* Right Column - Report Preview */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-[3/4] border border-border-light bg-surface p-6 flex flex-col">
              {/* Report Cover Mock */}
              <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="mb-6">
                  <span className="font-mono text-[10px] text-white/60">DUNE_UK</span>
                </div>
                
                {/* Visual Element - Abstract Chart */}
                <div className="flex-1 flex items-center justify-center mb-6">
                  <svg viewBox="0 0 200 120" className="w-full h-auto max-h-[180px]">
                    {/* Grid lines */}
                    {[0, 30, 60, 90, 120].map((y) => (
                      <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#1a1a20" strokeWidth="0.5" />
                    ))}
                    {/* Area chart */}
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f45b49" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f45b49" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,100 Q25,95 50,80 T100,60 T150,30 T200,20 L200,120 L0,120 Z"
                      fill="url(#chartGradient)"
                    />
                    <path
                      d="M0,100 Q25,95 50,80 T100,60 T150,30 T200,20"
                      fill="none"
                      stroke="#f45b49"
                      strokeWidth="2"
                    />
                    {/* Data points */}
                    {[
                      [0, 100], [50, 80], [100, 60], [150, 30], [200, 20]
                    ].map(([x, y], i) => (
                      <circle key={i} cx={x} cy={y} r="3" fill="#f45b49" />
                    ))}
                  </svg>
                </div>

                {/* Title Block */}
                <div className="mt-auto bg-bg/80 p-4 border-t border-border">
                  <h3 className="text-[14px] font-medium mb-1 text-white">
                    State of British Stablecoin
                  </h3>
                  <p className="text-[10px] text-white/60 mb-2">
                    Issuer Flows, Peg Stability, and Institutional Adoption
                  </p>
                  <p className="font-mono text-[9px] text-white/40">
                    January 2025
                  </p>
                </div>
              </div>

              {/* Page number */}
              <div className="absolute bottom-3 right-4 font-mono text-[9px] text-white/40">
                32 pages
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Flank - Hidden on mobile */}
      <div className="hidden md:flex row-span-3 border-l border-border items-center justify-center">
        <span className="font-mono text-[9px] tracking-[0.3em] text-white/30 uppercase [writing-mode:vertical-lr]">
          STABLECOIN // ANALYSIS
        </span>
      </div>

      {/* Footer */}
      <footer className="col-start-1 md:col-start-2 border-t border-border px-4 md:px-6 lg:px-10 flex items-center justify-between">
        <span className="font-mono text-[8px] md:text-[9px] text-white/40">DUNE_UK // 2025</span>
        <span className="font-mono text-[8px] md:text-[9px] text-white/40">32 PAGES // 5.8MB</span>
      </footer>
    </div>
  )
}
