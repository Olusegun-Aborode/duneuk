"use client"

import { useState } from "react"
import { DataCanvas } from "@/components/data-canvas"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HomeView } from "@/components/views/home-view"
import { DashboardsView } from "@/components/views/dashboards-view"
import { ReportsView } from "@/components/views/reports-view"
import { cn } from "@/lib/utils"

export default function DuneUKPage() {
  const [activeView, setActiveView] = useState("home")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [visibleView, setVisibleView] = useState("home")

  const handleViewChange = (view: string) => {
    if (view === activeView) return
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveView(view)
      setVisibleView(view)
      setIsTransitioning(false)
    }, 400)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[40px_1fr_40px] grid-rows-[60px_1fr_40px] min-h-screen w-full overflow-x-hidden">
      {/* Left Flank - Hidden on mobile */}
      <div className="hidden md:flex flex-col justify-center items-center font-mono text-[10px] text-white/30 [writing-mode:vertical-rl] rotate-180 border-r border-border row-span-3">
        SYS.SEQ // 001-A
      </div>

      <Header activeView={activeView} onViewChange={handleViewChange} />

      {/* Main Content */}
      <main className="col-start-1 md:col-start-2 row-start-2 p-4 md:p-6 lg:p-10 relative flex flex-col overflow-x-hidden overflow-y-auto">
        <DataCanvas />
        
        <div
          className={cn(
            "relative z-10 flex flex-col flex-1 transition-opacity duration-400",
            isTransitioning ? "opacity-0" : "opacity-100"
          )}
        >
          {visibleView === "home" && <HomeView onNavigate={handleViewChange} />}
          {visibleView === "dashboards" && <DashboardsView />}
          {visibleView === "reports" && <ReportsView />}
        </div>
      </main>

      {/* Right Flank - Hidden on mobile */}
      <div className="hidden md:flex flex-col justify-center items-center font-mono text-[10px] text-white/30 [writing-mode:vertical-rl] rotate-180 border-l border-border row-span-3">
        VOL_TRK // ACTIVE
      </div>

      <Footer />
    </div>
  )
}
