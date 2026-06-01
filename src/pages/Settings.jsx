import React, { useRef, useState } from "react";
import {
  Settings as SettingsIcon,
  User,
  Target,
  Sparkles,
  Wallet,
  Briefcase,
  Database,
  Download,
  Upload,
  FileText,
  RotateCcw,
  Trash2,
  Save,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { CURRENCIES } from "../lib/constants.js";
import { exportJSON, exportCSV, importJSON, resetData, clearData } from "../lib/storage.js";
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
} from "../components/ui.jsx";

function Card({ icon, title, subtitle, children }) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <SectionTitle icon={icon} title={title} subtitle={subtitle} />
      {children}
    </GlassCard>
  );
}

export default function Settings() {
  const { data, symbol, actions } = useApp();
  const fileRef = useRef(null);
  const [toast, setToast] = useState("");

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const num = (v) => Number(v) || 0;

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const next = await importJSON(file);
      actions.replaceData(next);
      flash("Backup restored successfully.");
    } catch (err) {
      flash("Import failed — invalid file.");
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <SectionTitle icon={SettingsIcon} title="Settings" subtitle="Profile, targets & data management" />

      <Card icon={User} title="Profile">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Your name">
            <Input value={data.settings?.name || ""} onChange={(e) => actions.setSettings({ name: e.target.value })} placeholder="Founder" />
          </Field>
          <Field label="Currency">
            <Select
              value={data.settings?.currencyCode || "GBP"}
              onChange={(e) => actions.setCurrency(e.target.value)}
              options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.symbol}  ${c.label}` }))}
            />
          </Field>
        </div>
      </Card>

      <Card icon={Target} title="Financial Freedom Targets">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Desired Monthly Income">
            <MoneyInput symbol={symbol} value={data.freedom?.desiredMonthlyIncome ?? 0} onChange={(e) => actions.setFreedom({ desiredMonthlyIncome: num(e.target.value) })} />
          </Field>
          <Field label="Desired Annual Income">
            <MoneyInput symbol={symbol} value={data.freedom?.desiredAnnualIncome ?? 0} onChange={(e) => actions.setFreedom({ desiredAnnualIncome: num(e.target.value) })} />
          </Field>
          <Field label="Desired Net Worth">
            <MoneyInput symbol={symbol} value={data.freedom?.desiredNetWorth ?? 0} onChange={(e) => actions.setFreedom({ desiredNetWorth: num(e.target.value) })} />
          </Field>
        </div>
      </Card>

      <Card icon={Sparkles} title="Future Self" subtitle="Keep your long-term vision visible">
        <div className="grid gap-3">
          <Field label="Future Lifestyle Vision">
            <Textarea value={data.futureSelf?.lifestyleVision || ""} onChange={(e) => actions.setFutureSelf({ lifestyleVision: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Financial Freedom Goal">
              <Input value={data.futureSelf?.freedomGoal || ""} onChange={(e) => actions.setFutureSelf({ freedomGoal: e.target.value })} />
            </Field>
            <Field label="Dream Net Worth">
              <MoneyInput symbol={symbol} value={data.futureSelf?.dreamNetWorth ?? 0} onChange={(e) => actions.setFutureSelf({ dreamNetWorth: num(e.target.value) })} />
            </Field>
          </div>
          <Field label="Main Reason For Building Wealth">
            <Textarea value={data.futureSelf?.mainReason || ""} onChange={(e) => actions.setFutureSelf({ mainReason: e.target.value })} />
          </Field>
        </div>
      </Card>

      <Card icon={Wallet} title="Personal Budgets & Goals">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="General Spending Budget">
            <MoneyInput symbol={symbol} value={data.personalBudgets?.generalSpending ?? 0} onChange={(e) => actions.setBudgets({ generalSpending: num(e.target.value) })} />
          </Field>
          <Field label="Fuel Budget">
            <MoneyInput symbol={symbol} value={data.personalBudgets?.fuel ?? 0} onChange={(e) => actions.setBudgets({ fuel: num(e.target.value) })} />
          </Field>
          <Field label="Bills Budget">
            <MoneyInput symbol={symbol} value={data.personalBudgets?.bills ?? 0} onChange={(e) => actions.setBudgets({ bills: num(e.target.value) })} />
          </Field>
          <Field label="Savings Goal">
            <MoneyInput symbol={symbol} value={data.personalBudgets?.savingsGoal ?? 0} onChange={(e) => actions.setBudgets({ savingsGoal: num(e.target.value) })} />
          </Field>
          <Field label="Investment Goal">
            <MoneyInput symbol={symbol} value={data.personalBudgets?.investmentGoal ?? 0} onChange={(e) => actions.setBudgets({ investmentGoal: num(e.target.value) })} />
          </Field>
          <Field label="Wasted Money Limit">
            <MoneyInput symbol={symbol} value={data.personalBudgets?.wastedMoneyLimit ?? 0} onChange={(e) => actions.setBudgets({ wastedMoneyLimit: num(e.target.value) })} />
          </Field>
        </div>
      </Card>

      <Card icon={Briefcase} title="Business Goals">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Monthly Lead Goal">
            <Input type="number" value={data.businessGoals?.monthlyLeadGoal ?? 0} onChange={(e) => actions.setBusinessGoals({ monthlyLeadGoal: num(e.target.value) })} />
          </Field>
          <Field label="Monthly Revenue Goal">
            <MoneyInput symbol={symbol} value={data.businessGoals?.revenueGoal ?? 0} onChange={(e) => actions.setBusinessGoals({ revenueGoal: num(e.target.value) })} />
          </Field>
          <Field label="Tax Reserve %" hint="Portion of revenue set aside for tax">
            <Input type="number" value={data.business?.taxReservePct ?? 25} onChange={(e) => actions.setBusiness({ taxReservePct: num(e.target.value) })} />
          </Field>
        </div>
      </Card>

      <Card icon={Database} title="Data Management" subtitle="Everything is stored locally on this device">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="ghost" icon={Download} onClick={() => { exportJSON(data); flash("Backup downloaded."); }}>
            Backup (Export JSON)
          </Button>
          <Button variant="ghost" icon={FileText} onClick={() => { exportCSV(data); flash("CSV exported."); }}>
            Export Transactions (CSV)
          </Button>
          <Button variant="ghost" icon={Upload} onClick={() => fileRef.current?.click()}>
            Restore / Import Backup
          </Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
          <Button
            variant="ghost"
            icon={RotateCcw}
            onClick={() => {
              if (confirm("Reload the demo dataset? This replaces your current data.")) {
                actions.replaceData(resetData());
                flash("Demo data restored.");
              }
            }}
          >
            Reset to Demo Data
          </Button>
        </div>
        <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-red-400/15 bg-red-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-600 text-red-200">Clear all data</div>
            <div className="text-xs text-white/40">Wipes every transaction, goal and history. Cannot be undone.</div>
          </div>
          <Button
            variant="danger"
            icon={Trash2}
            onClick={() => {
              if (confirm("Delete ALL data and start from a blank slate?")) {
                actions.replaceData(clearData());
                flash("All data cleared.");
              }
            }}
          >
            Clear everything
          </Button>
        </div>
      </Card>

      <div className="pb-2 text-center text-xs text-white/30">
        Money OS · v{data.meta?.version || 1} · Data key: <code className="text-white/40">money_os_v1</code>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-600 text-ink-950 shadow-glow animate-fade-up lg:bottom-8">
          <Save size={15} /> {toast}
        </div>
      )}
    </div>
  );
}
