"use client";

import { useState } from "react";
import { TOKEN_LOGOS, CHART_COLORS } from "@/lib/constants";

interface TokenLogoProps {
  symbol: string;
  size?: number;
  className?: string;
}

/**
 * Renders a token logo image with a colored-circle fallback.
 * Handles both .png and .svg logos from /public/tokens/.
 */
export function TokenLogo({ symbol, size = 16, className = "" }: TokenLogoProps) {
  const [hasError, setHasError] = useState(false);

  // Strip suffixes like " (SOL)" for logo lookup
  const cleanSymbol = symbol.replace(/\s*\(.*\)$/, "");
  const logoSrc = TOKEN_LOGOS[cleanSymbol];
  const color = (CHART_COLORS as Record<string, string>)[cleanSymbol] ?? "#888";

  if (!logoSrc || hasError) {
    // Fallback: colored circle with token initial
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: color,
          fontSize: size * 0.5,
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1,
          marginRight: 6,
          verticalAlign: "middle",
        }}
        aria-label={cleanSymbol}
      >
        {cleanSymbol.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSrc}
      alt={cleanSymbol}
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      style={{
        borderRadius: "50%",
        marginRight: 6,
        verticalAlign: "middle",
        objectFit: "cover",
      }}
      onError={() => setHasError(true)}
    />
  );
}
