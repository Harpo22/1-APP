import React, { useState } from "react";
import {
  Landmark,
  TrendingUp,
  Trophy,
  Plus,
  Pencil,
  Trash2,
  Shield,
  Home,
  Briefcase,
  Crown,
  Target,
  Wallet,
  Award,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import {
  netWorthSnapshot,
  netWorthForMonth,
  wealthScore,
  scoreTier,
  monthlyRanking,
  gradeColor,
} from "../lib/calc.js";
import {
  prevMonthKey,
  addMonths,
  formatCurrency,
  formatCompact,
  monthLabel,
  lastNMonths,
  parseMonthKey,
  clamp,
  uid,
} from "../lib/format.js";
import { ASSET_FIELDS, LIABILITY_FIELDS } from "../lib/constants.js";
import {
  GlassCard,
  SectionTitle,
  Button,
  Badge,
  ProgressBar,
  MoneyInput,
  Field,
  Input,
  Modal,
  EmptyState,
  cx,
} from "../components/ui.jsx";
import { AreaTrend } from "../components/charts.jsx";

const GOAL_ICONS = { shield: Shield, home: Home, briefcase: Briefcase, crown: Crown, "trending-up": TrendingUp, target: Target, wallet: Wallet };

function NetWorthTracker() {
  const { data, selectedMonth, symbol, actions } = useApp();
  const snap = netWorthSnapshot(data);
  const nw = netWorthForMonth(data, selectedMonth);
  const prevMonth = netWorthForMonth(data, prevMonthKey(selectedMonth));
  const yearAgo = netWorthForMonth(data, addMonths(selectedMonth, -12));
  const monthlyChange = nw - prevMonth;
  const yearlyChange = nw - yearAgo;

  const series = lastNMonths(selectedMonth, 12).map((k) => ({
    label: monthLabel(k, true),
    value: netWorthForMonth(data, k),
  }));

  return (
    <GlassCard className="p-5 sm:p-6">
      <SectionTitle
        icon={Landmark}
        title="Net Worth Tracker"
        subtitle="Assets minus liabilities, tracked over time"
        right={
          <div className="text-right">
            <div className="tabnum font-display text-2xl font-800 text-gold-400">{formatCurrency(snap.netWorth, symbol)}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">Current Net Worth</div>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total Assets" value={formatCompact(snap.assets, symbol)} color="text-brand-300" />
        <Stat label="Total Liabilities" value={formatCompact(snap.liabilities, symbol)} color="text-red-300" />
        <Stat label="Monthly Change" value={`${monthlyChange >= 0 ? "+" : ""}${formatCompact(monthlyChange, symbol)}`} color={monthlyChange >= 0 ? "text-brand-300" : "text-red-300"} />
        <Stat label="Yearly Change" value={`${yearlyChange >= 0 ? "+" : ""}${formatCompact(yearlyChange, symbol)}`} color={yearlyChange >= 0 ? "text-brand-300" : "text-red-300"} />
      </div>

      <AreaTrend data={series} color="#ffcf4d" symbol={symbol} height={200} />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-600 uppercase tracking-wider text-white/45">Assets</div>
          <div className="space-y-2">
            {ASSET_FIELDS.map((f) => (
              <div key={f.key} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-white/60">{f.label}</span>
                <MoneyInput symbol={symbol} value={data.assets?.[f.key] ?? 0} onChange={(e) => actions.setAsset(f.key, Number(e.target.value) || 0)} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-600 uppercase tracking-wider text-white/45">Liabilities</div>
          <div className="space-y-2">
            {LIABILITY_FIELDS.map((f) => (
              <div key={f.key} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-white/60">{f.label}</span>
                <MoneyInput symbol={symbol} value={data.liabilities?.[f.key] ?? 0} onChange={(e) => actions.setLiability(f.key, Number(e.target.value) || 0)} />
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => actions.snapshotNetWorth(selectedMonth, snap.netWorth)}
          >
            Save snapshot for {monthLabel(selectedMonth, true)}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

function Stat({ label, value, color = "text-white" }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className={cx("tabnum mt-1 font-display text-base font-700", color)}>{value}</div>
    </div>
  );
}

function WealthScoreCard() {
  const { data, selectedMonth } = useApp();
  const { score, parts } = wealthScore(data, selectedMonth);
  const tier = scoreTier(score);

  const factors = [
    { label: "Savings Consistency", value: parts.savingsConsistency },
    { label: "Spending Control", value: parts.spendingControl },
    { label: "Waste Reduction", value: parts.wasteControl },
    { label: "Income Growth", value: parts.incomeGrowth },
    { label: "Business Growth", value: parts.businessGrowth },
    { label: "Net Worth Growth", value: parts.nwGrowth },
  ];

  return (
    <GlassCard className="p-5 sm:p-6">
      <SectionTitle icon={Trophy} title="Wealth Score System" subtitle="Six disciplines, one number" />
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <div className="relative grid h-36 w-36 shrink-0 place-items-center">
          <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <circle cx="60" cy="60" r="52" fill="none" stroke={tier.color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(score / 100) * 326.7} 326.7`} />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="tabnum font-display text-4xl font-800 text-white">{score}</span>
            <span className="text-xs font-600" style={{ color: tier.color }}>{tier.label}</span>
          </div>
        </div>
        <div className="w-full flex-1 space-y-2.5">
          {factors.map((f) => (
            <div key={f.label}>
              <div className="mb-1 flex justify-between text-xs text-white/55">
                <span>{f.label}</span>
                <span className="tabnum">{Math.round(f.value)}/100</span>
              </div>
              <ProgressBar value={f.value} color={tier.color} height={6} />
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function MonthlyRanking() {
  const { data, selectedMonth } = useApp();
  const current = monthlyRanking(data, selectedMonth);
  const history = lastNMonths(selectedMonth, 6).map((k) => ({ key: k, ...monthlyRanking(data, k) }));

  const parts = [
    { label: "Savings Consistency", value: current.parts.savingsConsistency },
    { label: "Revenue Growth", value: current.parts.revenueGrowth },
    { label: "Spending Control", value: current.parts.spendingControl },
    { label: "Business Progress", value: current.parts.businessProgress },
  ];

  return (
    <GlassCard className="p-5 sm:p-6">
      <SectionTitle
        icon={Award}
        title="Monthly Wealth Ranking"
        subtitle="Graded out of 100, stored forever"
        right={
          <div className="grid h-14 w-14 place-items-center rounded-2xl font-display text-2xl font-800" style={{ background: `${gradeColor(current.grade)}22`, color: gradeColor(current.grade) }}>
            {current.grade}
          </div>
        }
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {parts.map((p) => (
          <div key={p.label} className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
            <div className="mb-1 flex justify-between text-xs text-white/55">
              <span>{p.label}</span>
              <span className="tabnum">{p.value}/25</span>
            </div>
            <ProgressBar value={p.value} max={25} color={gradeColor(current.grade)} height={6} />
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="mb-2 text-xs font-600 uppercase tracking-wider text-white/45">Historical Performance</div>
        <div className="flex flex-wrap gap-2">
          {history.map((h) => (
            <div key={h.key} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/5">
              <span className="text-xs text-white/50">{monthLabel(h.key, true)}</span>
              <span className="font-display text-sm font-800" style={{ color: gradeColor(h.grade) }}>{h.grade}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

function GoalModal({ open, onClose, editing }) {
  const { actions, symbol } = useApp();
  const [name, setName] = useState("");
  const [current, setCurrent] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");

  React.useEffect(() => {
    if (!open) return;
    setName(editing?.name || "");
    setCurrent(String(editing?.current ?? ""));
    setTarget(String(editing?.target ?? ""));
    setDeadline(editing?.deadline || "");
  }, [open, editing]);

  const save = () => {
    if (!name.trim() || !Number(target)) return;
    const payload = { name: name.trim(), current: Number(current) || 0, target: Number(target), deadline, icon: editing?.icon || "target" };
    if (editing) actions.updateLegacyGoal(editing.id, payload);
    else actions.addLegacyGoal(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Legacy Goal" : "New Legacy Goal"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>{editing ? "Save" : "Create goal"}</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Goal name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. House Deposit" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Current amount">
            <MoneyInput symbol={symbol} value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="0" />
          </Field>
          <Field label="Target amount">
            <MoneyInput symbol={symbol} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0" />
          </Field>
        </div>
        <Field label="Target date">
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

function LegacyGoals() {
  const { data, symbol, actions } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const goals = data.legacyGoals || [];

  const openAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  return (
    <GlassCard className="p-5 sm:p-6">
      <SectionTitle
        icon={Crown}
        title="Legacy Building"
        subtitle="The milestones that build generational freedom"
        right={<Button size="sm" icon={Plus} onClick={openAdd}>New goal</Button>}
      />
      {goals.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((g) => {
            const Icon = GOAL_ICONS[g.icon] || Target;
            const pct = clamp(g.target ? (g.current / g.target) * 100 : 0, 0, 100);
            const remaining = Math.max(0, g.target - g.current);
            return (
              <div key={g.id} className="group rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
                      <Icon size={16} />
                    </span>
                    <div>
                      <div className="text-sm font-700 text-white">{g.name}</div>
                      {g.deadline && <div className="text-[11px] text-white/40">Target {monthLabel(g.deadline.slice(0, 7))}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    <button onClick={() => { setEditing(g); setOpen(true); }} className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => actions.deleteLegacyGoal(g.id)} className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/20 hover:text-red-300">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="mb-1.5 flex items-end justify-between">
                  <span className="tabnum text-sm text-white/70">{formatCurrency(g.current, symbol)} <span className="text-white/30">/ {formatCurrency(g.target, symbol)}</span></span>
                  <Badge color={pct >= 100 ? "brand" : "white"}>{Math.round(pct)}%</Badge>
                </div>
                <ProgressBar value={pct} color="#1fe39d" height={10} showMarkers />
                <div className="mt-2 text-[11px] text-white/40">{formatCurrency(remaining, symbol)} remaining</div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Crown} title="No legacy goals yet" subtitle="Add goals like an emergency fund, house deposit, or £1M net worth." action={<Button size="sm" icon={Plus} onClick={openAdd}>Create your first goal</Button>} />
      )}
      <GoalModal open={open} onClose={() => setOpen(false)} editing={editing} />
    </GlassCard>
  );
}

export default function Legacy() {
  return (
    <div className="space-y-6">
      <SectionTitle icon={Landmark} title="Legacy Building" subtitle="Net worth, wealth score, rankings & long-term goals" />
      <NetWorthTracker />
      <div className="grid gap-6 lg:grid-cols-2">
        <WealthScoreCard />
        <MonthlyRanking />
      </div>
      <LegacyGoals />
    </div>
  );
}
