import React, { useState } from "react";
import {
  SlidersHorizontal,
  User,
  Target,
  Sparkles,
  Briefcase,
  Crown,
  LayoutGrid,
  Newspaper,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import {
  CURRENCIES,
  FUND_FIELDS,
  LIABILITY_FIELDS,
  MISSION_CARDS,
  CEO_BRIEF_METRICS,
  CEO_BUSINESS_METRICS,
  DEFAULT_MISSION_LAYOUT,
} from "../lib/constants.js";
import { netWorthSnapshot } from "../lib/calc.js";
import { formatCurrency, monthLabel } from "../lib/format.js";
import {
  GlassCard,
  SectionTitle,
  Field,
  Input,
  MoneyInput,
  Select,
  Textarea,
  Button,
  Badge,
  ProgressBar,
  EmptyState,
  cx,
} from "../components/ui.jsx";

const TABS = [
  { id: "personal", label: "Personal", icon: User },
  { id: "targets", label: "Targets", icon: Target },
  { id: "freedom", label: "Freedom", icon: Sparkles },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "legacy", label: "Legacy", icon: Crown },
  { id: "mission", label: "Mission Cards", icon: LayoutGrid },
  { id: "brief", label: "Daily Brief", icon: Newspaper },
];

function Money({ label, value, onChange, symbol, hint }) {
  return (
    <Field label={label} hint={hint}>
      <MoneyInput symbol={symbol} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </Field>
  );
}

