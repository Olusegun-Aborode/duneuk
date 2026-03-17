"use client"

import { useState } from "react"
import Link from "next/link"

const reports = [
  {
    id: "REP_GBP_ISSUE_1",
    title: "State of British Stablecoin Q4 2025",
    description:
      "Our inaugural report on GBP stablecoins examining the regulatory superhighway being built and the scarcity of vehicles to run on it. Covers total supply (~40M GBP), niche DEX activity, and zero DeFi integration.",
    pages: "32",
    size: "5.8MB",
    pubDate: "DEC_2025",
    href: "/reports/stablecoin",
  },
  {
    id: "REP_GBP_ISSUE_2",
    title: "State of British Stablecoin Q1 2026",
    description:
      "Issue #2 picks up where Issue #1 left off. Tracks regulatory progress between December 2025 and February 2026, examines on-chain data shifts, and assesses whether the Integration challenge is any closer to being solved.",
    pages: "28",
    size: "4.2MB",
    pubDate: "MAR_2026",
    href: "/reports/stablecoin-q1-2026",
  },
]

export function ReportsView() {
  return (
    <div className="flex-1 flex flex-col justify-center py-8">
      <div className="flex flex-col gap-8 sm:gap-10 md:gap-12">
        {reports.map((report) => (
          <ReportItem key={report.id} report={report} />
        ))}
      </div>
    </div>
  )
}

interface Report {
  id: string
  title: string
  description: string
  pages: string
  size: string
  pubDate: string
  href: string
}

function ReportItem({ report }: { report: Report }) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")

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
          source: `report_${report.id}` 
        }),
      })
      
      if (!response.ok) {
        throw new Error("Subscription failed")
      }
      
      setSubmitted(true)
    } catch {
      setError("TRANSFER_FAILED")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] lg:grid-cols-[2fr_1fr] gap-4 sm:gap-6 md:gap-8 lg:gap-10 pb-6 sm:pb-8 md:pb-10 border-b border-border last:border-b-0 last:pb-0 items-start">
      {/* Report Info */}
      <div className="flex flex-col gap-4 md:gap-5">
        <Link href={report.href} className="block group">
          <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-wide text-white/60 block mb-2">
            <span className="text-accent-orange">■</span> {report.id}
          </span>
          <h2 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-medium tracking-tight text-white group-hover:text-accent-orange transition-colors">
            {report.title}
          </h2>
        </Link>
        
        <p className="text-white/80 text-[13px] md:text-sm leading-relaxed max-w-2xl">{report.description}</p>
        
        <div className="flex flex-wrap gap-4 md:gap-8 font-mono mt-1 md:mt-2">
          <div>
            <span className="text-[9px] md:text-[10px] uppercase tracking-wide text-white/50 block mb-1">PAGES</span>
            <span className="text-[11px] md:text-xs text-white">{report.pages}</span>
          </div>
          <div>
            <span className="text-[9px] md:text-[10px] uppercase tracking-wide text-white/50 block mb-1">SIZE</span>
            <span className="text-[11px] md:text-xs text-white">{report.size}</span>
          </div>
          <div>
            <span className="text-[9px] md:text-[10px] uppercase tracking-wide text-white/50 block mb-1">PUB_DATE</span>
            <span className="text-[11px] md:text-xs text-white">{report.pubDate}</span>
          </div>
        </div>
      </div>

      {/* Terminal Form */}
      <div className="bg-surface/70 backdrop-blur-md border border-border p-4 md:p-5 flex flex-col gap-3 md:gap-4">
        <div className="flex justify-between items-start">
          <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-wide text-white/60">
            SECURE_PAYLOAD
          </span>
          <span className="font-mono text-[9px] md:text-[10px] text-white/60">PDF_FORMAT</span>
        </div>
        
        {submitted ? (
          <span className="font-mono text-accent-orange text-[12px]">
            {"[ SUCCESS: PAYLOAD_DISPATCHED ]"}
          </span>
        ) : (
          <>
            <div className="font-mono text-[11px] text-white/70">
              Supply valid routing address to receive document.
            </div>
            
            {error && (
              <span className="font-mono text-accent-orange text-[11px]">
                {"[ ERROR: "}{error}{" ]"}
              </span>
            )}
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 font-mono text-[12px] border-b border-border-light pb-1">
                <span className="text-accent-orange">{">"}</span>
                <input
                  type="email"
                  required
                  placeholder="user@domain.co.uk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-transparent border-none text-white font-mono text-[12px] w-full outline-none placeholder:text-white/30 disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-transparent border-none text-white/60 font-mono text-[11px] text-left p-0 cursor-pointer hover:text-white transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? "PROCESSING..." : "EXECUTE_TRANSFER"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
