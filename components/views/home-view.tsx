"use client"

interface HomeViewProps {
  onNavigate: (view: string) => void
}

export function HomeView({ onNavigate }: HomeViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-20 flex-grow items-center py-4 md:py-0">
      {/* Hero Text */}
      <div className="flex flex-col">
        <span className="font-mono text-[10px] uppercase tracking-wide text-text-dim mb-3 md:mb-4">
          <span className="text-accent-orange">■</span> ONCHAIN_DATA
        </span>
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight leading-[1.1] mb-4 md:mb-6 text-balance text-white">
          Decoding the<br />
          UK On-Chain<br />
          Ecosystem.
        </h1>
        
        <p className="font-mono text-white/80 text-[12px] md:text-[13px] max-w-full md:max-w-[80%] mb-6 md:mb-10 leading-relaxed">
          DuneUK is the analytical staging ground for researchers, builders, and data scientists.{" "}
          <span className="text-white">We surface signal from noise</span> across the rapidly evolving Web3 landscape within the United Kingdom. Access curated telemetry or request localized research reports below.
        </p>

        {/* Warning Block */}
        <div className="flex items-start md:items-center gap-3 px-3 py-2 border border-accent-orange/20 bg-accent-orange/5 w-full md:w-fit font-mono text-[9px] md:text-[10px]">
          <svg
            className="w-4 h-4 stroke-accent-orange fill-none shrink-0 mt-0.5 md:mt-0"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="square"
          >
            <path d="M12 2L2 22h20L12 2zm0 7v5m0 4v.01" />
          </svg>
          <div>
            <span className="text-accent-orange block">NOTICE:</span>
            <span className="text-white/70">
              Ecosystem data streams update asynchronously. Verify timestamp per dashboard.
            </span>
          </div>
        </div>
      </div>

      {/* Routing Panels */}
      <div className="flex flex-col gap-3 md:gap-4">
        <RouteCard
          title="Curated Dashboards"
          description="External links to Dune Analytics queries concerning UK DeFi, NFTs, and L2 activity."
          action="ACCESS_REQ"
          onClick={() => onNavigate("dashboards")}
        />
        <RouteCard
          title="Research Reports"
          description="In-depth PDF publications capturing macro trends and institutional on-chain flows."
          action="DOWNLOAD_REQ"
          onClick={() => onNavigate("reports")}
        />
      </div>
    </div>
  )
}

interface RouteCardProps {
  title: string
  description: string
  action: string
  onClick: () => void
}

function RouteCard({ title, description, action, onClick }: RouteCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-surface/60 backdrop-blur-sm border border-border p-4 md:p-6 flex flex-col md:grid md:grid-cols-[1fr_auto] gap-2 md:gap-4 md:items-center text-left transition-all duration-200 hover:bg-surface-hover/80 hover:border-border-light overflow-hidden cursor-pointer"
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-transparent transition-colors duration-200 group-hover:bg-accent-orange" />
      
      <div className="flex flex-col gap-1">
        <span className="text-base md:text-lg font-medium tracking-tight text-white">{title}</span>
        <span className="font-mono text-[10px] md:text-[11px] text-white/70">{description}</span>
      </div>
      
      <span className="font-mono text-[10px] md:text-[11px] text-white/60 transition-colors duration-200 group-hover:text-white">
        {action}
        <span className="hidden group-hover:inline" style={{ animation: "blink 1s step-end infinite" }}> _</span>
      </span>
    </button>
  )
}
