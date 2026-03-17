import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0D0F] scanlines">
      <div className="text-center space-y-6 max-w-lg px-6">
        {/* Terminal boot sequence */}
        <div className="text-left text-[11px] text-[#6B7280] space-y-1 mb-8">
          <p>
            <span className="text-[#FF6B35]">[OK]</span> Dune Analytics
            connection established
          </p>
          <p>
            <span className="text-[#FF6B35]">[OK]</span> Loading on-chain data
            modules...
          </p>
          <p>
            <span className="text-[#FF6B35]">[OK]</span> 7 queries cached
          </p>
          <p>
            <span className="text-[#FF6B35]">[OK]</span> Terminal ready
          </p>
        </div>

        {/* Logo */}
        <h1 className="text-3xl font-bold tracking-tight">
          DUNE<span className="text-[#FF6B35]">UK</span>
        </h1>
        <p className="text-[#6B7280] text-sm">
          On-chain data terminals for the UK crypto ecosystem
        </p>

        {/* Terminal listing */}
        <div className="tui-panel text-left mt-8">
          <div className="tui-panel-header">
            <span className="tui-panel-title">Available Terminals</span>
            <span className="tui-panel-badge">1 active</span>
          </div>
          <div className="p-1">
            <Link
              href="/terminal/BritishStablecoin"
              className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors rounded group"
            >
              <div className="flex items-center gap-3">
                <span className="text-[#FF6B35] text-xs">&gt;</span>
                <div>
                  <span className="text-sm font-bold text-white group-hover:text-[#FF6B35] transition-colors">
                    British Stablecoin Terminal
                  </span>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">
                    GBP stablecoin supply, volume, holders across all chains
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF6B35] animate-pulse" />
                <span className="text-[10px] text-[#6B7280]">LIVE</span>
              </div>
            </Link>
          </div>
        </div>

        <p className="text-[10px] text-[#6B7280] pt-4">
          Built by DuneUK &middot; Powered by Dune Analytics
        </p>
      </div>
    </div>
  );
}
