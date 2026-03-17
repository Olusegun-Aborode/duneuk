"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface HeaderProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function Header({ activeView, onViewChange }: HeaderProps) {
  const pathname = usePathname()
  const isTerminalActive = pathname?.startsWith("/terminal")
  
  const navItems = [
    { id: "home", label: "INDEX" },
    { id: "dashboards", label: "DASHBOARDS" },
    { id: "reports", label: "REPORTS" },
  ]

  return (
    <header className="col-start-1 md:col-start-2 row-start-1 flex justify-between items-center border-b border-border px-3 md:px-4">
      <nav className="flex items-center gap-2 md:gap-3 font-mono text-[10px] md:text-[11px] text-white/60">
        {/* Logo */}
        <Image
          src="/logo.png"
          alt="DuneUK Logo"
          width={20}
          height={20}
          className="block shrink-0"
        />
        
        <span className="text-white/30 hidden sm:inline">/</span>
        
        {navItems.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => onViewChange(item.id)}
              className={cn(
                "relative transition-colors duration-200 hover:text-white cursor-pointer whitespace-nowrap",
                activeView === item.id && !isTerminalActive ? "text-white pl-2 md:pl-3" : "pl-0"
              )}
            >
              {activeView === item.id && !isTerminalActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-accent-orange" />
              )}
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.label.slice(0, 3)}</span>
            </button>
            <span className="text-white/30">/</span>
          </div>
        ))}
        
        {/* Terminal Link */}
        <Link
          href="/terminal/BritishStablecoin"
          className={cn(
            "relative transition-colors duration-200 hover:text-white whitespace-nowrap",
            isTerminalActive ? "text-white pl-2 md:pl-3" : "pl-0"
          )}
        >
          {isTerminalActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-accent-orange" />
          )}
          <span className="hidden sm:inline">TERMINAL</span>
          <span className="sm:hidden">TER</span>
        </Link>
      </nav>

      <div className="flex items-center gap-2 font-mono text-[9px] md:text-[10px] uppercase shrink-0">
        <span className="text-white/60 hidden sm:inline">UK_NODE_CONNECTED</span>
        <span className="text-white/60 sm:hidden">UK</span>
        <div 
          className="w-1.5 h-1.5 bg-accent-orange"
          style={{ animation: "pulse 2s infinite" }}
        />
      </div>
    </header>
  )
}
