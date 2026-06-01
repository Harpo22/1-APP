import { buildDemoData } from "./demo.js";
import {
  DEFAULT_MISSION_LAYOUT,
  DEFAULT_CEO_BRIEF,
  BUSINESS_REVENUE_CATEGORIES,
  BUSINESS_EXPENSE_CATEGORIES,
  MISSION_CARDS,
} from "./constants.js";
import { currentMonthKey, parseMonthKey, uid } from "./format.js";

const STORAGE_KEY = "money_os_v1";

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const demo = buildDemoData();
      saveData(demo);
      return demo;
    }
    return normalizeData(JSON.parse(raw));
  } catch (e) {
    console.warn("Failed to load data, seeding demo.", e);
    const demo = buildDemoData();
    saveData(demo);
    return demo;
  }
}

export function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save data.", e);
  }
}

// Ensures older / partial documents gain every field the current app expects.
export function normalizeData(d) {
  if (!d || typeof d !== "object") return buildDemoData();
  const data = { ...d };
  data.meta = { version: 2, createdAt: data.meta?.createdAt || new Date().toISOString(), updatedAt: data.meta?.updatedAt || new Date().toISOString(), isDemo: data.meta?.isDemo ?? false };
  data.settings = { name: "Founder", currencyCode: "GBP", currencySymbol: "£", ...data.settings };
  data.freedom = {
    desiredMonthlyIncome: 10000,
    desiredAnnualIncome: 120000,
    desiredNetWorth: 1000000,
    retirementNumber: 0,
    freedomDateGoal: "",
    ...data.freedom,
  };
  data.futureSelf = { lifestyleVision: "", freedomGoal: "", dreamNetWorth: 0, mainReason: "", ...data.futureSelf };
  data.personalBudgets = {
    incomeTarget: 0,
    generalSpending: 800,
    fuel: 250,
    bills: 700,
    savingsGoal: 1000,
    investmentGoal: 500,
    wastedMoneyLimit: 150,
    ...data.personalBudgets,
  };
  data.businessGoals = { monthlyLeadGoal: 40, revenueGoal: 6000, profitGoal: 4000, clientGoal: 12, mrrGoal: 3000, ...data.businessGoals };
  data.business = {
    taxReservePct: 25,
    cash: 0,
    cashOverride: false,
    revenueSources: BUSINESS_REVENUE_CATEGORIES.slice(),
    expenseCategories: BUSINESS_EXPENSE_CATEGORIES.slice(),
    assets: [],
    ...data.business,
  };
  data.funds = { emergencyFund: 0, houseDeposit: 0, investmentFund: 0, retirementFund: 0, ...data.funds };
  data.owner = { netWorthOverride: 0, useNetWorthOverride: false, ...data.owner };
  data.assets = { cash: 0, savings: 0, investments: 0, crypto: 0, vehicles: 0, businessValue: 0, other: 0, ...data.assets };
  data.liabilities = { loans: 0, creditCards: 0, otherDebt: 0, ...data.liabilities };
  data.netWorthHistory = data.netWorthHistory || {};
  data.transactions = Array.isArray(data.transactions) ? data.transactions : [];
  data.pipeline = data.pipeline || {};
  data.legacyGoals = Array.isArray(data.legacyGoals) ? data.legacyGoals : [];
  data.reviews = data.reviews || {};
  data.snapshots = Array.isArray(data.snapshots) ? data.snapshots : [];

  // mission layout: keep order, drop unknown ids, append any new cards
  const savedLayout = Array.isArray(data.layout?.missionCards) ? data.layout.missionCards : DEFAULT_MISSION_LAYOUT;
  const known = new Set(MISSION_CARDS.map((c) => c.id));
  const seen = new Set();
  const merged = [];
  savedLayout.forEach((c) => {
    if (c && known.has(c.id) && !seen.has(c.id)) {
      merged.push({ id: c.id, visible: c.visible !== false });
      seen.add(c.id);
    }
  });
  MISSION_CARDS.forEach((c) => {
    if (!seen.has(c.id)) merged.push({ id: c.id, visible: true });
  });
  data.layout = { missionCards: merged };

  data.ceoBrief = {
    metrics: DEFAULT_CEO_BRIEF.metrics.slice(),
    showAlerts: true,
    goals: [],
    businessMetrics: DEFAULT_CEO_BRIEF.businessMetrics.slice(),
    ...data.ceoBrief,
  };
  return data;
}

export function resetData() {
  const demo = buildDemoData();
  saveData(demo);
  return demo;
}

export function clearData() {
  const blank = buildDemoData();
  blank.meta.isDemo = false;
  blank.transactions = [];
  blank.pipeline = {};
  blank.netWorthHistory = {};
  blank.legacyGoals = [];
  blank.reviews = {};
  blank.snapshots = [];
  blank.assets = { cash: 0, savings: 0, investments: 0, crypto: 0, vehicles: 0, businessValue: 0, other: 0 };
  blank.liabilities = { loans: 0, creditCards: 0, otherDebt: 0 };
  blank.funds = { emergencyFund: 0, houseDeposit: 0, investmentFund: 0, retirementFund: 0 };
  blank.business.assets = [];
  saveData(blank);
  return blank;
}

