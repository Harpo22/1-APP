import React, { useState } from "react";
import {
  Wallet,
  ShoppingBag,
  Receipt,
  Fuel,
  PiggyBank,
  LineChart,
  Flame,
  Trophy,
  Plus,
  Pencil,
  Trash2,
  Gauge,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import {
  personalMetrics,
  wealthScore,
  scoreTier,
  wasteAnalytics,
  pctChange,
} from "../lib/calc.js";
import { prevMonthKey, formatCurrency, formatDate, monthLabel } from "../lib/format.js";
import {
  GlassCard,
  KpiCard,
  SectionTitle,
  BudgetTracker,
  Button,
  Badge,
  EmptyState,
  ProgressBar,
  cx,
} from "../components/ui.jsx";
import { BarTrend } from "../components/charts.jsx";
import { TransactionModal } from "../components/TransactionModal.jsx";

function TransactionList({ onEdit }) {
  const { data, selectedMonth, symbol, actions } = useApp();
  const p = personalMetrics(data, selectedMonth);
  const tx = [...p.transactions].sort((a, b) => b.date.localeCompare(a.date));

  if (!tx.length)
    return (
      <EmptyState
        icon={Receipt}
        title="No transactions yet"
        subtitle={`Add your first ${monthLabel(selectedMonth)} transaction to start tracking.`}
      />
    );

  return (
    <div className="divide-y divide-white/5">
      {tx.map((t) => {
        const isIncome = t.type === "income";
        const wasted = t.necessary === false || t.category === "Wasted Money";
        return (
          <div key={t.id} className="group flex items-center gap-3 py-3">
            <div
              className={cx(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-700",
                isIncome ? "bg-brand-500/15 text-brand-300" : wasted ? "bg-red-500/15 text-red-300" : "bg-white/5 text-white/60"
              )}
            >
              {t.category.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-600 text-white">{t.category}</span>
                {wasted && <Badge color="red">Wasted</Badge>}
              </div>
              <div className="truncate text-xs text-white/40">
                {formatDate(t.date)} · {t.paymentMethod}
                {t.notes ? ` · ${t.notes}` : ""}
              </div>
            </div>
            <div className={cx("tabnum shrink-0 text-sm font-700", isIncome ? "text-brand-300" : "text-white/80")}>
              {isIncome ? "+" : "−"}
              {formatCurrency(t.amount, symbol)}
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

function WasteSystem() {
  const { data, selectedMonth, symbol } = useApp();
  const wa = wasteAnalytics(data, selectedMonth);
  const budget = data.personalBudgets?.wastedMoneyLimit || 0;

  return (
    <GlassCard className="p-5 sm:p-6">
      <SectionTitle
        icon={Flame}
        title="Wasted Money System"
        subtitle="Every unnecessary pound moves you further from freedom"
        right={<Badge color={wa.reduction >= 0 ? "brand" : "red"}>{wa.reduction >= 0 ? "↓" : "↑"} {Math.abs(Math.round(wa.reduction))}% vs last mo</Badge>}
      />

      <div className="rounded-xl border border-red-400/15 bg-red-500/5 p-4">
        <div className="flex items-center gap-2 text-sm text-red-200">
          <AlertTriangle size={16} />
          <span className="font-600">
            If wasted spending was reduced by 50%, you'd save {formatCurrency(wa.annualIfHalved, symbol)} per year.
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-600 uppercase tracking-wider text-white/40">Waste Trend (6 mo)</div>
          <BarTrend
            data={wa.series.map((s) => ({ ...s, color: s.value > budget ? "#ff6b6b" : "#ffcf4d" }))}
            symbol={symbol}
            height={180}
          />
        </div>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-600 uppercase tracking-wider text-white/40">
              <span>Top Waste Categories</span>
            </div>
            <div className="space-y-2">
              {wa.byCategory.slice(0, 4).map(([cat, amt]) => (
                <div key={cat}>
                  <div className="mb-1 flex justify-between text-xs text-white/60">
                    <span>{cat}</span>
                    <span className="tabnum">{formatCurrency(amt, symbol)}</span>
                  </div>
                  <ProgressBar value={amt} max={wa.byCategory[0][1]} color="#ff6b6b" height={6} />
                </div>
              ))}
              {!wa.byCategory.length && <p className="text-sm text-white/40">No wasted spending recorded. Excellent discipline.</p>}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-600 uppercase tracking-wider text-white/40">Most Common Triggers</div>
            <div className="flex flex-wrap gap-2">
              {wa.byTrigger.slice(0, 6).map(([trig, count]) => (
                <Badge key={trig} color="white">
                  {trig} · {count}
                </Badge>
              ))}
              {!wa.byTrigger.length && <span className="text-sm text-white/40">—</span>}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export default function Personal() {
  const { data, selectedMonth, symbol } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const prev = prevMonthKey(selectedMonth);
  const p = personalMetrics(data, selectedMonth);
  const pPrev = personalMetrics(data, prev);
  const budgets = data.personalBudgets || {};
  const { score } = wealthScore(data, selectedMonth);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (t) => {
    setEditing(t);
    setModalOpen(true);
  };

  const kpis = [
    { label: "Income", value: formatCurrency(p.income, symbol), icon: Wallet, accent: "brand", trend: pctChange(p.income, pPrev.income) },
    { label: "Spending", value: formatCurrency(p.spending, symbol), icon: ShoppingBag, accent: "white", trend: pctChange(p.spending, pPrev.spending) },
    { label: "Bills", value: formatCurrency(p.bills, symbol), icon: Receipt, accent: "white", trend: pctChange(p.bills, pPrev.bills) },
    { label: "Fuel", value: formatCurrency(p.fuel, symbol), icon: Fuel, accent: "white", trend: pctChange(p.fuel, pPrev.fuel) },
    { label: "Savings", value: formatCurrency(p.savings, symbol), icon: PiggyBank, accent: "brand", trend: pctChange(p.savings, pPrev.savings) },
    { label: "Investments", value: formatCurrency(p.investments, symbol), icon: LineChart, accent: "brand", trend: pctChange(p.investments, pPrev.investments) },
    { label: "Wasted Money", value: formatCurrency(p.wasted, symbol), icon: Flame, accent: "red", trend: pctChange(p.wasted, pPrev.wasted) },
    { label: "Wealth Score", value: `${score}`, icon: Trophy, accent: "gold", sub: scoreTier(score).label },
  ];

  const trackers = [
    { label: "General Spending Budget", spent: p.generalSpending, budget: budgets.generalSpending, trend: pctChange(p.generalSpending, pPrev.generalSpending) },
    { label: "Fuel Budget", spent: p.fuel, budget: budgets.fuel, trend: pctChange(p.fuel, pPrev.fuel) },
    { label: "Bills Budget", spent: p.bills, budget: budgets.bills, trend: pctChange(p.bills, pPrev.bills) },
    { label: "Savings Goal", spent: p.savings, budget: budgets.savingsGoal, invertGood: true, trend: pctChange(p.savings, pPrev.savings) },
    { label: "Investment Goal", spent: p.investments, budget: budgets.investmentGoal, invertGood: true, trend: pctChange(p.investments, pPrev.investments) },
    { label: "Wasted Money Limit", spent: p.wasted, budget: budgets.wastedMoneyLimit, trend: pctChange(p.wasted, pPrev.wasted) },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={Wallet}
        title="Personal Finance"
        subtitle={monthLabel(selectedMonth)}
        right={<Button icon={Plus} onClick={openAdd}>Add transaction</Button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} {...k} delay={i * 35} />
        ))}
      </div>

      <GlassCard className="p-5 sm:p-6">
        <SectionTitle icon={Gauge} title="Monthly Progress Trackers" subtitle="Budgets, goals & limits vs trend" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trackers.map((t) => (
            <BudgetTracker key={t.label} {...t} symbol={symbol} />
          ))}
        </div>
      </GlassCard>

      <WasteSystem />

      <GlassCard className="p-5 sm:p-6">
        <SectionTitle
          icon={Receipt}
          title="Transactions"
          subtitle={`${p.transactions.length} this month`}
          right={<Button size="sm" variant="ghost" icon={Plus} onClick={openAdd}>Add</Button>}
        />
        <TransactionList onEdit={openEdit} />
      </GlassCard>

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} scope="personal" editing={editing} />
    </div>
  );
}
