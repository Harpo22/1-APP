import React, { useEffect } from "react";
import { X } from "lucide-react";
import { clamp, formatCurrency } from "../lib/format.js";

export function cx(...args) {
  return args.filter(Boolean).join(" ");
}

// ---------- Card ----------
export function GlassCard({ className = "", children, strong = false, hover = false, ...rest }) {
  return (
    <div
      className={cx(
        strong ? "glass-strong" : "glass",
        "rounded-2xl shadow-glass",
        hover && "transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

// ---------- Section header ----------
export function SectionTitle({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-brand-300 ring-1 ring-white/10">
            <Icon size={18} />
          </span>
        )}
        <div>
          <h2 className="font-display text-lg font-700 tracking-tight text-white sm:text-xl">{title}</h2>
          {subtitle && <p className="text-xs text-white/45 sm:text-sm">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

// ---------- KPI card ----------
export function KpiCard({ label, value, sub, icon: Icon, accent = "brand", trend, delay = 0 }) {
  const accents = {
    brand: "text-brand-300",
    gold: "text-gold-400",
    red: "text-red-400",
    blue: "text-indigo-300",
    white: "text-white",
  };
  return (
    <GlassCard
      hover
      className="animate-fade-up p-4 sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-600 uppercase tracking-wider text-white/45 sm:text-xs">{label}</span>
        {Icon && <Icon size={16} className={cx(accents[accent], "opacity-80")} />}
      </div>
      <div className={cx("tabnum mt-2 font-display text-xl font-800 sm:text-2xl", accents[accent])}>{value}</div>
      <div className="mt-1 flex items-center gap-2">
        {sub && <span className="text-xs text-white/40">{sub}</span>}
        {trend != null && <Trend value={trend} />}
      </div>
    </GlassCard>
  );
}

export function Trend({ value, suffix = "%", invert = false }) {
  const positive = invert ? value < 0 : value > 0;
  const neutral = value === 0 || value == null;
  const color = neutral ? "text-white/40" : positive ? "text-brand-300" : "text-red-400";
  const arrow = neutral ? "→" : value > 0 ? "▲" : "▼";
  return (
    <span className={cx("tabnum inline-flex items-center gap-1 text-xs font-600", color)}>
      {arrow} {Math.abs(Math.round(value))}
      {suffix}
    </span>
  );
}

// ---------- Progress bar ----------
export function ProgressBar({ value, max = 100, color = "#1fe39d", danger = false, height = 10, showMarkers = false }) {
  const pct = clamp(max ? (value / max) * 100 : 0, 0, 100);
  const barColor = danger ? "#ff6b6b" : color;
  return (
    <div className="relative w-full overflow-hidden rounded-full bg-white/8" style={{ height }}>
      {showMarkers &&
        [25, 50, 75].map((m) => (
          <div key={m} className="absolute top-0 bottom-0 w-px bg-black/30" style={{ left: `${m}%` }} />
        ))}
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
          boxShadow: `0 0 18px -2px ${barColor}aa`,
        }}
      />
    </div>
  );
}

// ---------- Pill / badge ----------
export function Badge({ children, color = "white", className = "" }) {
  const map = {
    brand: "bg-brand-500/15 text-brand-300 ring-brand-400/20",
    gold: "bg-gold-500/15 text-gold-400 ring-gold-400/20",
    red: "bg-red-500/15 text-red-300 ring-red-400/20",
    blue: "bg-indigo-500/15 text-indigo-300 ring-indigo-400/20",
    white: "bg-white/10 text-white/70 ring-white/15",
  };
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-600 ring-1", map[color], className)}>
      {children}
    </span>
  );
}

// ---------- Buttons ----------
export function Button({ children, variant = "primary", size = "md", className = "", icon: Icon, ...rest }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]";
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-base",
  };
  const variants = {
    primary: "bg-brand-500 text-ink-950 hover:bg-brand-400 shadow-glow",
    ghost: "bg-white/5 text-white/80 ring-1 ring-white/10 hover:bg-white/10",
    outline: "bg-transparent text-white/70 ring-1 ring-white/15 hover:bg-white/5",
    danger: "bg-red-500/15 text-red-300 ring-1 ring-red-400/20 hover:bg-red-500/25",
  };
  return (
    <button className={cx(base, sizes[size], variants[variant], className)} {...rest}>
      {Icon && <Icon size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}

// ---------- Form fields ----------
export function Field({ label, children, hint, className = "" }) {
  return (
    <label className={cx("block", className)}>
      {label && <span className="mb-1.5 block text-xs font-600 text-white/55">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-[11px] text-white/35">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl bg-white/5 px-3.5 py-2.5 text-sm text-white ring-1 ring-white/10 placeholder:text-white/30 transition focus:ring-2 focus:ring-brand-400/50";

export function Input(props) {
  return <input className={cx(inputBase, props.className)} {...props} />;
}

export function MoneyInput({ symbol = "£", value, onChange, ...rest }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/40">{symbol}</span>
      <input
        type="number"
        inputMode="decimal"
        className={cx(inputBase, "pl-7")}
        value={value}
        onChange={onChange}
        {...rest}
      />
    </div>
  );
}

export function Select({ value, onChange, options, className = "", ...rest }) {
  return (
    <select className={cx(inputBase, "appearance-none cursor-pointer", className)} value={value} onChange={onChange} {...rest}>
      {options.map((o) =>
        typeof o === "string" ? (
          <option key={o} value={o} className="bg-ink-800">
            {o}
          </option>
        ) : (
          <option key={o.value} value={o.value} className="bg-ink-800">
            {o.label}
          </option>
        )
      )}
    </select>
  );
}

export function Textarea(props) {
  return <textarea className={cx(inputBase, "min-h-[90px] resize-y", props.className)} {...props} />;
}

// ---------- Toggle ----------
export function Toggle({ checked, onChange, labels = ["Off", "On"] }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex h-9 items-center gap-2 rounded-full px-1.5 ring-1 transition",
        checked ? "bg-brand-500/20 ring-brand-400/30" : "bg-red-500/15 ring-red-400/25"
      )}
    >
      <span className={cx("rounded-full px-2.5 py-1 text-xs font-600", checked ? "text-brand-300" : "text-white/40")}>
        {labels[1]}
      </span>
      <span className={cx("rounded-full px-2.5 py-1 text-xs font-600", !checked ? "text-red-300" : "text-white/40")}>
        {labels[0]}
      </span>
    </button>
  );
}

// ---------- Modal ----------
export function Modal({ open, onClose, title, children, footer, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cx("relative z-10 w-full animate-scale-in sm:mx-4", maxWidth)}>
        <GlassCard strong className="max-h-[92vh] overflow-hidden rounded-b-none sm:rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <h3 className="font-display text-base font-700 text-white">{title}</h3>
            <button onClick={onClose} className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="border-t border-white/8 px-5 py-4">{footer}</div>}
        </GlassCard>
      </div>
    </div>
  );
}

