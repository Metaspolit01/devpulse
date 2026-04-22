import type { Period } from "@/types";
import { Activity } from "lucide-react";

// ─── Period options ───────────────────────────────────────────────────────────

const PERIODS: { label: string; value: Period }[] = [
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "12 months", value: "12m" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface LayoutProps {
  children: React.ReactNode;
  period: Period;
  onPeriodChange: (p: Period) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Layout({ children, period, onPeriodChange }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Header ── */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-primary">
              <Activity
                className="w-4 h-4 text-primary-foreground"
                strokeWidth={2.5}
              />
            </span>
            <span className="font-display font-semibold text-base tracking-tight text-foreground">
              DevPulse
            </span>
            <span className="hidden sm:block text-xs text-muted-foreground font-mono ml-1">
              Developer Productivity
            </span>
          </div>

          {/* Period selector */}
          <nav
            className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg"
            aria-label="Time period"
            data-ocid="period.tab"
          >
            {PERIODS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => onPeriodChange(value)}
                data-ocid={`period.${value}.tab`}
                aria-pressed={period === value}
                className={[
                  "px-3 py-1 rounded-md text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  period === value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 bg-background">{children}</main>
    </div>
  );
}
