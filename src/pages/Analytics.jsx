import React, { useMemo, useState } from "react";
import {
  BarChart3,
  ShoppingBag,
  PiggyBank,
  TrendingUp,
  Banknote,
  Landmark,
  Flame,
  Users,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { personalMetrics, businessMetrics, netWorthForMonth } from "../lib/calc.js";
import {
  lastNMonths,
  addMonths,
  monthLabel,
  monthKeyFromDate,
  parseMonthKey,
  MONTH_SHORT,
  formatCompact,
} from "../lib/format.js";
import { GlassCard, SectionTitle, cx } from "../components/ui.jsx";
import { AreaTrend, BarTrend } from "../components/charts.jsx";

const TIMEFRAMES = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
  { id: "year", label: "Year" },
];

const METRICS = [
  { id: "spending", label: "Spending", icon: ShoppingBag, color: "#ff9f40", chart: "bar" },
  { id: "savings", label: "Savings", icon: PiggyBank, color: "#1fe39d", chart: "area" },
  { id: "revenue", label: "Revenue", icon: TrendingUp, color: "#54f3b8", chart: "area" },
  { id: "profit", label: "Profit", icon: Banknote, color: "#22d3ee", chart: "bar" },
  { id: "netWorth", label: "Net Worth", icon: Landmark, color: "#ffcf4d", chart: "area" },
  { id: "waste", label: "Waste", icon: Flame, color: "#ff6b6b", chart: "bar" },
  { id: "leads", label: "Leads", icon: Users, color: "#6366f1", chart: "bar", money: false },
];

function monthMetrics(data, key) {
  const p = personalMetrics(data, key);
  const b = businessMetrics(data, key);
  return {
    spending: p.spending,
    savings: p.savings + p.investments,
    revenue: b.revenue,
    profit: b.profit,
    netWorth: netWorthForMonth(data, key),
    waste: p.wasted,
    leads: data.pipeline?.[key]?.newLeads || 0,
  };
}

function weeklyBuckets(data, endKey, weeks = 8) {
  // Build trailing weekly buckets ending at end of selected month
  const { year, monthIndex } = parseMonthKey(endKey);
  const end = new Date(year, monthIndex + 1, 0); // last day of month
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(end);
    start.setDate(end.getDate() - (i + 1) * 7 + 1);
    const stop = new Date(end);
    stop.setDate(end.getDate() - i * 7);
    buckets.push({
      label: `${start.getDate()} ${MONTH_SHORT[start.getMonth()]}`,
      start: start.toISOString().slice(0, 10),
      stop: stop.toISOString().slice(0, 10),
      spending: 0,
      savings: 0,
      revenue: 0,
      profit: 0,
      waste: 0,
      netWorth: 0,
      leads: 0,
    });
  }
  data.transactions.forEach((t) => {
    const bucket = buckets.find((bk) => t.date >= bk.start && t.date <= bk.stop);
    if (!bucket) return;
    if (t.scope === "personal") {
      if (t.type === "expense") {
        if (["Savings", "Investments"].includes(t.category)) bucket.savings += t.amount;
        else bucket.spending += t.amount;
        if (t.necessary === false || t.category === "Wasted Money") bucket.waste += t.amount;
      }
    } else {
      if (t.type === "income") {
        bucket.revenue += t.amount;
        bucket.profit += t.amount;
      } else bucket.profit -= t.amount;
    }
  });
  return buckets;
}

