// Formatting + date helpers shared across the app.

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// monthKey is "YYYY-MM"
export function monthKey(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export function parseMonthKey(key) {
  const [y, m] = key.split("-").map(Number);
  return { year: y, monthIndex: m - 1 };
}

export function monthKeyFromDate(dateStr) {
  return dateStr.slice(0, 7);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonthKey() {
  const d = new Date();
  return monthKey(d.getFullYear(), d.getMonth());
}

// Returns the previous monthKey for a given key
export function prevMonthKey(key) {
  const { year, monthIndex } = parseMonthKey(key);
  if (monthIndex === 0) return monthKey(year - 1, 11);
  return monthKey(year, monthIndex - 1);
}

export function addMonths(key, n) {
  let { year, monthIndex } = parseMonthKey(key);
  monthIndex += n;
  year += Math.floor(monthIndex / 12);
  monthIndex = ((monthIndex % 12) + 12) % 12;
  return monthKey(year, monthIndex);
}

export function monthLabel(key, short = false) {
  const { year, monthIndex } = parseMonthKey(key);
  const names = short ? MONTH_SHORT : MONTH_NAMES;
  return `${names[monthIndex]} ${year}`;
}

// Build a list of N monthKeys ending at endKey (inclusive)
export function lastNMonths(endKey, n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(addMonths(endKey, -i));
  return out;
}

export function formatCurrency(value, symbol = "£", opts = {}) {
  const { decimals = 0, sign = false } = opts;
  const num = Number(value) || 0;
  const abs = Math.abs(num);
  const formatted = abs.toLocaleString("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const prefix = num < 0 ? "-" : sign ? "+" : "";
  return `${prefix}${symbol}${formatted}`;
}

// Compact: £1.2k, £3.4m
export function formatCompact(value, symbol = "£") {
  const num = Number(value) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}m`;
  if (abs >= 1_000) return `${sign}${symbol}${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return `${sign}${symbol}${abs.toLocaleString("en-GB")}`;
}

export function formatPercent(value, decimals = 0) {
  const num = Number(value) || 0;
  return `${num.toFixed(decimals)}%`;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
