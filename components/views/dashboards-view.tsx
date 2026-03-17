"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const filters = ["ALL_CHAINS", "ETHEREUM", "BASE", "SOLANA"]

const dashboards = [
  {
    tag: "STABLECOIN",
    title: "State of British Stablecoin",
    author: "@duneuk",
    lastExec: "LIVE",
    metricLabel: "GBP_TRACKED",
    metricValue: "£2.1B",
    href: "https://dune.com/duneuk/stablecoin-analysis-british-sterling-pound",
  },
  {
    tag: "GAMEFI",
    title: "DexWin",
    author: "@duneuk",
    lastExec: "LIVE",
    metricLabel: "PLAYERS",
    metricValue: "45.2K",
    href: "https://dune.com/duneuk/dexwinofficial",
  },
]

export function DashboardsView() {
  const [activeFilter, setActiveFilter] = useState("ALL_CHAINS")

  return (
    <div className="flex flex-col h-full">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8 border-b border-border pb-3">
        <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-wide text-white/50 leading-relaxed">
          FILTER:
        </span>
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "bg-transparent border-none font-mono text-[9px] sm:text-[10px] md:text-[11px] uppercase p-0 cursor-pointer transition-colors duration-200",
              activeFilter === filter ? "text-accent-orange" : "text-white/60 hover:text-white"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-px bg-border border border-border">
        {dashboards.map((dashboard) => (
          <a
            key={dashboard.title}
            href={dashboard.href}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-bg p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col transition-colors duration-200 hover:bg-surface group"
          >
            <div className="flex flex-col">
              <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-wide text-white/60 mb-1">
                {dashboard.tag}
              </span>
              <h3 className="text-sm sm:text-base md:text-base lg:text-lg font-medium tracking-tight mb-2 text-white">
                {dashboard.title}
              </h3>
              <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-wide text-white/60 mb-2 sm:mb-3 md:mb-4">
                AUTHOR: {dashboard.author}
              </span>
            </div>
            
            <div className="mt-auto flex flex-col gap-1.5 sm:gap-2">
              <div>
                <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-wide text-white/50 block mb-1">
                  LAST_EXEC
                </span>
                <span className="font-mono text-[9px] sm:text-[10px] md:text-[11px] text-white/70">
                  {dashboard.lastExec}
                </span>
              </div>
              <div>
                <span className="font-mono text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-wide text-white/50 block mb-1">
                  {dashboard.metricLabel}
                </span>
                <span className="font-mono text-lg sm:text-xl md:text-xl lg:text-2xl font-light tracking-tight text-accent-orange">
                  {dashboard.metricValue}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
