"use client"

import { useState } from "react"
import Link from "next/link"
import { DataCanvas } from "@/components/data-canvas"

export default function StablecoinQ1Report() {
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
          source: "report_stablecoin_q1_2026",
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
          REP_GBP_ISSUE_2
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
          MAR_2026
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
                BY DUNE_UK RESEARCH // ISSUE #2
              </span>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium tracking-tight mb-2 text-balance text-white">
                STATE OF BRITISH STABLECOIN Q1 2026
              </h1>
              <p className="text-white/70 text-[13px] md:text-[14px]">
                Regulatory Progress, On-Chain Shifts, and the Integration Challenge
              </p>
            </div>

            {/* Description */}
            <div className="mb-4 md:mb-6">
              <p className="text-white/80 text-[12px] md:text-[13px] leading-relaxed mb-3 md:mb-4">
                In December 2025, Dune UK published its first report on the state of GBP stablecoins. The findings were stark: a regulatory superhighway was being built, but the vehicles needed to run on it were scarce. Total GBP stablecoin supply sat at approximately £40 million, trading was confined to niche DEX activity, and there was zero integration with DeFi lending and borrowing protocols.
              </p>
              <p className="text-white/60 text-[12px] md:text-[13px] italic">
                Three months on, the picture has shifted. This report tracks what has changed — and what hasn{"'"}t.
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
                  <span><span className="text-white font-medium">UK Regulatory Progress</span> <span className="text-white/60">— Updates from December 2025 to February 2026.</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-white/50">2.</span>
                  <span><span className="text-white font-medium">The On-Chain Data Scope</span> <span className="text-white/60">— Methodology and data sources.</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-white/50">3.</span>
                  <span><span className="text-white font-medium">DEX Activity & Active Addresses</span> <span className="text-white/60">— Trading volume and user engagement metrics.</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-white/50">4.</span>
                  <span><span className="text-white font-medium">Market Share Analysis</span> <span className="text-white/60">— New entrants vs the old guard.</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-white/50">5.</span>
                  <span><span className="text-white font-medium">Lending & Borrowing</span> <span className="text-white/60">— DeFi integration status check.</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-white/50">6.</span>
                  <span><span className="text-white font-medium">The Integration Challenge</span> <span className="text-white/60">— Is the fundamental problem any closer to being solved?</span></span>
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
                <div className="flex justify-between items-start mb-6">
                  <span className="font-mono text-[10px] text-white/60">DUNE_UK</span>
                  <span className="font-mono text-[10px] text-accent-orange">ISSUE #2</span>
                </div>
                
                {/* Visual Element - Supply Chart */}
                <div className="flex-1 flex items-center justify-center mb-6">
                  <svg viewBox="0 0 200 150" className="w-full h-auto max-h-[180px]">
                    {/* Background grid */}
                    {[0, 30, 60, 90, 120, 150].map((y) => (
                      <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#1a1a20" strokeWidth="0.5" />
                    ))}
                    
                    {/* Y-axis labels */}
                    <text x="5" y="35" fill="#6e6e77" fontSize="6" fontFamily="monospace">£60M</text>
                    <text x="5" y="65" fill="#6e6e77" fontSize="6" fontFamily="monospace">£40M</text>
                    <text x="5" y="95" fill="#6e6e77" fontSize="6" fontFamily="monospace">£20M</text>
                    <text x="5" y="125" fill="#6e6e77" fontSize="6" fontFamily="monospace">£0</text>
                    
                    {/* Area chart representing supply growth */}
                    <defs>
                      <linearGradient id="supplyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f45b49" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#f45b49" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    
                    {/* Supply area */}
                    <path 
                      d="M30 120 L60 115 L90 100 L120 85 L150 70 L180 55 L180 130 L30 130 Z" 
                      fill="url(#supplyGradient)"
                    />
                    <path 
                      d="M30 120 L60 115 L90 100 L120 85 L150 70 L180 55" 
                      fill="none" 
                      stroke="#f45b49" 
                      strokeWidth="2"
                    />
                    
                    {/* Data points */}
                    <circle cx="30" cy="120" r="3" fill="#f45b49" />
                    <circle cx="90" cy="100" r="3" fill="#f45b49" />
                    <circle cx="180" cy="55" r="3" fill="#f45b49" />
                    
                    {/* X-axis labels */}
                    <text x="30" y="145" fill="#6e6e77" fontSize="6" fontFamily="monospace" textAnchor="middle">Q4</text>
                    <text x="90" y="145" fill="#6e6e77" fontSize="6" fontFamily="monospace" textAnchor="middle">DEC</text>
                    <text x="150" y="145" fill="#6e6e77" fontSize="6" fontFamily="monospace" textAnchor="middle">JAN</text>
                    <text x="180" y="145" fill="#6e6e77" fontSize="6" fontFamily="monospace" textAnchor="middle">FEB</text>
                    
                    {/* Annotation */}
                    <text x="130" y="45" fill="#f45b49" fontSize="7" fontFamily="monospace">+50% SUPPLY</text>
                  </svg>
                </div>

                {/* Title Block */}
                <div className="mt-auto bg-bg/80 p-4 border-t border-border">
                  <h3 className="text-[14px] font-medium mb-1 text-white">
                    State of British Stablecoin
                  </h3>
                  <p className="text-[10px] text-white/60 mb-2">
                    Q1 2026: Regulatory Progress & The Integration Challenge
                  </p>
                  <p className="font-mono text-[9px] text-white/40">
                    March 2026
                  </p>
                </div>
              </div>

              {/* Page number */}
              <div className="absolute bottom-3 right-4 font-mono text-[9px] text-white/40">
                28 pages
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Flank - Hidden on mobile */}
      <div className="hidden md:flex row-span-3 border-l border-border items-center justify-center">
        <span className="font-mono text-[9px] tracking-[0.3em] text-white/30 uppercase [writing-mode:vertical-lr]">
          GBP_STABLECOIN // Q1_2026
        </span>
      </div>

      {/* Footer */}
      <footer className="col-start-1 md:col-start-2 border-t border-border px-4 md:px-6 lg:px-10 flex items-center justify-between">
        <span className="font-mono text-[8px] md:text-[9px] text-white/40">DUNE_UK // 2026</span>
        <span className="font-mono text-[8px] md:text-[9px] text-white/40">28 PAGES // 4.2MB</span>
      </footer>
    </div>
  )
}