export default function Analytics() {
  const { data, selectedMonth, symbol } = useApp();
  const [timeframe, setTimeframe] = useState("month");
  const [metricId, setMetricId] = useState("revenue");
  const metric = METRICS.find((m) => m.id === metricId);

  const series = useMemo(() => {
    if (timeframe === "week") {
      return weeklyBuckets(data, selectedMonth, 8).map((bk) => ({ label: bk.label, ...bk }));
    }
    if (timeframe === "month") {
      return lastNMonths(selectedMonth, 12).map((k) => ({ label: monthLabel(k, true), ...monthMetrics(data, k) }));
    }
    if (timeframe === "quarter") {
      const months = lastNMonths(selectedMonth, 24);
      const groups = {};
      months.forEach((k) => {
        const { year, monthIndex } = parseMonthKey(k);
        const q = Math.floor(monthIndex / 3) + 1;
        const id = `${year}-Q${q}`;
        if (!groups[id]) groups[id] = { label: `Q${q} ${String(year).slice(2)}`, keys: [] };
        groups[id].keys.push(k);
      });
      return Object.values(groups)
        .slice(-8)
        .map((g) => aggregate(data, g.keys, g.label));
    }
    // year
    const months = lastNMonths(selectedMonth, 60);
    const groups = {};
    months.forEach((k) => {
      const { year } = parseMonthKey(k);
      if (!groups[year]) groups[year] = { label: String(year), keys: [] };
      groups[year].keys.push(k);
    });
    return Object.values(groups)
      .slice(-5)
      .map((g) => aggregate(data, g.keys, g.label));
  }, [data, selectedMonth, timeframe]);

  const total = series.reduce((a, s) => a + (s[metricId] || 0), 0);
  const avg = series.length ? total / series.length : 0;
  const latest = series[series.length - 1]?.[metricId] || 0;
  const first = series[0]?.[metricId] || 0;
  const change = first ? ((latest - first) / Math.abs(first)) * 100 : 0;
  const money = metric.money !== false;

  return (
    <div className="space-y-6">
      <SectionTitle icon={BarChart3} title="Analytics" subtitle="Trends across your entire wealth system" />

      <GlassCard className="p-2">
        <div className="flex gap-1">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeframe(t.id)}
              className={cx(
                "flex-1 rounded-xl px-3 py-2 text-sm font-600 transition",
                timeframe === t.id ? "bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/20" : "text-white/50 hover:bg-white/5"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {METRICS.map((m) => {
          const Icon = m.icon;
          const active = metricId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMetricId(m.id)}
              className={cx(
                "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-600 ring-1 transition",
                active ? "bg-white/10 text-white ring-white/20" : "bg-white/[0.03] text-white/50 ring-white/8 hover:text-white"
              )}
              style={active ? { color: m.color } : undefined}
            >
              <Icon size={15} /> {m.label}
            </button>
          );
        })}
      </div>

      <GlassCard className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5" style={{ color: metric.color }}>
              <metric.icon size={18} />
            </span>
            <div>
              <h3 className="font-display text-lg font-700 text-white">{metric.label} Trend</h3>
              <p className="text-xs text-white/45">{TIMEFRAMES.find((t) => t.id === timeframe).label}ly view</p>
            </div>
          </div>
          <div className="flex gap-5">
            <Summary label="Latest" value={money ? formatCompact(latest, symbol) : Math.round(latest)} />
            <Summary label="Average" value={money ? formatCompact(avg, symbol) : Math.round(avg)} />
            <Summary label="Change" value={`${change >= 0 ? "+" : ""}${Math.round(change)}%`} color={change >= 0 ? "text-brand-300" : "text-red-300"} />
          </div>
        </div>
        {metric.chart === "area" ? (
          <AreaTrend data={series} dataKey={metricId} color={metric.color} symbol={symbol} height={300} money={money} />
        ) : (
          <BarTrend data={series} dataKey={metricId} color={metric.color} symbol={symbol} height={300} money={money} />
        )}
      </GlassCard>
    </div>
  );
}

function aggregate(data, keys, label) {
  const out = { label, spending: 0, savings: 0, revenue: 0, profit: 0, waste: 0, leads: 0, netWorth: 0 };
  keys.forEach((k) => {
    const m = monthMetrics(data, k);
    out.spending += m.spending;
    out.savings += m.savings;
    out.revenue += m.revenue;
    out.profit += m.profit;
    out.waste += m.waste;
    out.leads += m.leads;
    out.netWorth = m.netWorth; // end-of-period snapshot
  });
  return out;
}

function Summary({ label, value, color = "text-white" }) {
  return (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className={cx("tabnum font-display text-base font-700", color)}>{value}</div>
    </div>
  );
}
