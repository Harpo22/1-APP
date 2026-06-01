import React from "react";
import {
  Landmark,
  Target,
  Trophy,
  Wallet,
  Briefcase,
  PiggyBank,
  Flame,
  TrendingUp,
  Coins,
  Banknote,
  AlertTriangle,
  Sparkles,
  Rocket,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import {
  freedomMetrics,
  personalMetrics,
  businessMetrics,
  netWorthForMonth,
  wealthScore,
  scoreTier,
  redFlags,
  cashAvailable,
  businessCash,
  pctChange,
} from "../lib/calc.js";
import { prevMonthKey, formatCurrency, formatCompact, monthLabel } from "../lib/format.js";
import { GlassCard, KpiCard, ProgressBar, SectionTitle, Badge, cx } from "../components/ui.jsx";

function HeroScore() {
  const { data, selectedMonth, symbol } = useApp();
  const { score } = wealthScore(data, selectedMonth);
  const tier = scoreTier(score);
  const fm = freedomMetrics(data, selectedMonth);
  const winning = score >= 61;

  return (
    <GlassCard strong className="relative overflow-hidden p-5 sm:p-7">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
        style={{ background: `${tier.color}22` }}
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <Badge color={winning ? "brand" : "gold"}>
            {winning ? "You're winning this month" : "Time to tighten up"}
          </Badge>
          <h1 className="mt-3 font-display text-2xl font-800 leading-tight tracking-tight text-white sm:text-3xl">
            {monthLabel(selectedMonth)} Command Centre
          </h1>
          <p className="mt-1.5 max-w-md text-sm text-white/50">
            Net worth of <span className="font-600 text-white">{formatCurrency(fm.currentNetWorth, symbol)}</span> · {Math.round(fm.overall)}% of
            the way to financial freedom.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge color="blue">Monthly income {formatCompact(fm.currentMonthlyIncome, symbol)}</Badge>
            <Badge color="gold">Target {formatCompact(fm.desiredMonthlyIncome, symbol)}</Badge>
          </div>
        </div>

        {/* Wealth score ring */}
        <div className="flex items-center gap-5">
          <div className="relative grid h-32 w-32 place-items-center">
            <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={tier.color}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 326.7} 326.7`}
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="tabnum font-display text-4xl font-800 text-white">{score}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/40">Wealth Score</span>
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs uppercase tracking-wider text-white/40">Tier</div>
            <div className="font-display text-xl font-800" style={{ color: tier.color }}>
              {tier.label}
            </div>
            <div className="mt-2 text-[11px] text-white/40">0–40 Weak · 41–60 Avg</div>
            <div className="text-[11px] text-white/40">61–80 Strong · 81+ Elite</div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function RedFlags() {
  const { data, selectedMonth } = useApp();
  const flags = redFlags(data, selectedMonth);
  if (!flags.length)
    return (
      <GlassCard className="flex items-center gap-3 p-4">
        <CheckCircle2 size={20} className="text-brand-300" />
        <p className="text-sm text-white/70">No red flags this month — you're operating with discipline.</p>
      </GlassCard>
    );
  return (
    <div className="space-y-2">
      {flags.map((f, i) => (
        <div
          key={i}
          className={cx(
            "flex items-center gap-3 rounded-xl px-4 py-3 ring-1 animate-fade-up",
            f.level === "danger" ? "bg-red-500/10 ring-red-400/20" : "bg-gold-500/10 ring-gold-400/20"
          )}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <AlertTriangle size={18} className={f.level === "danger" ? "text-red-300" : "text-gold-400"} />
          <p className={cx("text-sm font-500", f.level === "danger" ? "text-red-100" : "text-gold-300")}>{f.text}</p>
        </div>
      ))}
    </div>
  );
}

function FreedomTracker() {
  const { data, selectedMonth, symbol } = useApp();
  const fm = freedomMetrics(data, selectedMonth);

  const rows = [
    {
      label: "Monthly Income",
      current: fm.currentMonthlyIncome,
      target: fm.desiredMonthlyIncome,
      progress: fm.incomeProgress,
      color: "#1fe39d",
    },
    {
      label: "Annual Income",
      current: fm.currentAnnualIncome,
      target: fm.desiredAnnualIncome,
      progress: fm.annualProgress,
      color: "#54f3b8",
    },
    {
      label: "Net Worth",
      current: fm.currentNetWorth,
      target: fm.desiredNetWorth,
      progress: fm.netWorthProgress,
      color: "#ffcf4d",
    },
  ];

  return (
    <GlassCard className="p-5 sm:p-6">
      <SectionTitle
        icon={Target}
        title="Financial Freedom Tracker"
        subtitle="Your distance to a work-optional life"
        right={
          <div className="text-right">
            <div className="font-display text-3xl font-800 text-brand-300">{Math.round(fm.overall)}%</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">Freedom Progress</div>
          </div>
        }
      />
      <div className="space-y-5">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-2 flex items-end justify-between">
              <span className="text-sm font-600 text-white/70">{r.label}</span>
              <span className="tabnum text-sm text-white/55">
                {formatCurrency(r.current, symbol)}{" "}
                <span className="text-white/30">/ {formatCurrency(r.target, symbol)}</span>
              </span>
            </div>
            <ProgressBar value={r.progress} color={r.color} height={12} showMarkers />
            <div className="mt-1 flex justify-between text-[11px] text-white/40">
              <span>{Math.round(r.progress)}% complete</span>
              <span>{formatCurrency(Math.max(0, r.target - r.current), symbol)} remaining</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Amount Remaining" value={formatCurrency(fm.amountRemaining, symbol)} sub="to target income" />
        <MiniStat
          label="Est. Completion"
          value={fm.completion?.label ? fm.completion.label : fm.overall >= 100 ? "Achieved" : "—"}
          sub={fm.completion?.monthsNeeded ? `${fm.completion.monthsNeeded} months` : "keep growing"}
        />
        <MiniStat label="Best Month" value={fm.best ? formatCompact(fm.best.value, symbol) : "—"} sub={fm.best?.label || ""} />
        <MiniStat label="Net Worth Gap" value={formatCompact(fm.netWorthRemaining, symbol)} sub="to dream number" />
      </div>
    </GlassCard>
  );
}

function MiniStat({ label, value, sub }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="tabnum mt-1 font-display text-base font-700 text-white">{value}</div>
      {sub && <div className="text-[11px] text-white/35">{sub}</div>}
    </div>
  );
}

function FutureSelf() {
  const { data } = useApp();
  const fs = data.futureSelf || {};
  return (
    <GlassCard className="relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
      <SectionTitle icon={Sparkles} title="Future Self" subtitle="Why you're building wealth" />
      <p className="mb-5 rounded-xl bg-white/[0.04] px-4 py-3 text-center font-display text-base font-600 italic text-white/80 ring-1 ring-white/5">
        “Every pound has a job. Spend like the person you're becoming.”
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <VisionCard icon={Rocket} title="Lifestyle Vision" text={fs.lifestyleVision} />
        <VisionCard icon={Target} title="Financial Freedom Goal" text={fs.freedomGoal} />
        <VisionCard icon={Landmark} title="Dream Net Worth" text={fs.dreamNetWorth ? `£${Number(fs.dreamNetWorth).toLocaleString("en-GB")}` : ""} />
        <VisionCard icon={Flame} title="Main Reason" text={fs.mainReason} />
      </div>
    </GlassCard>
  );
}

function VisionCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/5">
      <div className="mb-1.5 flex items-center gap-2 text-xs font-600 uppercase tracking-wider text-white/40">
        <Icon size={14} className="text-brand-300" /> {title}
      </div>
      <p className="text-sm leading-relaxed text-white/70">{text || "Add this in Settings → Future Self."}</p>
    </div>
  );
}

export default function MissionControl() {
  const { data, selectedMonth, symbol } = useApp();
  const prev = prevMonthKey(selectedMonth);
  const p = personalMetrics(data, selectedMonth);
  const pPrev = personalMetrics(data, prev);
  const b = businessMetrics(data, selectedMonth);
  const bPrev = businessMetrics(data, prev);
  const fm = freedomMetrics(data, selectedMonth);
  const { score } = wealthScore(data, selectedMonth);
  const nw = netWorthForMonth(data, selectedMonth);
  const nwPrev = netWorthForMonth(data, prev);

  const kpis = [
    { label: "Net Worth", value: formatCompact(nw, symbol), icon: Landmark, accent: "gold", trend: pctChange(nw, nwPrev) },
    { label: "Freedom Progress", value: `${Math.round(fm.overall)}%`, icon: Target, accent: "brand", sub: `target ${formatCompact(fm.desiredMonthlyIncome, symbol)}/mo` },
    { label: "Wealth Score", value: `${score}/100`, icon: Trophy, accent: "brand", sub: scoreTier(score).label },
    { label: "Monthly Income", value: formatCompact(fm.currentMonthlyIncome, symbol), icon: Wallet, accent: "white", trend: pctChange(p.income, pPrev.income) },
    { label: "Business Revenue", value: formatCompact(b.revenue, symbol), icon: Briefcase, accent: "blue", trend: pctChange(b.revenue, bPrev.revenue) },
    { label: "Savings This Month", value: formatCurrency(p.savings, symbol), icon: PiggyBank, accent: "brand", trend: pctChange(p.savings, pPrev.savings) },
    { label: "Wasted This Month", value: formatCurrency(p.wasted, symbol), icon: Flame, accent: "red", trend: pctChange(p.wasted, pPrev.wasted) },
    { label: "Business Profit", value: formatCompact(b.profit, symbol), icon: TrendingUp, accent: "brand", trend: pctChange(b.profit, bPrev.profit) },
    { label: "Cash Available", value: formatCompact(cashAvailable(data), symbol), icon: Coins, accent: "white" },
    { label: "Business Cash", value: formatCompact(businessCash(data, selectedMonth), symbol), icon: Banknote, accent: "blue" },
  ];

  return (
    <div className="space-y-6">
      <HeroScore />
      <RedFlags />
      <div>
        <SectionTitle title="Key Metrics" subtitle="Are you winning this month?" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map((k, i) => (
            <KpiCard key={k.label} {...k} delay={i * 40} />
          ))}
        </div>
      </div>
      <FreedomTracker />
      <FutureSelf />
    </div>
  );
}
