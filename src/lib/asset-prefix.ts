/**
 * Returns the correct base URL for static assets in /public/.
 * In production, www.duneuk.com proxies the app but doesn't serve
 * /public/ files directly — they live on the Vercel deployment URL.
 */
export function getAssetPrefix(): string {
  if (typeof window === "undefined") return "";
  if (window.location.hostname === "localhost") return "";
  return "https://duneuk-terminal.vercel.app";
}

export function assetUrl(path: string): string {
  return `${getAssetPrefix()}${path}`;
}
