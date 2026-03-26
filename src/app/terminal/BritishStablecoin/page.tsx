"use client";

import { useState, useCallback } from "react";
import MarketOverview from "./_components/MarketOverview";
import SupplyLeaderboard from "./_components/SupplyLeaderboard";
import EmailGate from "./_components/EmailGate";
import SupplyChart from "./_components/SupplyChart";
import TransferVolume from "./_components/TransferVolume";
import DailyActiveUsers from "./_components/DailyActiveUsers";
import ChainDistribution from "./_components/ChainDistribution";
import TopHolders from "./_components/TopHolders";
import DexVolume from "./_components/DexVolume";
import DexPlatforms from "./_components/DexPlatforms";
import MarketShareComparison from "./_components/MarketShareComparison";
import LendingUtilization from "./_components/LendingUtilization";
import YieldOpportunities from "./_components/YieldOpportunities";
import Methodology from "./_components/Methodology";
import NewsletterArchive from "./_components/NewsletterArchive";
import ScreenshotButton from "./_components/ScreenshotButton";
import { CurrencyFilterProvider } from "@/contexts/CurrencyFilterContext";
import { CurrencyFilter } from "@/components/CurrencyFilter";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "utilisation", label: "Utilisation" },
  { id: "methodology", label: "Methodology" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SECTIONS: Record<TabId, { id: string; label: string }[]> = {
  overview: [
    { id: "leaderboard", label: "Leaderboard" },
    { id: "supply-dau", label: "Supply & DAU" },
    { id: "transfers", label: "Transfers & Market Share" },
    { id: "holdings", label: "Holdings" },
  ],
  utilisation: [
    { id: "dex-volume", label: "DEX Volume" },
    { id: "dex-platforms", label: "Platforms & Lending" },
    { id: "lp-pools", label: "Yield" },
  ],
  methodology: [],
};

function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  if (sections.length === 0) return null;

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => scrollTo(s.id)}
          className="text-[10px] px-2.5 py-1 rounded border transition-colors hover:text-[var(--accent-green)] hover:border-[var(--accent-green)]"
          style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

function SectionDivider({ id, label }: { id: string; label: string }) {
  return (
    <div id={id} className="scroll-mt-4">
      <div className="tui-divider-labeled">
        <span className="tui-divider-label">{label}</span>
      </div>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-4">
      <SectionNav sections={SECTIONS.overview} />

      <SectionDivider id="leaderboard" label="Leaderboard" />
      <SupplyLeaderboard />

      <SectionDivider id="supply-dau" label="Supply & Activity" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SupplyChart />
        <DailyActiveUsers />
      </div>

      <SectionDivider id="transfers" label="Transfer Volume & Market Share" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TransferVolume />
        <MarketShareComparison />
      </div>

      <SectionDivider id="holdings" label="Holdings" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChainDistribution />
        <TopHolders />
      </div>
    </div>
  );
}

function UtilisationTab() {
  return (
    <div className="space-y-4">
      <SectionNav sections={SECTIONS.utilisation} />

      <SectionDivider id="dex-volume" label="DEX Volume" />
      <DexVolume />

      <SectionDivider id="dex-platforms" label="DEX Platforms & Lending" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DexPlatforms />
        <LendingUtilization />
      </div>

      <SectionDivider id="lp-pools" label="Liquidity Pools" />
      <YieldOpportunities />
    </div>
  );
}

export default function BritishStablecoinPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [pendingTab, setPendingTab] = useState<TabId | null>(null);

  // Two-frame tab switch: paint button highlight immediately, swap content next frame
  const switchTab = useCallback((tab: TabId) => {
    setPendingTab(tab);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setActiveTab(tab);
        setPendingTab(null);
      });
    });
  }, []);

  return (
    <CurrencyFilterProvider>
      <div id="terminal-content" className="space-y-4">
        {/* Header bar */}
        <div className="flex items-end justify-between flex-wrap gap-2">
          <div>
            <a
              href="https://www.duneuk.com/"
              className="inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors mb-1"
            >
              <span>&larr;</span> Back to DuneUK
            </a>
            <div className="flex items-center gap-2">
              <span className="text-[var(--accent-green)] text-xs font-bold">&pound;</span>
              <h1 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
                Stablecoin Terminal
              </h1>
            </div>
            <p className="text-[var(--text-muted)] text-[11px] mt-0.5">
              Real-time supply, volume and holder data &middot; 8 tokens &middot;
              GBP &amp; EUR &middot; 15+ chain deployments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ScreenshotButton targetId="terminal-content" />
          </div>
        </div>

        {/* Tab nav */}
        <nav className="flex gap-0.5 border-b border-[var(--border)]">
          {TABS.map((tab) => {
            const isActive = (pendingTab ?? activeTab) === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`text-[11px] uppercase tracking-wider px-4 py-2 border-b-2 transition-colors ${
                  isActive
                    ? "text-[var(--accent-green)] border-[var(--accent-green)]"
                    : "text-[var(--text-muted)] border-transparent hover:text-[var(--foreground)] hover:border-[var(--border-bright)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Counters row */}
        <MarketOverview />

        {/* Gated content */}
        <EmailGate>
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "utilisation" && <UtilisationTab />}
          {activeTab === "methodology" && <Methodology />}
        </EmailGate>

        {/* Newsletter — always visible below gated content */}
        <NewsletterArchive />
      </div>
    </CurrencyFilterProvider>
  );
}
