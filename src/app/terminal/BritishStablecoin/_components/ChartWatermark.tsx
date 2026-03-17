"use client";

export default function ChartWatermark() {
  return (
    <div
      className="absolute bottom-2 right-3 pointer-events-none select-none"
      style={{ opacity: 0.12 }}
    >
      <span className="text-[11px] font-bold tracking-wider" style={{ color: "var(--foreground)" }}>
        DUNEUK
      </span>
    </div>
  );
}
