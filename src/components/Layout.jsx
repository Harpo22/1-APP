import React, { useState } from "react";
import {
  Gauge,
  Wallet,
  Briefcase,
  Landmark,
  ClipboardCheck,
  BarChart3,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { addMonths, monthLabel, currentMonthKey } from "../lib/format.js";
import { wealthScore, scoreTier } from "../lib/calc.js";
import { cx } from "./ui.jsx";

export const NAV = [
  { id: "mission", label: "Mission Control", short: "Mission", icon: Gauge },
  { id: "personal", label: "Personal", short: "Personal", icon: Wallet },
  { id: "business", label: "Business", short: "Business", icon: Briefcase },
  { id: "legacy", label: "Legacy Building", short: "Legacy", icon: Landmark },
  { id: "reviews", label: "Monthly Reviews", short: "Reviews", icon: ClipboardCheck },
  { id: "analytics", label: "Analytics", short: "Stats", icon: BarChart3 },
  { id: "settings", label: "Settings", short: "Settings", icon: SettingsIcon },
];

function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-ink-950 shadow-glow">
        <Activity size={18} strokeWidth={2.6} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-sm font-800 tracking-tight text-white">MONEY OS</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">Wealth System</div>
        </div>
      )}
    </div>
  );
}

function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useApp();
  const isCurrent = selectedMonth === currentMonthKey();
  return (
    <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
      <button
        onClick={() => setSelectedMonth((m) => addMonths(m, -1))}
        className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
        aria-label="Previous month"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={() => setSelectedMonth(currentMonthKey())}
        className={cx(
          "min-w-[120px] rounded-lg px-2 py-1 text-center text-xs font-600 sm:text-sm",
          isCurrent ? "text-white" : "text-brand-300"
        )}
        title="Jump to current month"
      >
        {monthLabel(selectedMonth)}
      </button>
      <button
        onClick={() => setSelectedMonth((m) => addMonths(m, 1))}
        className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
        aria-label="Next month"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function ScoreChip() {
  const { data, selectedMonth } = useApp();
  const { score } = wealthScore(data, selectedMonth);
  const tier = scoreTier(score);
  return (
    <div className="hidden items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 sm:flex">
      <div className="relative grid h-8 w-8 place-items-center">
        <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={tier.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 94} 94`}
          />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="tabnum text-sm font-700 text-white">{score}</div>
        <div className="text-[10px] uppercase tracking-wide" style={{ color: tier.color }}>
          {tier.label}
        </div>
      </div>
    </div>
  );
}

export function Layout({ active, setActive, children }) {
  const { data } = useApp();
  const name = data.settings?.name || "Founder";

  return (
    <div className="app-bg min-h-screen text-white">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/8 bg-ink-900/60 px-4 py-6 backdrop-blur-xl lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={cx(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-600 transition",
                  isActive ? "bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/20" : "text-white/55 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon size={18} className={cx(isActive ? "text-brand-300" : "text-white/45 group-hover:text-white")} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-4 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
          <p className="text-[11px] leading-relaxed text-white/40">
            “Every pound has a job. Spend like the person you’re becoming.”
          </p>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-white/8 bg-ink-950/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="lg:hidden">
                <Logo compact />
              </div>
              <div className="hidden flex-col leading-tight lg:flex">
                <span className="text-xs text-white/40">Welcome back,</span>
                <span className="font-display text-sm font-700 text-white">{name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <ScoreChip />
              <MonthSelector />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:pb-12">{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink-950/85 backdrop-blur-xl lg:hidden">
        <div className="no-scrollbar mx-auto flex max-w-2xl items-stretch justify-between overflow-x-auto px-1 py-1.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={cx(
                  "flex min-w-[64px] flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-600 transition",
                  isActive ? "text-brand-300" : "text-white/45"
                )}
              >
                <Icon size={19} />
                {item.short}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
