"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type CurrencyFilter = "GBP" | "EUR" | "ALL";

interface CurrencyFilterContextValue {
  currency: CurrencyFilter;
  setCurrency: (c: CurrencyFilter) => void;
}

const CurrencyFilterContext = createContext<CurrencyFilterContextValue>({
  currency: "ALL",
  setCurrency: () => {},
});

const STORAGE_KEY = "duneuk-currency-filter";

export function CurrencyFilterProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyFilter>("ALL");

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "GBP" || stored === "EUR" || stored === "ALL") {
      setCurrencyState(stored);
    }
  }, []);

  const setCurrency = (c: CurrencyFilter) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  };

  return (
    <CurrencyFilterContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyFilterContext.Provider>
  );
}

export function useCurrencyFilter() {
  return useContext(CurrencyFilterContext);
}

/** Token lists by currency group */
export const GBP_TOKENS = ["tGBP", "GBPm", "GBPe", "GBPT", "VGBP", "eGBP"] as const;
export const EUR_TOKENS = ["EURC", "EURT", "EURS", "EURA", "EURe", "EURCV", "EURI", "EUROe", "EURQ", "EUROP", "EURR", "EURAU", "PAR", "sEUR", "EURL"] as const;
export const ALL_TOKENS = [...GBP_TOKENS, ...EUR_TOKENS] as const;

/** Helper to get the token list for a currency filter */
export function getTokensForCurrency(currency: CurrencyFilter): readonly string[] {
  switch (currency) {
    case "GBP": return GBP_TOKENS;
    case "EUR": return EUR_TOKENS;
    case "ALL": return ALL_TOKENS;
  }
}

/** Helper to check if a token belongs to a currency group */
export function tokenMatchesCurrency(token: string, currency: CurrencyFilter): boolean {
  if (currency === "ALL") return true;
  if (currency === "GBP") return (GBP_TOKENS as readonly string[]).includes(token);
  if (currency === "EUR") return (EUR_TOKENS as readonly string[]).includes(token);
  return false;
}