// ---------- snapshots ----------
export function makeSnapshot(data, type = "manual") {
  const cur = currentMonthKey();
  const { year, monthIndex } = parseMonthKey(cur);
  const labelMap = {
    monthly: `Monthly · ${cur}`,
    quarterly: `Q${Math.floor(monthIndex / 3) + 1} ${year}`,
    yearly: `Year ${year}`,
    manual: `Manual · ${new Date().toLocaleString("en-GB")}`,
  };
  const { snapshots, ...rest } = data;
  return {
    id: uid(),
    type,
    label: labelMap[type] || labelMap.manual,
    monthKey: cur,
    createdAt: new Date().toISOString(),
    data: JSON.parse(JSON.stringify(rest)),
  };
}

// Adds a snapshot, de-duplicating auto snapshots so only one exists per period.
export function addSnapshot(data, type) {
  const snap = makeSnapshot(data, type);
  let snapshots = (data.snapshots || []).slice();
  if (type !== "manual") {
    snapshots = snapshots.filter((s) => !(s.type === type && s.label === snap.label));
  }
  snapshots.unshift(snap);
  snapshots = snapshots.slice(0, 36); // cap history
  return { ...data, snapshots };
}

export function restoreSnapshot(data, snapshotId) {
  const snap = (data.snapshots || []).find((s) => s.id === snapshotId);
  if (!snap) return data;
  const restored = normalizeData({ ...snap.data });
  restored.snapshots = data.snapshots; // preserve snapshot history
  restored.meta = { ...restored.meta, updatedAt: new Date().toISOString() };
  return restored;
}

// Auto-snapshot if the current period hasn't been captured yet.
export function ensureAutoSnapshots(data) {
  const cur = currentMonthKey();
  const { year, monthIndex } = parseMonthKey(cur);
  const want = [
    { type: "monthly", label: `Monthly · ${cur}` },
    { type: "quarterly", label: `Q${Math.floor(monthIndex / 3) + 1} ${year}` },
    { type: "yearly", label: `Year ${year}` },
  ];
  let next = data;
  let changed = false;
  want.forEach((w) => {
    const exists = (next.snapshots || []).some((s) => s.type === w.type && s.label === w.label);
    if (!exists) {
      next = addSnapshot(next, w.type);
      changed = true;
    }
  });
  return changed ? next : data;
}

// ---------- export / import ----------
export function exportJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  download(blob, `money-os-backup-${new Date().toISOString().slice(0, 10)}.json`);
}

export function exportCSV(data) {
  const headers = [
    "id", "scope", "type", "amount", "category", "date",
    "paymentMethod", "necessary", "notes", "wasteVerdict", "wasteTrigger", "wasteWhy",
  ];
  const rows = data.transactions.map((t) =>
    [
      t.id, t.scope, t.type, t.amount, t.category, t.date,
      t.paymentMethod, t.necessary, csvEscape(t.notes),
      t.waste?.verdict || "", t.waste?.trigger || "", csvEscape(t.waste?.why || ""),
    ].join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  download(blob, `money-os-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
}

function csvEscape(value) {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.transactions)) {
          throw new Error("Invalid backup file");
        }
        resolve(normalizeData(parsed));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// Parse a CSV exported from this app and merge transactions into existing data.
export function importCSV(file, existing) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result);
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (!lines.length) throw new Error("Empty CSV");
        const header = parseCSVLine(lines[0]);
        const idx = (name) => header.indexOf(name);
        const existingIds = new Set(existing.transactions.map((t) => t.id));
        const added = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length < 6) continue;
          const id = cols[idx("id")] || uid();
          if (existingIds.has(id)) continue; // prevent duplicates
          existingIds.add(id);
          added.push({
            id,
            scope: cols[idx("scope")] || "personal",
            type: cols[idx("type")] || "expense",
            amount: Number(cols[idx("amount")]) || 0,
            category: cols[idx("category")] || "Other",
            date: cols[idx("date")] || new Date().toISOString().slice(0, 10),
            paymentMethod: cols[idx("paymentMethod")] || "Card",
            necessary: cols[idx("necessary")] !== "false",
            notes: cols[idx("notes")] || "",
            waste:
              cols[idx("wasteVerdict")] || cols[idx("wasteTrigger")]
                ? { verdict: cols[idx("wasteVerdict")] || "", trigger: cols[idx("wasteTrigger")] || "", why: cols[idx("wasteWhy")] || "" }
                : null,
          });
        }
        resolve({ ...existing, transactions: [...added, ...existing.transactions], meta: { ...existing.meta, isDemo: false } });
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function parseCSVLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}