// ---------- Empty state ----------
export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-12 text-center">
      {Icon && <Icon size={28} className="mb-3 text-white/30" />}
      <p className="font-600 text-white/70">{title}</p>
      {subtitle && <p className="mt-1 max-w-xs text-sm text-white/40">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---------- Stat row ----------
export function StatRow({ label, value, color = "text-white", small }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={cx("text-white/50", small ? "text-xs" : "text-sm")}>{label}</span>
      <span className={cx("tabnum font-600", small ? "text-xs" : "text-sm", color)}>{value}</span>
    </div>
  );
}

// ---------- Budget tracker row ----------
export function BudgetTracker({ label, spent, budget, symbol, invertGood = false, trend }) {
  const pct = budget ? (spent / budget) * 100 : 0;
  const over = spent > budget;
  const remaining = budget - spent;
  // For limits (like waste/spending) over budget is bad; for goals (savings) under is bad
  const danger = invertGood ? spent < budget * 0.7 : over;
  const status = invertGood
    ? spent >= budget
      ? "On track"
      : "Behind"
    : over
    ? "Over budget"
    : pct > 85
    ? "Near limit"
    : "On track";
  const statusColor = status === "On track" ? "brand" : status === "Behind" || status === "Near limit" ? "gold" : "red";

  return (
    <div className="rounded-xl bg-white/[0.03] p-3.5 ring-1 ring-white/5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-600 text-white/80">{label}</span>
        <Badge color={statusColor}>{status}</Badge>
      </div>
      <div className="mb-2 flex items-end justify-between">
        <span className="tabnum text-sm text-white/60">
          {formatCurrency(spent, symbol)} <span className="text-white/30">/ {formatCurrency(budget, symbol)}</span>
        </span>
        {trend != null && <Trend value={trend} invert={!invertGood} />}
      </div>
      <ProgressBar value={Math.min(spent, budget * 1.5)} max={budget * 1.5} color={invertGood ? "#1fe39d" : "#54f3b8"} danger={danger} height={8} />
      <div className="mt-2 flex items-center justify-between text-[11px] text-white/40">
        <span>{Math.round(pct)}% used</span>
        <span className={remaining < 0 ? "text-red-300" : ""}>
          {remaining >= 0 ? `${formatCurrency(remaining, symbol)} left` : `${formatCurrency(Math.abs(remaining), symbol)} over`}
        </span>
      </div>
    </div>
  );
}
