import React from "react";
import {
  ClipboardCheck,
  Trophy,
  TriangleAlert,
  Flag,
  Award,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { generateReview, monthlyRanking, gradeColor, wealthScore, scoreTier } from "../lib/calc.js";
import { monthLabel } from "../lib/format.js";
import { GlassCard, SectionTitle, Badge, cx } from "../components/ui.jsx";

function ReviewColumn({ icon: Icon, title, items, color, empty }) {
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className={cx("grid h-9 w-9 place-items-center rounded-xl", color.bg, color.text)}>
          <Icon size={18} />
        </span>
        <h3 className="font-display text-base font-700 text-white">{title}</h3>
      </div>
      {items.length ? (
        <ul className="space-y-2.5">
          {items.map((t, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
              <span className={cx("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", color.dot)} />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-white/40">{empty}</p>
      )}
    </GlassCard>
  );
}

export default function Reviews() {
  const { data, selectedMonth } = useApp();
  const review = generateReview(data, selectedMonth);
  const ranking = monthlyRanking(data, selectedMonth);
  const { score } = wealthScore(data, selectedMonth);
  const tier = scoreTier(score);

  return (
    <div className="space-y-6">
      <SectionTitle icon={ClipboardCheck} title="Monthly Review" subtitle={monthLabel(selectedMonth)} />

      <GlassCard strong className="relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl" style={{ background: `${gradeColor(ranking.grade)}22` }} />
        <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <Badge color="white">Auto-generated from your data</Badge>
            <h2 className="mt-3 font-display text-2xl font-800 text-white">{monthLabel(selectedMonth)} verdict</h2>
            <p className="mt-1 max-w-md text-sm text-white/50">
              You scored <span className="font-600 text-white">{ranking.total}/100</span> this month with a wealth score of{" "}
              <span style={{ color: tier.color }} className="font-600">{score}</span> ({tier.label}).
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center rounded-2xl font-display text-4xl font-800" style={{ background: `${gradeColor(ranking.grade)}1f`, color: gradeColor(ranking.grade) }}>
              {ranking.grade}
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReviewColumn
          icon={Trophy}
          title="Financial Wins"
          items={review.wins}
          color={{ bg: "bg-brand-500/15", text: "text-brand-300", dot: "bg-brand-400" }}
          empty="Log more transactions to surface your wins."
        />
        <ReviewColumn
          icon={TriangleAlert}
          title="Areas To Improve"
          items={review.improve}
          color={{ bg: "bg-red-500/15", text: "text-red-300", dot: "bg-red-400" }}
          empty="No problem areas detected — clean month."
        />
      </div>

      <GlassCard className="p-5 sm:p-6">
        <SectionTitle icon={Flag} title="Next Month Focus" subtitle="Three priorities to compound your progress" />
        <div className="grid gap-3 sm:grid-cols-3">
          {review.focus.map((f, i) => (
            <div key={i} className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/5">
              <div className="mb-2 grid h-7 w-7 place-items-center rounded-lg bg-gold-500/15 font-display text-sm font-800 text-gold-400">
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed text-white/70">{f}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <SectionTitle icon={Award} title="Ranking Breakdown" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Savings Consistency", ranking.parts.savingsConsistency],
            ["Revenue Growth", ranking.parts.revenueGrowth],
            ["Spending Control", ranking.parts.spendingControl],
            ["Business Progress", ranking.parts.businessProgress],
          ].map(([label, val]) => (
            <div key={label} className="rounded-xl bg-white/[0.03] p-3 text-center ring-1 ring-white/5">
              <div className="tabnum font-display text-2xl font-800 text-white">{val}<span className="text-sm text-white/30">/25</span></div>
              <div className="mt-1 text-[11px] text-white/45">{label}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.02] py-4 text-sm text-white/50">
        <Sparkles size={16} className="text-brand-300" />
        Reviews are generated and stored every month — use the month selector to revisit any period.
      </div>
    </div>
  );
}
