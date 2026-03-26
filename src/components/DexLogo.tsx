"use client";

import { useState } from "react";
import { DEX_LOGOS, DEX_COLORS } from "@/lib/constants";

interface DexLogoProps {
  name: string;
  size?: number;
  className?: string;
}

/**
 * Renders a DEX platform logo image with a colored-circle fallback.
 */
export function DexLogo({ name, size = 16, className = "" }: DexLogoProps) {
  const [hasError, setHasError] = useState(false);

  const cleanName = name.toLowerCase();
  const logoSrc = DEX_LOGOS[cleanName];
  const color = DEX_COLORS[cleanName] ?? "#888";

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
