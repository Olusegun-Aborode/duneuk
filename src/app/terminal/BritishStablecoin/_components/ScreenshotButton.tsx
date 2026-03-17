"use client";

import { useState, useCallback } from "react";
import { toPng } from "html-to-image";

export default function ScreenshotButton({ targetId }: { targetId: string }) {
  const [capturing, setCapturing] = useState(false);

  const handleCapture = useCallback(async () => {
    const node = document.getElementById(targetId);
    if (!node) return;

    setCapturing(true);
    try {
      const dataUrl = await toPng(node, {
        backgroundColor: getComputedStyle(document.documentElement)
          .getPropertyValue("--background")
          .trim(),
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `duneuk-terminal-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Screenshot failed:", err);
    } finally {
      setCapturing(false);
    }
  }, [targetId]);

  return (
    <button
      onClick={handleCapture}
      disabled={capturing}
      className="text-[10px] px-2 py-0.5 rounded transition-colors"
      style={{
        color: "var(--text-muted)",
        border: "1px solid var(--border-bright)",
        background: "var(--card)",
      }}
      title="Download screenshot"
    >
      {capturing ? "CAPTURING..." : "SCREENSHOT"}
    </button>
  );
}
