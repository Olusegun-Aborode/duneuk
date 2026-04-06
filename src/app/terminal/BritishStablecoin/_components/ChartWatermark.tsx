"use client";

export default function ChartWatermark() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
      aria-hidden
    >
      <span
        className="font-bold tracking-[0.25em]"
        style={{
          color: "var(--foreground)",
          opacity: 0.07,
          fontSize: "clamp(28px, 6vw, 56px)",
          letterSpacing: "0.25em",
        }}
      >
        DUNEUK
      </span>
    </div>
  );
}
