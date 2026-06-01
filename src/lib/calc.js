import {
  monthKeyFromDate,
  prevMonthKey,
  lastNMonths,
  parseMonthKey,
  monthLabel,
  addMonths,
  clamp,
} from "./format.js";
import { WEALTH_CATEGORIES, RECURRING_REVENUE_CATEGORIES } from "./constants.js";

// ---------- transaction filters ----------
export function txForMonth(transactions, key, scope) {
  return transactions.filter(
    (t) => monthKeyFromDate(t.date) === key && (!scope || t.scope === scope)
  );
}

function sum(arr) {
  return arr.reduce((a, t) => a + (Number(t.amount) || 0), 0);
}

// ---------- personal metrics ----------
export function personalMetrics(data, key) {
  const tx = txForMonth(data.transactions, key, "personal");
  const income = sum(tx.filter((t) => t.type === "income"));
  const expenses = tx.filter((t) => t.type === "expense");

  const byCat = (cat) => sum(expenses.filter((t) => t.category === cat));
  const savings = byCat("Savings");
  const investments = byCat("Investments");
  const bills = byCat("Bills");
  const fuel = byCat("Fuel");

  // total spending excludes wealth allocations (savings/investments)
  const spending = sum(expenses.filter((t) => !WEALTH_CATEGORIES.includes(t.category)));

  // general discretionary spending excludes bills, fuel & wealth allocations
  const generalSpending = sum(
    expenses.filter(
      (t) => !["Bills", "Fuel", ...WEALTH_CATEGORIES].includes(t.category)
    )
  );

  const wasted = sum(
    expenses.filter((t) => t.necessary === false || t.category === "Wasted Money")
  );

  return {
    income,
    spending,
    generalSpending,
    bills,
    fuel,
    savings,
    investments,
    wasted,
    byCat,
    expenses,
    transactions: tx,
  };
}

// ---------- business metrics ----------
export function businessMetrics(data, key) {
  const tx = txForMonth(data.transactions, key, "business");
  const revenue = sum(tx.filter((t) => t.type === "income"));
  const expenses = sum(tx.filter((t) => t.type === "expense"));
  const profit = revenue - expenses;
  const taxReserve = Math.round((revenue * (data.business?.taxReservePct ?? 25)) / 100);
  const recurring = sum(
    tx.filter((t) => t.type === "income" && RECURRING_REVENUE_CATEGORIES.includes(t.category))
  );
  const pipe = data.pipeline?.[key] || {};
  const outstanding = pipe.revenuePending || 0;
  const mrr = pipe.mrr || recurring;

  return { revenue, expenses, profit, taxReserve, recurring, mrr, outstanding, transactions: tx, pipeline: pipe };
}

// ---------- net worth ----------
export function netWorthSnapshot(data) {
  const assets = Object.values(data.assets || {}).reduce((a, v) => a + (Number(v) || 0), 0);
  const liabilities = Object.values(data.liabilities || {}).reduce((a, v) => a + (Number(v) || 0), 0);
  return { assets, liabilities, netWorth: assets - liabilities };
}

export function netWorthForMonth(data, key) {
  const hist = data.netWorthHistory || {};
  if (hist[key] != null) return hist[key];
  // fall back to current snapshot for the live month
  return netWorthSnapshot(data).netWorth;
}

// ---------- growth helpers ----------
export function pctChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// ---------- cash available ----------
export function cashAvailable(data) {
  return Number(data.assets?.cash) || 0;
}

export function businessCash(data, key) {
  // running business profit across all history up to & including key
  const months = Object.keys(data.pipeline || {});
  let total = 0;
  data.transactions
    .filter((t) => t.scope === "business")
    .forEach((t) => {
      if (monthKeyFromDate(t.date) <= key) {
        total += t.type === "income" ? t.amount : -t.amount;
      }
    });
  return Math.round(total * 0.55); // a realistic retained-cash portion after draws/tax
}

