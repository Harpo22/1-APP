import React, { useState } from "react";
import {
  Briefcase,
  TrendingUp,
  Receipt,
  Banknote,
  Repeat,
  Landmark,
  FileClock,
  Gauge,
  Plus,
  Users,
  Target,
  Pencil,
  Trash2,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { businessMetrics, pctChange } from "../lib/calc.js";
import { prevMonthKey, formatCurrency, formatCompact, formatDate, monthLabel, clamp } from "../lib/format.js";
import { PIPELINE_FIELDS } from "../lib/constants.js";
import {
  GlassCard,
  KpiCard,
  SectionTitle,
  Button,
  Badge,
  ProgressBar,
  EmptyState,
  cx,
} from "../components/ui.jsx";
import { Donut } from "../components/charts.jsx";
import { TransactionModal } from "../components/TransactionModal.jsx";

function PipelineField({ label, value, onChange, money, symbol }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
      <div className="mb-1 text-[11px] font-600 uppercase tracking-wider text-white/40">{label}</div>
      <div className="flex items-center">
        {money && <span className="mr-1 text-sm text-white/40">{symbol}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="tabnum w-full bg-transparent font-display text-lg font-700 text-white focus:outline-none"
        />
      </div>
    </div>
  );
}

function Pipeline() {
  const { data, selectedMonth, symbol, actions } = useApp();
  const pipe = data.pipeline?.[selectedMonth] || {};
  const goals = data.businessGoals || {};
  const b = businessMetrics(data, selectedMonth);
  const bPrev = businessMetrics(data, prevMonthKey(selectedMonth));

  const set = (key, val) => actions.setPipeline(selectedMonth, { [key]: val });

  const totalLeads = pipe.newLeads || 0;
  const dealsClosed = pipe.dealsClosed || 0;
  const conversion = totalLeads ? (dealsClosed / totalLeads) * 100 : 0;
  const leadProgress = goals.monthlyLeadGoal ? (totalLeads / goals.monthlyLeadGoal) * 100 : 0;
  const revProgress = goals.revenueGoal ? (b.revenue / goals.revenueGoal) * 100 : 0;
  const revGrowth = pctChange(b.revenue, bPrev.revenue);

  const groups = [
    { title: "Leads", icon: Users, fields: PIPELINE_FIELDS.leads },
    { title: "Sales", icon: Target, fields: PIPELINE_FIELDS.sales },
    { title: "Revenue", icon: Banknote, fields: PIPELINE_FIELDS.revenue },
  ];

  return (
    <GlassCard className="p-5 sm:p-6">
      <SectionTitle icon={Gauge} title="Business Pipeline" subtitle="Your lightweight sales CRM" />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
          <div className="text-[10px] uppercase tracking-wider text-white/40">Lead Goal</div>
          <div className="tabnum mt-1 text-sm font-700 text-white">{totalLeads}/{goals.monthlyLeadGoal || 0}</div>
          <ProgressBar value={leadProgress} className="mt-2" height={6} color="#6366f1" />
        </div>
        <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
          <div className="text-[10px] uppercase tracking-wider text-white/40">Revenue Goal</div>
          <div className="tabnum mt-1 text-sm font-700 text-white">{formatCompact(b.revenue, symbol)}/{formatCompact(goals.revenueGoal || 0, symbol)}</div>
          <ProgressBar value={revProgress} className="mt-2" height={6} color="#1fe39d" />
        </div>
        <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
          <div className="text-[10px] uppercase tracking-wider text-white/40">Conversion Rate</div>
          <div className="tabnum mt-1 text-sm font-700 text-brand-300">{conversion.toFixed(1)}%</div>
          <div className="mt-1 text-[11px] text-white/35">{dealsClosed} of {totalLeads} leads</div>
        </div>
        <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
          <div className="text-[10px] uppercase tracking-wider text-white/40">Revenue Growth</div>
          <div className={cx("tabnum mt-1 text-sm font-700", revGrowth >= 0 ? "text-brand-300" : "text-red-300")}>
            {revGrowth >= 0 ? "+" : ""}{Math.round(revGrowth)}%
          </div>
          <div className="mt-1 text-[11px] text-white/35">vs last month</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {groups.map((g) => {
          const Icon = g.icon;
          return (
            <div key={g.title}>
              <div className="mb-2 flex items-center gap-2 text-xs font-600 uppercase tracking-wider text-white/45">
                <Icon size={14} className="text-brand-300" /> {g.title}
              </div>
              <div className="space-y-2">
                {g.fields.map((f) => (
                  <PipelineField
                    key={f.key}
                    label={f.label}
                    value={pipe[f.key] || 0}
                    money={f.money}
                    symbol={symbol}
                    onChange={(v) => set(f.key, v)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function RevenueBreakdown() {
  const { data, selectedMonth, symbol } = useApp();
  const b = businessMetrics(data, selectedMonth);

  const agg = (type) => {
    const map = {};
    b.transactions.filter((t) => t.type === type).forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const revenue = agg("income");
  const expenses = agg("expense");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <GlassCard className="p-5">
        <SectionTitle icon={TrendingUp} title="Revenue by Category" />
        {revenue.length ? <Donut data={revenue} symbol={symbol} /> : <EmptyState icon={TrendingUp} title="No revenue logged" />}
      </GlassCard>
      <GlassCard className="p-5">
        <SectionTitle icon={Receipt} title="Expenses by Category" />
        {expenses.length ? <Donut data={expenses} symbol={symbol} /> : <EmptyState icon={Receipt} title="No expenses logged" />}
      </GlassCard>
    </div>
  );
}

function BusinessTransactions({ onEdit }) {
  const { data, selectedMonth, symbol, actions } = useApp();
  const b = businessMetrics(data, selectedMonth);
  const tx = [...b.transactions].sort((a, b) => b.date.localeCompare(a.date));

  if (!tx.length) return <EmptyState icon={Receipt} title="No business transactions" subtitle="Log revenue and expenses to track profit." />;

  return (
    <div className="divide-y divide-white/5">
      {tx.map((t) => {
        const isIncome = t.type === "income";
        return (
          <div key={t.id} className="group flex items-center gap-3 py-3">
            <div className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-700", isIncome ? "bg-brand-500/15 text-brand-300" : "bg-white/5 text-white/60")}>
              {t.category.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-600 text-white">{t.category}</div>
              <div className="truncate text-xs text-white/40">
                {formatDate(t.date)} · {t.paymentMethod}
                {t.notes ? ` · ${t.notes}` : ""}
              </div>
            </div>
            <div className={cx("tabnum shrink-0 text-sm font-700", isIncome ? "text-brand-300" : "text-white/80")}>
              {isIncome ? "+" : "−"}{formatCurrency(t.amount, symbol)}
            </div>
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
              <button onClick={() => onEdit(t)} className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white">
                <Pencil size={14} />
              </button>
              <button onClick={() => actions.deleteTransaction(t.id)} className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/20 hover:text-red-300">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Business() {
  const { data, selectedMonth, symbol } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const prev = prevMonthKey(selectedMonth);
  const b = businessMetrics(data, selectedMonth);
  const bPrev = businessMetrics(data, prev);
  const pipe = data.pipeline?.[selectedMonth] || {};

  const revGrowth = pctChange(b.revenue, bPrev.revenue);
  const growthScore = clamp(
    Math.round(50 + revGrowth * 0.5 + (b.profit > 0 ? 15 : -15) + (pipe.dealsClosed || 0) * 2),
    0,
    100
  );

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (t) => {
    setEditing(t);
    setModalOpen(true);
  };

  const kpis = [
    { label: "Revenue", value: formatCurrency(b.revenue, symbol), icon: TrendingUp, accent: "brand", trend: revGrowth },
    { label: "Profit", value: formatCurrency(b.profit, symbol), icon: Banknote, accent: "brand", trend: pctChange(b.profit, bPrev.profit) },
    { label: "Expenses", value: formatCurrency(b.expenses, symbol), icon: Receipt, accent: "red", trend: pctChange(b.expenses, bPrev.expenses) },
    { label: "Business Cash", value: formatCompact(b.profit > 0 ? b.profit + (b.recurring || 0) : b.recurring, symbol), icon: Landmark, accent: "white" },
    { label: "Recurring Revenue", value: formatCurrency(b.mrr, symbol), icon: Repeat, accent: "blue" },
    { label: "Tax Reserve", value: formatCurrency(b.taxReserve, symbol), icon: Landmark, accent: "gold", sub: `${data.business?.taxReservePct || 25}% set aside` },
    { label: "Outstanding Invoices", value: formatCurrency(b.outstanding, symbol), icon: FileClock, accent: "gold" },
    { label: "Growth Score", value: `${growthScore}`, icon: Gauge, accent: "brand", sub: "out of 100" },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={Briefcase}
        title="Business"
        subtitle={`${monthLabel(selectedMonth)} · kept separate from personal`}
        right={<Button icon={Plus} onClick={openAdd}>Add revenue / expense</Button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} {...k} delay={i * 35} />
        ))}
      </div>

      <Pipeline />
      <RevenueBreakdown />

      <GlassCard className="p-5 sm:p-6">
        <SectionTitle
          icon={Receipt}
          title="Business Transactions"
          subtitle={`${b.transactions.length} this month`}
          right={<Button size="sm" variant="ghost" icon={Plus} onClick={openAdd}>Add</Button>}
        />
        <BusinessTransactions onEdit={openEdit} />
      </GlassCard>

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} scope="business" editing={editing} defaultType="income" />
    </div>
  );
}
