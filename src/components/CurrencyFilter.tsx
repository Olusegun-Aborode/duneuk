"use client";

import { useState, useRef, useEffect } from "react";
import {
  useCurrencyFilter,
  getTokensForCurrency,
  type CurrencyFilter as CurrencyFilterType,
} from "@/contexts/CurrencyFilterContext";
import { CHART_COLORS } from "@/lib/constants";

const OPTIONS: { value: CurrencyFilterType; label: string; flag: string }[] = [
  { value: "GBP", label: "GBP", flag: "\u{1F1EC}\u{1F1E7}" },
  { value: "EUR", label: "EUR", flag: "\u{1F1EA}\u{1F1FA}" },
  { value: "ALL", label: "ALL", flag: "" },
];

export function CurrencyFilter() {
  const { currency, setCurrency, selectedTokens, setSelectedTokens } = useCurrencyFilter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const tokens = getTokensForCurrency(currency);

  const toggleToken = (token: string) => {
    if (selectedTokens.includes(token)) {
      setSelectedTokens(selectedTokens.filter((t) => t !== token));
    } else {
      setSelectedTokens([...selectedTokens, token]);
    }
  };

  const selectAll = () => setSelectedTokens([]);
  const clearAll = () => setSelectedTokens([...tokens]);

  const buttonLabel =
    selectedTokens.length === 0
      ? "All Tokens"
      : `${selectedTokens.length} token${selectedTokens.length !== 1 ? "s" : ""}`;

  return (
    <div className="flex items-center gap-2 text-[11px] font-mono">
      <span className="text-[#6B7280] mr-1 hidden sm:inline">CURRENCY:</span>
      {OPTIONS.map((opt) => {
        const isActive = currency === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setCurrency(opt.value)}
            className="px-3 py-1 rounded transition-all"
            style={{
              color: isActive ? "var(--foreground)" : "var(--text-muted)",
              backgroundColor: isActive ? "var(--accent-green)15" : "transparent",
              border: `1px solid ${isActive ? "var(--accent-green)" : "var(--border)"}`,
              fontWeight: isActive ? 700 : 400,
            }}
          >
            {opt.flag ? `${opt.flag} ` : ""}{opt.label}
          </button>
        );
      })}

      {/* Token filter dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="px-3 py-1 rounded transition-all flex items-center gap-1.5"
          style={{
            color: selectedTokens.length > 0 ? "var(--foreground)" : "var(--text-muted)",
            backgroundColor: selectedTokens.length > 0 ? "var(--accent-green)15" : "transparent",
            border: `1px solid ${selectedTokens.length > 0 ? "var(--accent-green)" : "var(--border)"}`,
            fontWeight: selectedTokens.length > 0 ? 700 : 400,
          }}
        >
          <span>{buttonLabel}</span>
          <span
            className="text-[9px] transition-transform"
            style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            &#x25BC;
          </span>
        </button>

        {dropdownOpen && (
          <div
            className="absolute right-0 top-full mt-1 z-50 rounded border shadow-lg min-w-[180px] max-h-[320px] overflow-y-auto"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
            }}
          >
            {/* Select All / Clear buttons */}
            <div
              className="flex items-center justify-between px-3 py-1.5 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <button
                onClick={selectAll}
                className="text-[10px] hover:text-[var(--accent-green)] transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                Select All
              </button>
              <button
                onClick={clearAll}
                className="text-[10px] hover:text-[var(--accent-green)] transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                Clear
              </button>
            </div>

            {/* Token checkboxes */}
            <div className="py-1">
              {tokens.map((token) => {
                const isChecked =
                  selectedTokens.length === 0 || selectedTokens.includes(token);
                const color =
                  (CHART_COLORS as Record<string, string>)[token] ?? "#888";

                return (
                  <label
                    key={token}
                    className="flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-[var(--border)]"
                    style={{ transition: "background-color 0.1s" }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleToken(token)}
                      className="accent-[var(--accent-green)] w-3 h-3"
                    />
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span
                      className="text-[11px] font-mono"
                      style={{ color: "var(--foreground)" }}
                    >
                      {token}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
