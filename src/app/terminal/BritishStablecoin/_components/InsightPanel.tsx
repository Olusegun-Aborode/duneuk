"use client";

interface InsightPanelProps {
  title: string;
  badge?: string;
  icon?: string;
  children: React.ReactNode;
}

export default function InsightPanel({ title, badge, icon = "⚡", children }: InsightPanelProps) {
  return (
    <div className="tui-panel">
      <div className="tui-panel-header">
        <span className="tui-panel-title">{title}</span>
        {badge && <span className="tui-panel-badge">{badge}</span>}
      </div>
      <div className="p-4 lg:p-5">
        <div className="flex gap-3">
          <span className="text-lg leading-none mt-0.5">{icon}</span>
          <div className="text-xs text-[#9CA3AF] leading-relaxed space-y-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
