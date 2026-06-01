import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact } from "../lib/format.js";

const AXIS = { fontSize: 11, fill: "rgba(255,255,255,0.4)" };

function TipBox({ active, payload, label, symbol = "£", money = true }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs shadow-glass">
      <div className="mb-1 font-600 text-white/80">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-white/60">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span>{p.name}:</span>
          <span className="tabnum font-600 text-white">
            {money ? `${symbol}${Math.round(p.value).toLocaleString("en-GB")}` : Math.round(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AreaTrend({ data, dataKey = "value", color = "#1fe39d", symbol = "£", height = 220, money = true }) {
  const id = `grad-${dataKey}-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => (money ? formatCompact(v, symbol) : v)} />
        <Tooltip content={<TipBox symbol={symbol} money={money} />} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#${id})`} name="Value" dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarTrend({ data, dataKey = "value", color = "#54f3b8", symbol = "£", height = 220, money = true }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => (money ? formatCompact(v, symbol) : v)} />
        <Tooltip content={<TipBox symbol={symbol} money={money} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} name="Value">
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color || color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const DONUT_COLORS = ["#1fe39d", "#54f3b8", "#ffcf4d", "#6366f1", "#ff6b6b", "#22d3ee", "#a78bfa", "#f59e0b", "#34d399"];

export function Donut({ data, symbol = "£", height = 220, money = true }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color || DONUT_COLORS[i % DONUT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<TipBox symbol={symbol} money={money} />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] uppercase tracking-wider text-white/40">Total</span>
        <span className="tabnum font-display text-lg font-700 text-white">
          {money ? `${symbol}${Math.round(total).toLocaleString("en-GB")}` : total}
        </span>
      </div>
    </div>
  );
}

export { DONUT_COLORS };
