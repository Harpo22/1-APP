import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { loadData, saveData, ensureAutoSnapshots, addSnapshot, restoreSnapshot } from "../lib/storage.js";
import { currentMonthKey, uid } from "../lib/format.js";
import { CURRENCIES } from "../lib/constants.js";
import { supabase, isSupabaseConfigured, DATA_TABLE } from "../lib/supabase.js";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [data, setData] = useState(() => ensureAutoSnapshots(loadData()));
  const [selectedMonth, setSelectedMonth] = useState(() => currentMonthKey());

  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [sync, setSync] = useState({
    state: isSupabaseConfigured ? "signedout" : "local",
    lastSynced: null,
    error: null,
  });

  const skipPushRef = useRef(false);
  const pushTimer = useRef(null);
  const sessionRef = useRef(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  // persist locally on every change (local cache = offline buffer)
  useEffect(() => {
    saveData(data);
  }, [data]);

  // mutate helper: marks doc as real (non-demo) + bumps updatedAt
  const update = (updater) =>
    setData((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      return { ...next, meta: { ...next.meta, isDemo: false, updatedAt: new Date().toISOString() } };
    });

  const symbol = data.settings?.currencySymbol || "£";

  // ---------------- cloud sync ----------------
  const pushRemote = async (doc) => {
    if (!isSupabaseConfigured || !sessionRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSync((s) => ({ ...s, state: "offline" }));
      return;
    }
    setSync((s) => ({ ...s, state: "syncing", error: null }));
    const { error } = await supabase
      .from(DATA_TABLE)
      .upsert({ user_id: sessionRef.current.user.id, data: doc, updated_at: new Date().toISOString() });
    if (error) setSync((s) => ({ ...s, state: "error", error: error.message }));
    else setSync({ state: "saved", lastSynced: new Date().toISOString(), error: null });
  };

  const pullRemote = async () => {
    if (!isSupabaseConfigured || !sessionRef.current) return;
    setSync((s) => ({ ...s, state: "syncing", error: null }));
    const { data: row, error } = await supabase
      .from(DATA_TABLE)
      .select("data, updated_at")
      .eq("user_id", sessionRef.current.user.id)
      .maybeSingle();
    if (error) {
      setSync((s) => ({ ...s, state: "error", error: error.message }));
      return;
    }
    if (row?.data && Array.isArray(row.data.transactions)) {
      // online -> database is the source of truth
      skipPushRef.current = true;
      const { normalizeData } = await import("../lib/storage.js");
      setData(ensureAutoSnapshots(normalizeData(row.data)));
      setSync({ state: "saved", lastSynced: row.updated_at || new Date().toISOString(), error: null });
    } else {
      // no cloud record yet -> migrate the local doc up
      await pushRemote(dataRef.current);
    }
  };

  // auth bootstrap
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let sub;
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      sessionRef.current = s;
      setSession(s);
      setAuthReady(true);
      if (s) {
        setSync((x) => ({ ...x, state: "syncing" }));
        pullRemote();
      } else {
        setSync((x) => ({ ...x, state: "signedout" }));
      }
    });
    const res = supabase.auth.onAuthStateChange((_event, s) => {
      sessionRef.current = s;
      setSession(s);
      if (s) pullRemote();
      else setSync({ state: "signedout", lastSynced: null, error: null });
    });
    sub = res.data.subscription;
    return () => sub?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounced push on data change
  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    if (skipPushRef.current) {
      skipPushRef.current = false;
      return;
    }
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => pushRemote(dataRef.current), 1200);
    return () => pushTimer.current && clearTimeout(pushTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, session]);

  // online / offline handling
  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      if (isSupabaseConfigured && sessionRef.current) pushRemote(dataRef.current);
    };
    const goOffline = () => {
      setOnline(false);
      setSync((s) => ({ ...s, state: "offline" }));
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------- actions ----------------
  const actions = useMemo(() => {
    return {
      // transactions
      addTransaction(tx) {
        update((d) => ({ ...d, transactions: [{ ...tx, id: uid() }, ...d.transactions] }));
      },
      updateTransaction(id, patch) {
        update((d) => ({ ...d, transactions: d.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
      },
      deleteTransaction(id) {
        update((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }));
      },

      // settings / profile
      setSettings(patch) {
        update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
      },
      setCurrency(code) {
        const c = CURRENCIES.find((x) => x.code === code) || CURRENCIES[0];
        update((d) => ({ ...d, settings: { ...d.settings, currencyCode: c.code, currencySymbol: c.symbol } }));
      },

      // freedom / future self
      setFreedom(patch) {
        update((d) => ({ ...d, freedom: { ...d.freedom, ...patch } }));
      },
      setFutureSelf(patch) {
        update((d) => ({ ...d, futureSelf: { ...d.futureSelf, ...patch } }));
      },

      // budgets / goals / business
      setBudgets(patch) {
        update((d) => ({ ...d, personalBudgets: { ...d.personalBudgets, ...patch } }));
      },
      setBusinessGoals(patch) {
        update((d) => ({ ...d, businessGoals: { ...d.businessGoals, ...patch } }));
      },
      setBusiness(patch) {
        update((d) => ({ ...d, business: { ...d.business, ...patch } }));
      },

      // owner control / funds
      setOwner(patch) {
        update((d) => ({ ...d, owner: { ...d.owner, ...patch } }));
      },
      setFunds(patch) {
        update((d) => ({ ...d, funds: { ...d.funds, ...patch } }));
      },

      // business assets list
      addBusinessAsset(asset) {
        update((d) => ({ ...d, business: { ...d.business, assets: [...(d.business.assets || []), { ...asset, id: uid() }] } }));
      },
      updateBusinessAsset(id, patch) {
        update((d) => ({ ...d, business: { ...d.business, assets: (d.business.assets || []).map((a) => (a.id === id ? { ...a, ...patch } : a)) } }));
      },
      deleteBusinessAsset(id) {
        update((d) => ({ ...d, business: { ...d.business, assets: (d.business.assets || []).filter((a) => a.id !== id) } }));
      },

      // net worth
      setAsset(key, value) {
        update((d) => ({ ...d, assets: { ...d.assets, [key]: value } }));
      },
      setLiability(key, value) {
        update((d) => ({ ...d, liabilities: { ...d.liabilities, [key]: value } }));
      },
      snapshotNetWorth(monthK, value) {
        update((d) => ({ ...d, netWorthHistory: { ...d.netWorthHistory, [monthK]: value } }));
      },

      // pipeline
      setPipeline(monthK, patch) {
        update((d) => ({ ...d, pipeline: { ...d.pipeline, [monthK]: { ...(d.pipeline?.[monthK] || {}), ...patch } } }));
      },

      // legacy goals
      addLegacyGoal(goal) {
        update((d) => ({ ...d, legacyGoals: [...d.legacyGoals, { ...goal, id: uid() }] }));
      },
      updateLegacyGoal(id, patch) {
        update((d) => ({ ...d, legacyGoals: d.legacyGoals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
      },
      deleteLegacyGoal(id) {
        update((d) => ({ ...d, legacyGoals: d.legacyGoals.filter((g) => g.id !== id) }));
      },

      // reviews
      setReview(monthK, patch) {
        update((d) => ({ ...d, reviews: { ...d.reviews, [monthK]: { ...(d.reviews?.[monthK] || {}), ...patch } } }));
      },

      // mission control layout
      setMissionLayout(missionCards) {
        update((d) => ({ ...d, layout: { ...d.layout, missionCards } }));
      },

      // ceo brief
      setCeoBrief(patch) {
        update((d) => ({ ...d, ceoBrief: { ...d.ceoBrief, ...patch } }));
      },

      // snapshots
      snapshotNow(type = "manual") {
        update((d) => addSnapshot(d, type));
      },
      restoreSnapshotById(id) {
        update((d) => restoreSnapshot(d, id));
      },
      deleteSnapshot(id) {
        update((d) => ({ ...d, snapshots: (d.snapshots || []).filter((s) => s.id !== id) }));
      },

      // whole data
      replaceData(next) {
        skipPushRef.current = false;
        setData({ ...next, meta: { ...next.meta, updatedAt: new Date().toISOString() } });
      },

      // ---- auth ----
      async signUp(email, password) {
        if (!supabase) return { error: { message: "Cloud account is not configured." } };
        const { error } = await supabase.auth.signUp({ email, password });
        return { error };
      },
      async signIn(email, password) {
        if (!supabase) return { error: { message: "Cloud account is not configured." } };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
      },
      async signOut() {
        if (!supabase) return { error: null };
        const { error } = await supabase.auth.signOut();
        return { error };
      },
      async resetPassword(email) {
        if (!supabase) return { error: { message: "Cloud account is not configured." } };
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        return { error };
      },
      async updateEmail(email) {
        if (!supabase) return { error: { message: "Cloud account is not configured." } };
        const { error } = await supabase.auth.updateUser({ email });
        return { error };
      },
      async updatePassword(password) {
        if (!supabase) return { error: { message: "Cloud account is not configured." } };
        const { error } = await supabase.auth.updateUser({ password });
        return { error };
      },
      async deleteAccountData() {
        if (supabase && sessionRef.current) {
          await supabase.from(DATA_TABLE).delete().eq("user_id", sessionRef.current.user.id);
        }
      },
      async syncNow() {
        await pushRemote(dataRef.current);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    data,
    setData,
    selectedMonth,
    setSelectedMonth,
    symbol,
    actions,
    // cloud
    session,
    authReady,
    online,
    sync,
    isCloudConfigured: isSupabaseConfigured,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
