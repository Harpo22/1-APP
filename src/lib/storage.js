import { buildDemoData } from "./demo.js";

const STORAGE_KEY = "money_os_v1";

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const demo = buildDemoData();
      saveData(demo);
      return demo;
    }
    return JSON.parse(raw);
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

export function resetData() {
  const demo = buildDemoData();
  saveData(demo);
  return demo;
}

export function clearData() {
  const blank = buildDemoData();
  // strip transactions & history for a clean slate but keep structure/settings defaults
  blank.transactions = [];
  blank.pipeline = {};
  blank.netWorthHistory = {};
  blank.legacyGoals = [];
  blank.reviews = {};
  saveData(blank);
  return blank;
}

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
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
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
        resolve(parsed);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