// ---------------- Personal ----------------
function PersonalTab() {
  const { data, symbol, actions } = useApp();
  const snap = netWorthSnapshot(data);
  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <SectionTitle icon={User} title="Profile" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Your name">
            <Input value={data.settings?.name || ""} onChange={(e) => actions.setSettings({ name: e.target.value })} placeholder="Founder" />
          </Field>
          <Field label="Currency">
            <Select value={data.settings?.currencyCode || "GBP"} onChange={(e) => actions.setCurrency(e.target.value)} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.symbol}  ${c.label}` }))} />
          </Field>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <SectionTitle icon={User} title="Current Holdings" subtitle="Your real balances drive net worth & every dashboard" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Money label="Current Cash" value={data.assets?.cash} onChange={(v) => actions.setAsset("cash", v)} symbol={symbol} />
          <Money label="Current Savings" value={data.assets?.savings} onChange={(v) => actions.setAsset("savings", v)} symbol={symbol} />
          <Money label="Current Investments" value={data.assets?.investments} onChange={(v) => actions.setAsset("investments", v)} symbol={symbol} />
          <Money label="Current Crypto" value={data.assets?.crypto} onChange={(v) => actions.setAsset("crypto", v)} symbol={symbol} />
          <Money label="Vehicles" value={data.assets?.vehicles} onChange={(v) => actions.setAsset("vehicles", v)} symbol={symbol} />
          <Money label="Other Assets" value={data.assets?.other} onChange={(v) => actions.setAsset("other", v)} symbol={symbol} />
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <SectionTitle icon={User} title="Current Debts" />
        <div className="grid gap-3 sm:grid-cols-3">
          {LIABILITY_FIELDS.map((f) => (
            <Money key={f.key} label={f.label} value={data.liabilities?.[f.key]} onChange={(v) => actions.setLiability(f.key, v)} symbol={symbol} />
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <SectionTitle icon={Target} title="Dedicated Funds" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FUND_FIELDS.map((f) => (
            <Money key={f.key} label={f.label} value={data.funds?.[f.key]} onChange={(v) => actions.setFunds({ [f.key]: v })} symbol={symbol} />
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <SectionTitle icon={Crown} title="Net Worth" subtitle="Auto-calculated from holdings, or set it manually" />
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
          <span className="text-sm text-white/55">Computed net worth</span>
          <span className="tabnum font-display text-lg font-800 text-gold-400">{formatCurrency(snap.computed, symbol)}</span>
        </div>
        <label className="mb-3 flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" checked={!!data.owner?.useNetWorthOverride} onChange={(e) => actions.setOwner({ useNetWorthOverride: e.target.checked })} className="h-4 w-4 accent-brand-500" />
          Use a manual net worth figure instead
        </label>
        {data.owner?.useNetWorthOverride && (
          <Money label="Current Net Worth (manual)" value={data.owner?.netWorthOverride} onChange={(v) => actions.setOwner({ netWorthOverride: v })} symbol={symbol} />
        )}
      </GlassCard>
    </div>
  );
}

// ---------------- Targets ----------------
function TargetsTab() {
  const { data, symbol, actions } = useApp();
  const b = data.personalBudgets || {};
  return (
    <GlassCard className="p-5">
      <SectionTitle icon={Target} title="Monthly Targets" subtitle="These drive all trackers, rankings, alerts & scores" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Money label="Monthly Income Target" value={b.incomeTarget} onChange={(v) => actions.setBudgets({ incomeTarget: v })} symbol={symbol} />
        <Money label="Monthly Savings Target" value={b.savingsGoal} onChange={(v) => actions.setBudgets({ savingsGoal: v })} symbol={symbol} />
        <Money label="Monthly Investment Target" value={b.investmentGoal} onChange={(v) => actions.setBudgets({ investmentGoal: v })} symbol={symbol} />
        <Money label="Monthly Spending Limit" value={b.generalSpending} onChange={(v) => actions.setBudgets({ generalSpending: v })} symbol={symbol} />
        <Money label="Monthly Fuel Budget" value={b.fuel} onChange={(v) => actions.setBudgets({ fuel: v })} symbol={symbol} />
        <Money label="Monthly Bills Budget" value={b.bills} onChange={(v) => actions.setBudgets({ bills: v })} symbol={symbol} />
        <Money label="Monthly Waste Limit" value={b.wastedMoneyLimit} onChange={(v) => actions.setBudgets({ wastedMoneyLimit: v })} symbol={symbol} />
      </div>
    </GlassCard>
  );
}

// ---------------- Freedom ----------------
function FreedomTab() {
  const { data, symbol, actions } = useApp();
  const f = data.freedom || {};
  const fs = data.futureSelf || {};
  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <SectionTitle icon={Sparkles} title="Financial Freedom Settings" subtitle="All Freedom Progress is based on these" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Money label="Desired Monthly Income" value={f.desiredMonthlyIncome} onChange={(v) => actions.setFreedom({ desiredMonthlyIncome: v })} symbol={symbol} />
          <Money label="Desired Annual Income" value={f.desiredAnnualIncome} onChange={(v) => actions.setFreedom({ desiredAnnualIncome: v })} symbol={symbol} />
          <Money label="Desired Net Worth" value={f.desiredNetWorth} onChange={(v) => actions.setFreedom({ desiredNetWorth: v })} symbol={symbol} />
          <Money label="Desired Retirement Number" value={f.retirementNumber} onChange={(v) => actions.setFreedom({ retirementNumber: v })} symbol={symbol} />
          <Field label="Financial Freedom Date Goal">
            <Input type="date" value={f.freedomDateGoal || ""} onChange={(e) => actions.setFreedom({ freedomDateGoal: e.target.value })} />
          </Field>
        </div>
      </GlassCard>
      <GlassCard className="p-5">
        <SectionTitle icon={Sparkles} title="Future Self" subtitle="Why you're building wealth" />
        <div className="grid gap-3">
          <Field label="Future Lifestyle Vision">
            <Textarea value={fs.lifestyleVision || ""} onChange={(e) => actions.setFutureSelf({ lifestyleVision: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Financial Freedom Goal">
              <Input value={fs.freedomGoal || ""} onChange={(e) => actions.setFutureSelf({ freedomGoal: e.target.value })} />
            </Field>
            <Money label="Dream Net Worth" value={fs.dreamNetWorth} onChange={(v) => actions.setFutureSelf({ dreamNetWorth: v })} symbol={symbol} />
          </div>
          <Field label="Main Reason For Building Wealth">
            <Textarea value={fs.mainReason || ""} onChange={(e) => actions.setFutureSelf({ mainReason: e.target.value })} />
          </Field>
        </div>
      </GlassCard>
    </div>
  );
}

// ---------------- Business ----------------
function EditableTagList({ items, onChange, placeholder }) {
  const [val, setVal] = useState("");
  const add = () => {
    const v = val.trim();
    if (!v || items.includes(v)) return;
    onChange([...items, v]);
    setVal("");
  };
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {items.map((it) => (
          <span key={it} className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-xs font-600 text-white/75 ring-1 ring-white/10">
            {it}
            <button onClick={() => onChange(items.filter((x) => x !== it))} className="text-white/40 hover:text-red-300">
              <Trash2 size={12} />
            </button>
          </span>
        ))}
        {!items.length && <span className="text-sm text-white/40">None yet.</span>}
      </div>
      <div className="flex gap-2">
        <Input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={placeholder} />
        <Button variant="ghost" icon={Plus} onClick={add}>Add</Button>
      </div>
    </div>
  );
}

function BusinessTab() {
  const { data, symbol, actions } = useApp();
  const bg = data.businessGoals || {};
  const biz = data.business || {};
  const assets = biz.assets || [];
  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <SectionTitle icon={Briefcase} title="Business Control Centre" />
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input type="checkbox" checked={!!biz.cashOverride} onChange={(e) => actions.setBusiness({ cashOverride: e.target.checked })} className="h-4 w-4 accent-brand-500" />
            Use manual business cash
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Money label="Current Business Cash" value={biz.cash} onChange={(v) => actions.setBusiness({ cash: v })} symbol={symbol} hint={biz.cashOverride ? "Drives the Business Cash card" : "Enable toggle above to use"} />
          <Money label="Monthly Revenue Goal" value={bg.revenueGoal} onChange={(v) => actions.setBusinessGoals({ revenueGoal: v })} symbol={symbol} />
          <Money label="Monthly Profit Goal" value={bg.profitGoal} onChange={(v) => actions.setBusinessGoals({ profitGoal: v })} symbol={symbol} />
          <Field label="Lead Goal">
            <Input type="number" value={bg.monthlyLeadGoal ?? 0} onChange={(e) => actions.setBusinessGoals({ monthlyLeadGoal: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Client Goal">
            <Input type="number" value={bg.clientGoal ?? 0} onChange={(e) => actions.setBusinessGoals({ clientGoal: Number(e.target.value) || 0 })} />
          </Field>
          <Money label="Monthly Recurring Revenue Goal" value={bg.mrrGoal} onChange={(v) => actions.setBusinessGoals({ mrrGoal: v })} symbol={symbol} />
          <Field label="Tax Reserve %">
            <Input type="number" value={biz.taxReservePct ?? 25} onChange={(e) => actions.setBusiness({ taxReservePct: Number(e.target.value) || 0 })} />
          </Field>
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <SectionTitle icon={Briefcase} title="Revenue Sources" subtitle="Used as categories when logging revenue" />
        <EditableTagList items={biz.revenueSources || []} onChange={(v) => actions.setBusiness({ revenueSources: v })} placeholder="e.g. Retainers" />
      </GlassCard>

      <GlassCard className="p-5">
        <SectionTitle icon={Briefcase} title="Expense Categories" subtitle="Used as categories when logging expenses" />
        <EditableTagList items={biz.expenseCategories || []} onChange={(v) => actions.setBusiness({ expenseCategories: v })} placeholder="e.g. Software" />
      </GlassCard>

      <GlassCard className="p-5">
        <SectionTitle
          icon={Briefcase}
          title="Business Assets"
          right={<Button size="sm" variant="ghost" icon={Plus} onClick={() => actions.addBusinessAsset({ name: "New asset", value: 0 })}>Add asset</Button>}
        />
        <div className="space-y-2">
          {assets.map((a) => (
            <div key={a.id} className="flex items-center gap-2">
              <Input value={a.name} onChange={(e) => actions.updateBusinessAsset(a.id, { name: e.target.value })} className="flex-1" />
              <div className="w-40">
                <MoneyInput symbol={symbol} value={a.value} onChange={(e) => actions.updateBusinessAsset(a.id, { value: Number(e.target.value) || 0 })} />
              </div>
              <button onClick={() => actions.deleteBusinessAsset(a.id)} className="rounded-lg p-2 text-white/40 hover:bg-red-500/20 hover:text-red-300">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {!assets.length && <p className="text-sm text-white/40">No business assets added.</p>}
        </div>
      </GlassCard>
    </div>
  );
}

// ---------------- Legacy ----------------
function LegacyTab() {
  const { data, symbol, actions } = useApp();
  const goals = data.legacyGoals || [];
  return (
    <GlassCard className="p-5">
      <SectionTitle
        icon={Crown}
        title="Legacy Goals"
        subtitle="Create unlimited custom goals"
        right={<Button size="sm" icon={Plus} onClick={() => actions.addLegacyGoal({ name: "New Goal", icon: "target", current: 0, target: 10000, deadline: "" })}>New goal</Button>}
      />
      {goals.length ? (
        <div className="space-y-3">
          {goals.map((g) => {
            const pct = g.target ? Math.min(100, (g.current / g.target) * 100) : 0;
            return (
              <div key={g.id} className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/5">
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input value={g.name} onChange={(e) => actions.updateLegacyGoal(g.id, { name: e.target.value })} className="font-600" />
                  <button onClick={() => actions.deleteLegacyGoal(g.id)} className="justify-self-end rounded-lg p-2 text-white/40 hover:bg-red-500/20 hover:text-red-300 sm:justify-self-auto">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <Money label="Current" value={g.current} onChange={(v) => actions.updateLegacyGoal(g.id, { current: v })} symbol={symbol} />
                  <Money label="Target" value={g.target} onChange={(v) => actions.updateLegacyGoal(g.id, { target: v })} symbol={symbol} />
                  <Field label="Target Date">
                    <Input type="date" value={g.deadline || ""} onChange={(e) => actions.updateLegacyGoal(g.id, { deadline: e.target.value })} />
                  </Field>
                </div>
                <div className="mt-2">
                  <ProgressBar value={pct} color="#1fe39d" height={6} />
                  <div className="mt-1 flex justify-between text-[11px] text-white/40">
                    <span>{Math.round(pct)}%</span>
                    {g.deadline && <span>Target {monthLabel(g.deadline.slice(0, 7))}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Crown} title="No goals yet" subtitle="Add goals like Emergency Fund, House Deposit or £1M Net Worth." />
      )}
    </GlassCard>
  );
}

// ---------------- Mission cards ----------------
function MissionTab() {
  const { data, actions } = useApp();
  const cards = data.layout?.missionCards || DEFAULT_MISSION_LAYOUT;
  const [dragId, setDragId] = useState(null);
  const labelFor = (id) => MISSION_CARDS.find((c) => c.id === id)?.label || id;

  const reorder = (fromId, toId) => {
    if (fromId === toId) return;
    const arr = cards.slice();
    const from = arr.findIndex((c) => c.id === fromId);
    const to = arr.findIndex((c) => c.id === toId);
    if (from < 0 || to < 0) return;
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    actions.setMissionLayout(arr);
  };

  const toggle = (id) => actions.setMissionLayout(cards.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)));
  const visibleCount = cards.filter((c) => c.visible).length;

  return (
    <GlassCard className="p-5">
      <SectionTitle
        icon={LayoutGrid}
        title="Mission Control Cards"
        subtitle={`${visibleCount} visible · drag to reorder, toggle to show/hide`}
        right={<Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => actions.setMissionLayout(DEFAULT_MISSION_LAYOUT.map((c) => ({ ...c })))}>Reset layout</Button>}
      />
      <div className="space-y-2">
        {cards.map((c) => (
          <div
            key={c.id}
            draggable
            onDragStart={() => setDragId(c.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              reorder(dragId, c.id);
              setDragId(null);
            }}
            className={cx(
              "flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/5 transition",
              dragId === c.id && "opacity-50",
              !c.visible && "opacity-60"
            )}
          >
            <GripVertical size={16} className="cursor-grab text-white/30" />
            <span className={cx("flex-1 text-sm font-600", c.visible ? "text-white" : "text-white/40")}>{labelFor(c.id)}</span>
            <button onClick={() => toggle(c.id)} className={cx("rounded-lg p-1.5", c.visible ? "text-brand-300 hover:bg-brand-500/15" : "text-white/40 hover:bg-white/10")}>
              {c.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ---------------- Daily Brief ----------------
function ChipSelect({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <button
            key={o.id}
            onClick={() => onToggle(o.id)}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-600 ring-1 transition",
              on ? "bg-brand-500/15 text-brand-300 ring-brand-400/30" : "bg-white/5 text-white/50 ring-white/10 hover:text-white"
            )}
          >
            {on && <Check size={12} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function BriefTab() {
  const { data, actions } = useApp();
  const brief = data.ceoBrief || { metrics: [], businessMetrics: [], goals: [], showAlerts: true };
  const goals = data.legacyGoals || [];

  const toggleIn = (field, id, max) => {
    const cur = brief[field] || [];
    let next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    if (max && next.length > max) next = next.slice(next.length - max);
    actions.setCeoBrief({ [field]: next });
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <SectionTitle icon={Newspaper} title="Headline Metrics" subtitle="Up to 4 metrics that matter most to you" />
        <ChipSelect options={CEO_BRIEF_METRICS} selected={brief.metrics || []} onToggle={(id) => toggleIn("metrics", id, 4)} />
      </GlassCard>
      <GlassCard className="p-5">
        <SectionTitle icon={Briefcase} title="Business Metrics" subtitle="Shown in your daily brief" />
        <ChipSelect options={CEO_BUSINESS_METRICS} selected={brief.businessMetrics || []} onToggle={(id) => toggleIn("businessMetrics", id, 4)} />
      </GlassCard>
      <GlassCard className="p-5">
        <SectionTitle icon={Crown} title="Prioritised Goals" subtitle="Pick the goals to feature (default: top by progress)" />
        {goals.length ? (
          <ChipSelect options={goals.map((g) => ({ id: g.id, label: g.name }))} selected={brief.goals || []} onToggle={(id) => toggleIn("goals", id)} />
        ) : (
          <p className="text-sm text-white/40">Add legacy goals first.</p>
        )}
      </GlassCard>
      <GlassCard className="p-5">
        <SectionTitle icon={Target} title="Alerts" />
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input type="checkbox" checked={brief.showAlerts !== false} onChange={(e) => actions.setCeoBrief({ showAlerts: e.target.checked })} className="h-4 w-4 accent-brand-500" />
          Show red-flag alerts in the Daily Brief
        </label>
      </GlassCard>
    </div>
  );
}

export default function OwnerControl() {
  const [tab, setTab] = useState("personal");
  const { data } = useApp();

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={SlidersHorizontal}
        title="Owner Control Centre"
        subtitle="The brain of your Money OS — every number is yours to control"
        right={data.meta?.isDemo ? <Badge color="gold">Demo data</Badge> : <Badge color="brand">Your data</Badge>}
      />

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cx(
                "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-600 ring-1 transition",
                on ? "bg-brand-500/15 text-brand-300 ring-brand-400/25" : "bg-white/[0.03] text-white/50 ring-white/8 hover:text-white"
              )}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "personal" && <PersonalTab />}
      {tab === "targets" && <TargetsTab />}
      {tab === "freedom" && <FreedomTab />}
      {tab === "business" && <BusinessTab />}
      {tab === "legacy" && <LegacyTab />}
      {tab === "mission" && <MissionTab />}
      {tab === "brief" && <BriefTab />}
    </div>
  );
}