// ---------- wealth score (0-100) ----------
export function wealthScore(data, key) {
  const prev = prevMonthKey(key);
  const p = personalMetrics(data, key);
  const pPrev = personalMetrics(data, prev);
  const b = businessMetrics(data, key);
  const bPrev = businessMetrics(data, prev);
  const budgets = data.personalBudgets || {};

  const savingsConsistency = clamp(
    ((p.savings + p.investments) / Math.max(1, (budgets.savingsGoal || 0) + (budgets.investmentGoal || 0))) * 100,
    0,
    100
  );
  const spendingControl = clamp(
    (1 - p.generalSpending / Math.max(1, budgets.generalSpending || 1)) * 100 + 50,
    0,
    100
  );
  const wasteControl = clamp((1 - p.wasted / Math.max(1, budgets.wastedMoneyLimit || 1)) * 100, 0, 100);
  const incomeGrowth = clamp(50 + pctChange(p.income, pPrev.income), 0, 100);
  const businessGrowth = clamp(50 + pctChange(b.revenue, bPrev.revenue), 0, 100);
  const nwGrowth = clamp(50 + pctChange(netWorthForMonth(data, key), netWorthForMonth(data, prev)) * 4, 0, 100);

  const score = Math.round(
    savingsConsistency * 0.2 +
      spendingControl * 0.15 +
      wasteControl * 0.2 +
      incomeGrowth * 0.15 +
      businessGrowth * 0.15 +
      nwGrowth * 0.15
  );

  return {
    score: clamp(score, 0, 100),
    parts: { savingsConsistency, spendingControl, wasteControl, incomeGrowth, businessGrowth, nwGrowth },
  };
}

export function scoreTier(score) {
  if (score >= 81) return { label: "Elite", color: "#1fe39d" };
  if (score >= 61) return { label: "Strong", color: "#54f3b8" };
  if (score >= 41) return { label: "Average", color: "#ffcf4d" };
  return { label: "Weak", color: "#ff6b6b" };
}

// ---------- monthly ranking (0-100, 4x25) ----------
export function monthlyRanking(data, key) {
  const prev = prevMonthKey(key);
  const p = personalMetrics(data, key);
  const b = businessMetrics(data, key);
  const bPrev = businessMetrics(data, prev);
  const budgets = data.personalBudgets || {};

  const savingsConsistency = clamp(
    ((p.savings + p.investments) / Math.max(1, (budgets.savingsGoal || 0) + (budgets.investmentGoal || 0))) * 25,
    0,
    25
  );
  const revenueGrowth = clamp(12.5 + pctChange(b.revenue, bPrev.revenue) * 0.6, 0, 25);
  const spendingControl = clamp((1 - p.generalSpending / Math.max(1, budgets.generalSpending || 1)) * 25 + 12.5, 0, 25);
  const businessProgress = clamp((b.revenue / Math.max(1, data.businessGoals?.revenueGoal || 1)) * 25, 0, 25);

  const total = Math.round(savingsConsistency + revenueGrowth + spendingControl + businessProgress);
  return {
    total: clamp(total, 0, 100),
    grade: gradeFor(total),
    parts: {
      savingsConsistency: Math.round(savingsConsistency),
      revenueGrowth: Math.round(revenueGrowth),
      spendingControl: Math.round(spendingControl),
      businessProgress: Math.round(businessProgress),
    },
  };
}

export function gradeFor(total) {
  if (total >= 90) return "A+";
  if (total >= 80) return "A";
  if (total >= 70) return "B";
  if (total >= 60) return "C";
  return "D";
}

export function gradeColor(grade) {
  switch (grade) {
    case "A+":
      return "#1fe39d";
    case "A":
      return "#54f3b8";
    case "B":
      return "#ffcf4d";
    case "C":
      return "#ff9f40";
    default:
      return "#ff6b6b";
  }
}

