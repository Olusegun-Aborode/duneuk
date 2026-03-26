"use client";

import { useState } from "react";
import { CHAIN_LOGOS } from "@/lib/constants";

interface ChainLogoProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}

/**
 * Renders a blockchain chain logo image with a colored-circle fallback.
 */
export function ChainLogo({ name, size = 16, color = "#888", className = "" }: ChainLogoProps) {
  const [hasError, setHasError] = useState(false);

  const cleanName = name.toLowerCase();
  const logoSrc = CHAIN_LOGOS[cleanName];

  if (!logoSrc || hasError) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: color,
          fontSize: size * 0.45,
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1,
          marginRight: 6,
          verticalAlign: "middle",
        }}
        aria-label={name}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSrc}
      alt={name}
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
