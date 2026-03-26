export function formatGBP(value: number | null | undefined): string {
  const v = value ?? 0;
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `£${(v / 1_000).toFixed(1)}K`;
  return `£${v.toFixed(2)}`;
}

export function formatEUR(value: number | null | undefined): string {
  const v = value ?? 0;
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `€${(v / 1_000).toFixed(1)}K`;
  return `€${v.toFixed(2)}`;
}

export type CurrencyFormat = "GBP" | "EUR" | "ALL";

export function formatNative(value: number | null | undefined, currency: CurrencyFormat): string {
  if (currency === "EUR") return formatEUR(value);
  if (currency === "ALL") return formatUSD(value);
  return formatGBP(value);
}

export function formatUSD(value: number | null | undefined): string {
  const v = value ?? 0;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-GB").format(Math.round(value ?? 0));
}

export function formatPercent(value: number | null | undefined): string {
  return `${(value ?? 0).toFixed(1)}%`;
}

export function formatCompactUSD(value: number | null | undefined): string {
  const v = value ?? 0;
  if (v >= 1_000_000_000_000) return `$${(v / 1_000_000_000_000).toFixed(1)}T`;
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