// ---------- financial freedom ----------
export function freedomMetrics(data, key) {
  const p = personalMetrics(data, key);
  const b = businessMetrics(data, key);
  const f = data.freedom || {};

  const currentMonthlyIncome = p.income + b.profit;
  const currentAnnualIncome = currentMonthlyIncome * 12;
  const currentNetWorth = netWorthForMonth(data, key);

  const incomeProgress = clamp((currentMonthlyIncome / Math.max(1, f.desiredMonthlyIncome || 1)) * 100, 0, 100);
  const annualProgress = clamp((currentAnnualIncome / Math.max(1, f.desiredAnnualIncome || 1)) * 100, 0, 100);
  const netWorthProgress = clamp((currentNetWorth / Math.max(1, f.desiredNetWorth || 1)) * 100, 0, 100);

  const overall = Math.round((incomeProgress + netWorthProgress) / 2);

  // historical income series & best month
  const series = lastNMonths(key, 12)
    .map((k) => {
      const pm = personalMetrics(data, k);
      const bm = businessMetrics(data, k);
      const total = pm.income + bm.profit;
      return { key, label: monthLabel(k, true), value: total, raw: k };
    })
    .filter((s) => s.value > 0);

  const best = series.reduce((acc, s) => (s.value > (acc?.value || 0) ? s : acc), null);

  // estimated completion based on avg monthly growth of income
  const completion = estimateCompletion(series, currentMonthlyIncome, f.desiredMonthlyIncome);

  return {
    currentMonthlyIncome,
    currentAnnualIncome,
    currentNetWorth,
    desiredMonthlyIncome: f.desiredMonthlyIncome || 0,
    desiredAnnualIncome: f.desiredAnnualIncome || 0,
    desiredNetWorth: f.desiredNetWorth || 0,
    incomeProgress,
    annualProgress,
    netWorthProgress,
    overall,
    amountRemaining: Math.max(0, (f.desiredMonthlyIncome || 0) - currentMonthlyIncome),
    netWorthRemaining: Math.max(0, (f.desiredNetWorth || 0) - currentNetWorth),
    series,
    best,
    completion,
  };
}

function estimateCompletion(series, current, target) {
  if (!target || current >= target) return current >= target ? "Achieved" : null;
  if (series.length < 2) return null;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  const months = series.length - 1;
  const avgGrowth = (last - first) / months; // absolute £/month
  if (avgGrowth <= 0) return null;
  const monthsNeeded = Math.ceil((target - current) / avgGrowth);
  if (monthsNeeded <= 0 || monthsNeeded > 600) return null;
  const date = parseMonthKey(addMonths(series[series.length - 1].raw, monthsNeeded));
  return { monthsNeeded, label: monthLabel(addMonths(series[series.length - 1].raw, monthsNeeded)) };
}

// ---------- waste analytics ----------
export function wasteAnalytics(data, key) {
  const months = lastNMonths(key, 6);
  const series = months.map((k) => {
    const p = personalMetrics(data, k);
    return { key: k, label: monthLabel(k, true), value: p.wasted };
  });
  const current = series[series.length - 1]?.value || 0;
  const previous = series[series.length - 2]?.value || 0;
  const reduction = previous ? clamp(((previous - current) / previous) * 100, -100, 100) : 0;

  // categories & triggers from all wasted tx
  const wastedTx = data.transactions.filter(
    (t) => t.scope === "personal" && t.type === "expense" && (t.necessary === false || t.category === "Wasted Money")
  );
  const byCategory = {};
  const byTrigger = {};
  let total = 0;
  wastedTx.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    const trig = t.waste?.trigger || "Other";
    byTrigger[trig] = (byTrigger[trig] || 0) + 1;
    total += t.amount;
  });

  const avgMonthly = series.reduce((a, s) => a + s.value, 0) / Math.max(1, series.length);
  const annualIfHalved = Math.round(avgMonthly * 12 * 0.5);

  return {
    series,
    current,
    previous,
    reduction,
    byCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1]),
    byTrigger: Object.entries(byTrigger).sort((a, b) => b[1] - a[1]),
    total,
    avgMonthly,
    annualIfHalved,
  };
}

