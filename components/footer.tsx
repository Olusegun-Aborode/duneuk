"use client"

import { useEffect, useState } from "react"

export function Footer() {
  const [time, setTime] = useState("00:00:00 UTC")

  useEffect(() => {
    function updateClock() {
      const now = new Date()
      const timeString = now.toISOString().substring(11, 19) + " UTC"
      setTime(timeString)
    }

    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="col-start-1 md:col-start-2 row-start-3 border-t border-border flex justify-between items-center px-3 md:px-4">
      <div className="font-mono text-[8px] md:text-[9px] text-white/40 overflow-hidden whitespace-nowrap w-1/2 relative hidden sm:block">
        <span 
          className="inline-block"
          style={{ animation: "scrollText 20s linear infinite" }}
        >
          0x8f...3a9 executed swap // ETH gas: 14gwei // Block 18459201 verified // 0x2b...11c contract deployed // USDC transfer volume +4% 1H // 0x8f...3a9 executed swap // ETH gas: 14gwei // Block 18459201 verified // 0x2b...11c contract deployed // USDC transfer volume +4% 1H //
        </span>
      </div>
      <span className="sm:hidden font-mono text-[8px] text-white/40">DUNE_UK</span>
      
      <div className="flex items-center gap-2 font-mono text-[9px] md:text-[10px] uppercase">
        <span className="text-white/70">{time}</span>
      </div>
    </footer>
  )
}
