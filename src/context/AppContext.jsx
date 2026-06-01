import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadData, saveData } from "../lib/storage.js";
import { currentMonthKey, monthKey, parseMonthKey, uid } from "../lib/format.js";
import { CURRENCIES } from "../lib/constants.js";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [data, setData] = useState(() => loadData());
  const [selectedMonth, setSelectedMonth] = useState(() => currentMonthKey());

  // persist on every change
  useEffect(() => {
    saveData(data);
  }, [data]);

  const update = (updater) =>
    setData((prev) => (typeof updater === "function" ? updater(prev) : { ...prev, ...updater }));

  const symbol = data.settings?.currencySymbol || "£";

  const actions = useMemo(() => {
    return {
      // ---- transactions ----
      addTransaction(tx) {
        update((d) => ({ ...d, transactions: [{ ...tx, id: uid() }, ...d.transactions] }));
      },
      updateTransaction(id, patch) {
        update((d) => ({
          ...d,
          transactions: d.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }));
      },
      deleteTransaction(id) {
        update((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }));
      },

      // ---- settings / profile ----
      setSettings(patch) {
        update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
      },
      setCurrency(code) {
        const c = CURRENCIES.find((x) => x.code === code) || CURRENCIES[0];
        update((d) => ({ ...d, settings: { ...d.settings, currencyCode: c.code, currencySymbol: c.symbol } }));
      },

      // ---- freedom / future self ----
      setFreedom(patch) {
        update((d) => ({ ...d, freedom: { ...d.freedom, ...patch } }));
      },
      setFutureSelf(patch) {
        update((d) => ({ ...d, futureSelf: { ...d.futureSelf, ...patch } }));
      },

      // ---- budgets / goals ----
      setBudgets(patch) {
        update((d) => ({ ...d, personalBudgets: { ...d.personalBudgets, ...patch } }));
      },
      setBusinessGoals(patch) {
        update((d) => ({ ...d, businessGoals: { ...d.businessGoals, ...patch } }));
      },
      setBusiness(patch) {
        update((d) => ({ ...d, business: { ...d.business, ...patch } }));
      },

      // ---- net worth ----
      setAsset(key, value) {
        update((d) => ({ ...d, assets: { ...d.assets, [key]: value } }));
      },
      setLiability(key, value) {
        update((d) => ({ ...d, liabilities: { ...d.liabilities, [key]: value } }));
      },
      snapshotNetWorth(monthK, value) {
        update((d) => ({ ...d, netWorthHistory: { ...d.netWorthHistory, [monthK]: value } }));
      },

      // ---- pipeline ----
      setPipeline(monthK, patch) {
        update((d) => ({
          ...d,
          pipeline: { ...d.pipeline, [monthK]: { ...(d.pipeline?.[monthK] || {}), ...patch } },
        }));
      },

      // ---- legacy goals ----
      addLegacyGoal(goal) {
        update((d) => ({ ...d, legacyGoals: [...d.legacyGoals, { ...goal, id: uid() }] }));
      },
      updateLegacyGoal(id, patch) {
        update((d) => ({
          ...d,
          legacyGoals: d.legacyGoals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        }));
      },
      deleteLegacyGoal(id) {
        update((d) => ({ ...d, legacyGoals: d.legacyGoals.filter((g) => g.id !== id) }));
      },

      // ---- reviews override ----
      setReview(monthK, patch) {
        update((d) => ({ ...d, reviews: { ...d.reviews, [monthK]: { ...(d.reviews?.[monthK] || {}), ...patch } } }));
      },

      // ---- whole data replace ----
      replaceData(next) {
        setData(next);
      },
    };
  }, []);

  const value = {
    data,
    setData,
    selectedMonth,
    setSelectedMonth,
    symbol,
    actions,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