// ---------- red flag alerts ----------
export function redFlags(data, key) {
  const flags = [];
  const prev = prevMonthKey(key);
  const p = personalMetrics(data, key);
  const b = businessMetrics(data, key);
  const bPrev = businessMetrics(data, prev);
  const budgets = data.personalBudgets || {};

  if (budgets.generalSpending && p.generalSpending > budgets.generalSpending) {
    const over = Math.round(((p.generalSpending - budgets.generalSpending) / budgets.generalSpending) * 100);
    flags.push({ level: "danger", text: `Spending is ${over}% above your general budget.` });
  }
  if (budgets.wastedMoneyLimit && p.wasted > budgets.wastedMoneyLimit) {
    const over = Math.round(((p.wasted - budgets.wastedMoneyLimit) / budgets.wastedMoneyLimit) * 100);
    flags.push({ level: "danger", text: `Wasted spending is ${over}% above target.` });
  }
  if (budgets.savingsGoal && p.savings < budgets.savingsGoal * 0.7) {
    const behind = Math.round((1 - p.savings / budgets.savingsGoal) * 100);
    flags.push({ level: "warn", text: `Savings are ${behind}% behind your monthly goal.` });
  }
  const revDrop = pctChange(b.revenue, bPrev.revenue);
  if (revDrop < -10) {
    flags.push({ level: "warn", text: `Revenue is down ${Math.abs(Math.round(revDrop))}% compared to last month.` });
  }
  const expSpike = pctChange(b.expenses, bPrev.expenses);
  if (expSpike > 25 && bPrev.expenses > 0) {
    flags.push({ level: "warn", text: `Business expenses spiked ${Math.round(expSpike)}% versus last month.` });
  }
  return flags;
}

// ---------- monthly review generation ----------
export function generateReview(data, key) {
  const prev = prevMonthKey(key);
  const p = personalMetrics(data, key);
  const pPrev = personalMetrics(data, prev);
  const b = businessMetrics(data, key);
  const bPrev = businessMetrics(data, prev);
  const budgets = data.personalBudgets || {};
  const cur = data.settings?.currencySymbol || "£";
  const money = (v) => `${cur}${Math.round(v).toLocaleString("en-GB")}`;

  const wins = [];
  const improve = [];
  const focus = [];

  if (p.savings + p.investments > 0)
    wins.push(`Moved ${money(p.savings + p.investments)} into savings & investments.`);
  if (b.revenue > bPrev.revenue)
    wins.push(`Grew business revenue by ${Math.round(pctChange(b.revenue, bPrev.revenue))}% to ${money(b.revenue)}.`);
  if (b.profit > 0) wins.push(`Generated ${money(b.profit)} in business profit.`);
  if (p.wasted < pPrev.wasted) wins.push(`Cut wasted spending to ${money(p.wasted)} (down from ${money(pPrev.wasted)}).`);
  if (p.income > pPrev.income) wins.push(`Personal income rose to ${money(p.income)}.`);

  if (budgets.wastedMoneyLimit && p.wasted > budgets.wastedMoneyLimit)
    improve.push(`Wasted ${money(p.wasted)} — ${money(p.wasted - budgets.wastedMoneyLimit)} over your limit.`);
  if (budgets.generalSpending && p.generalSpending > budgets.generalSpending)
    improve.push(`General spending hit ${money(p.generalSpending)}, above the ${money(budgets.generalSpending)} budget.`);
  if (budgets.savingsGoal && p.savings < budgets.savingsGoal)
    improve.push(`Savings of ${money(p.savings)} fell short of the ${money(budgets.savingsGoal)} goal.`);
  if (b.revenue < bPrev.revenue)
    improve.push(`Revenue dipped ${Math.abs(Math.round(pctChange(b.revenue, bPrev.revenue)))}% versus last month.`);

  // 3 priorities
  const wa = wasteAnalytics(data, key);
  if (p.wasted > 0)
    focus.push(`Reduce wasted spending — top trigger is "${wa.byTrigger[0]?.[0] || "Impulse"}". Halving it saves ${money(wa.annualIfHalved)}/yr.`);
  focus.push(`Push revenue toward your ${money(data.businessGoals?.revenueGoal || 0)} goal by closing pipeline deals.`);
  focus.push(`Automate ${money(budgets.savingsGoal || 0)} into savings on payday before spending.`);

  return {
    wins: wins.slice(0, 5),
    improve: improve.slice(0, 4),
    focus: focus.slice(0, 3),
  };
}

// ---------- generic trend series ----------
export function trendSeries(data, endKey, count, fn) {
  return lastNMonths(endKey, count).map((k) => ({
    key: k,
    label: monthLabel(k, true),
    ...fn(k),
  }));
}
