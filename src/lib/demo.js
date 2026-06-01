import {
  currentMonthKey,
  lastNMonths,
  parseMonthKey,
  monthKey,
  uid,
} from "./format.js";
import { WASTE_TRIGGERS, WASTE_VERDICTS } from "./constants.js";

// Deterministic pseudo-random so demo data is stable per session build.
function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function dateInMonth(key, day) {
  const { year, monthIndex } = parseMonthKey(key);
  const maxDay = new Date(year, monthIndex + 1, 0).getDate();
  const d = Math.min(day, maxDay);
  return `${key}-${String(d).padStart(2, "0")}`;
}

const PAY = ["Card", "Cash", "Bank Transfer"];

export function buildDemoData() {
  const months = lastNMonths(currentMonthKey(), 7);
  const transactions = [];
  const pipeline = {};
  const netWorthHistory = {};
  const rand = rng(20260601);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];

  let netWorth = 18400; // starting net worth, grows each month

  months.forEach((key, idx) => {
    const growth = 1 + idx * 0.06; // steady upward trend
    const noise = () => 0.85 + rand() * 0.3;

    // ---- Personal income ----
    const salary = Math.round(2500 * growth * noise());
    transactions.push(tx("personal", "income", salary, "Salary", dateInMonth(key, 28), "Monthly salary", true, "Bank Transfer"));
    const side = Math.round(380 * growth * noise());
    transactions.push(tx("personal", "income", side, "Side Income", dateInMonth(key, 15), "Freelance top-up", true, "Bank Transfer"));

    // ---- Personal expenses (necessary) ----
    const fixed = [
      ["Bills", 620, "Rent, utilities, phone", 1],
      ["Food", 340, "Groceries", 4],
      ["Fuel", 180, "Petrol", 6],
      ["Gym / Health", 45, "Gym membership", 2],
      ["Supplements", 60, "Protein + creatine", 9],
      ["Subscriptions", 38, "Streaming + cloud", 3],
    ];
    fixed.forEach(([cat, base, note, day]) => {
      transactions.push(tx("personal", "expense", Math.round(base * noise()), cat, dateInMonth(key, day), note, true, pick(PAY)));
    });

    // ---- Wealth allocations ----
    const saved = Math.round(520 * growth * noise());
    transactions.push(tx("personal", "expense", saved, "Savings", dateInMonth(key, 28), "Auto transfer to savings", true, "Bank Transfer"));
    const invested = Math.round(300 * growth * noise());
    transactions.push(tx("personal", "expense", invested, "Investments", dateInMonth(key, 28), "Index fund DCA", true, "Bank Transfer"));

    // ---- Wasted / unnecessary spending (trending down) ----
    const wasteFactor = Math.max(0.4, 1.2 - idx * 0.12);
    const wasteItems = [
      ["Nights Out", 70, "Bar tab", 12],
      ["Random Spending", 45, "Impulse gadget", 18],
      ["Clothes", 60, "Didn't need it", 22],
      ["Entertainment", 30, "Late night order", 25],
    ];
    wasteItems.forEach(([cat, base, note, day]) => {
      if (rand() > 0.25) {
        transactions.push(
          tx("personal", "expense", Math.round(base * wasteFactor * noise()), cat, dateInMonth(key, day), note, false, pick(PAY), {
            verdict: pick(WASTE_VERDICTS),
            why: note,
            trigger: pick(WASTE_TRIGGERS),
          })
        );
      }
    });

    // ---- Business revenue ----
    const revItems = [
      ["Website Builds", 1800, "Client site delivered", 8],
      ["Monthly Retainers", 950, "Retainer clients", 1],
      ["Google Business Services", 420, "GBP optimisation", 5],
      ["Content Packages", 360, "Content retainer", 11],
      ["Consulting", 500, "Strategy call", 17],
    ];
    revItems.forEach(([cat, base, note, day]) => {
      if (rand() > 0.15) {
        transactions.push(tx("business", "income", Math.round(base * growth * noise()), cat, dateInMonth(key, day), note, true, "Bank Transfer"));
      }
    });

    // ---- Business expenses ----
    const expItems = [
      ["Hosting", 40, "Server + DB", 2],
      ["Domains", 18, "Client domains", 2],
      ["Claude", 18, "AI assistant", 1],
      ["Cursor", 16, "IDE subscription", 1],
      ["Vercel", 20, "Deployments", 1],
      ["Advertising", 220, "Meta ads", 6],
      ["Contractors", 350, "Designer", 14],
      ["Office", 90, "Co-working", 3],
    ];
    expItems.forEach(([cat, base, note, day]) => {
      transactions.push(tx("business", "expense", Math.round(base * noise()), cat, dateInMonth(key, day), note, true, pick(PAY)));
    });

    // ---- Pipeline ----
    pipeline[key] = {
      newLeads: Math.round(24 * growth * noise()),
      contacted: Math.round(18 * growth * noise()),
      interested: Math.round(11 * growth * noise()),
      followUp: Math.round(7 * noise()),
      callsBooked: Math.round(9 * growth * noise()),
      proposalsSent: Math.round(6 * growth * noise()),
      dealsClosed: Math.round(3 + idx * 0.5),
      projectsDelivered: Math.round(2 + idx * 0.4),
      revenueClosed: Math.round(3200 * growth * noise()),
      revenuePending: Math.round(1400 * noise()),
      mrr: Math.round(950 * growth),
    };

    // ---- Net worth snapshot ----
    netWorth += saved + invested + Math.round(450 * growth * noise());
    netWorthHistory[key] = Math.round(netWorth);
  });

  const cur = currentMonthKey();
  const curNW = netWorthHistory[cur];

  return {
    meta: { version: 1, createdAt: new Date().toISOString() },
    settings: { name: "Alex", currencyCode: "GBP", currencySymbol: "£" },
    freedom: {
      desiredMonthlyIncome: 10000,
      desiredAnnualIncome: 120000,
      desiredNetWorth: 1000000,
    },
    futureSelf: {
      lifestyleVision:
        "Location-independent, running a £1m/year agency, mortgage-free home, two months off a year to travel with family.",
      freedomGoal: "£10,000/month in profit so work becomes a choice, not an obligation.",
      dreamNetWorth: 1000000,
      mainReason: "Give my family security and freedom my parents never had — and never feel trapped by money again.",
    },
    personalBudgets: {
      generalSpending: 800,
      fuel: 250,
      bills: 700,
      savingsGoal: 1000,
      investmentGoal: 500,
      wastedMoneyLimit: 150,
    },
    businessGoals: { monthlyLeadGoal: 40, revenueGoal: 6000 },
    business: { taxReservePct: 25 },
    assets: {
      cash: 4200,
      savings: 14800,
      investments: 9600,
      crypto: 3100,
      vehicles: 9500,
      businessValue: 22000,
      other: 1500,
    },
    liabilities: { loans: 6800, creditCards: 1200, otherDebt: 0 },
    netWorthHistory,
    transactions,
    pipeline,
    legacyGoals: [
      { id: uid(), name: "Emergency Fund", icon: "shield", current: 7800, target: 12000, deadline: deadlineFrom(cur, 6) },
      { id: uid(), name: "Business Account", icon: "briefcase", current: 9400, target: 25000, deadline: deadlineFrom(cur, 10) },
      { id: uid(), name: "House Deposit", icon: "home", current: 18500, target: 50000, deadline: deadlineFrom(cur, 24) },
      { id: uid(), name: "Investment Fund", icon: "trending-up", current: 9600, target: 100000, deadline: deadlineFrom(cur, 60) },
      { id: uid(), name: "£1 Million Net Worth", icon: "crown", current: curNW, target: 1000000, deadline: deadlineFrom(cur, 120) },
    ],
    reviews: {},
  };
}

function deadlineFrom(key, monthsAhead) {
  const { year, monthIndex } = parseMonthKey(key);
  let m = monthIndex + monthsAhead;
  const y = year + Math.floor(m / 12);
  m = m % 12;
  return `${monthKey(y, m)}-15`;
}

function tx(scope, type, amount, category, date, notes, necessary, paymentMethod, waste = null) {
  return {
    id: uid(),
    scope,
    type,
    amount: Math.max(1, Math.round(amount)),
    category,
    date,
    notes,
    necessary,
    paymentMethod,
    waste,
  };
}
