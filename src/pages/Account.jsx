import React, { useRef, useState } from "react";
import {
  Cloud,
  LogIn,
  UserPlus,
  LogOut,
  Mail,
  KeyRound,
  RefreshCw,
  Check,
  AlertCircle,
  Download,
  Upload,
  FileText,
  History,
  RotateCcw,
  Trash2,
  Camera,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import {
  exportJSON,
  exportCSV,
  importJSON,
  importCSV,
  resetData,
  clearData,
} from "../lib/storage.js";
import { SyncStatus } from "../components/Layout.jsx";
import { GlassCard, SectionTitle, Field, Input, Button, Badge, EmptyState, cx } from "../components/ui.jsx";

function relative(iso) {
  if (!iso) return "never";
  return new Date(iso).toLocaleString("en-GB");
}

function AuthPanel() {
  const { actions, isCloudConfigured, session, sync } = useApp();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!isCloudConfigured) {
    return (
      <GlassCard className="p-5">
        <SectionTitle icon={Cloud} title="Cloud Account" subtitle="Optional — sync across devices" />
        <div className="rounded-xl border border-gold-400/20 bg-gold-500/5 p-4 text-sm text-white/70">
          <p className="font-600 text-gold-300">Running in local-only mode.</p>
          <p className="mt-1 text-white/55">
            Your data is safe on this device. To enable cloud accounts and cross-device sync, add a Supabase project and set
            <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/70">VITE_SUPABASE_URL</code>
            and
            <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/70">VITE_SUPABASE_ANON_KEY</code>,
            then run the SQL in <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/70">supabase/schema.sql</code>.
          </p>
        </div>
      </GlassCard>
    );
  }

  if (session) {
    return (
      <GlassCard className="p-5">
        <SectionTitle icon={ShieldCheck} title="Account" subtitle="Signed in & syncing to the cloud" right={<Badge color="brand">Cloud on</Badge>} />
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
            <Mail size={18} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-600 text-white">{session.user?.email}</div>
            <div className="text-xs text-white/40">Last synced {relative(sync.lastSynced)}</div>
          </div>
        </div>

        <ChangeCredentials actions={actions} />

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="ghost" icon={RefreshCw} onClick={() => actions.syncNow()}>Sync now</Button>
          <Button variant="ghost" icon={LogOut} onClick={() => actions.signOut()}>Log out</Button>
        </div>
      </GlassCard>
    );
  }

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    let res;
    if (mode === "login") res = await actions.signIn(email, password);
    else if (mode === "signup") res = await actions.signUp(email, password);
    else res = await actions.resetPassword(email);
    setBusy(false);
    if (res?.error) setMsg({ type: "error", text: res.error.message });
    else if (mode === "signup") setMsg({ type: "ok", text: "Account created. Check your email to confirm, then log in." });
    else if (mode === "reset") setMsg({ type: "ok", text: "Password reset email sent." });
  };

  return (
    <GlassCard className="p-5">
      <SectionTitle icon={Cloud} title="Cloud Account" subtitle="Never lose your data — sync across devices" />
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
        {[
          ["login", "Log In"],
          ["signup", "Sign Up"],
          ["reset", "Reset"],
        ].map(([id, label]) => (
          <button key={id} onClick={() => { setMode(id); setMsg(null); }} className={cx("rounded-lg px-3 py-2 text-sm font-600 transition", mode === id ? "bg-brand-500/15 text-brand-300" : "text-white/50")}>
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        {mode !== "reset" && (
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && submit()} />
          </Field>
        )}
        {msg && (
          <div className={cx("flex items-center gap-2 rounded-xl px-3 py-2 text-sm", msg.type === "error" ? "bg-red-500/10 text-red-300" : "bg-brand-500/10 text-brand-300")}>
            {msg.type === "error" ? <AlertCircle size={15} /> : <Check size={15} />} {msg.text}
          </div>
        )}
        <Button className="w-full" disabled={busy} icon={mode === "signup" ? UserPlus : mode === "reset" ? KeyRound : LogIn} onClick={submit}>
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset email" : "Log in"}
        </Button>
      </div>
    </GlassCard>
  );
}

function ChangeCredentials({ actions }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState(null);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
        <div className="mb-2 text-xs font-600 uppercase tracking-wider text-white/40">Change email</div>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="new@email.com" />
        <Button size="sm" variant="ghost" className="mt-2" onClick={async () => { const r = await actions.updateEmail(email); setMsg(r?.error ? r.error.message : "Confirmation email sent."); }}>
          Update email
        </Button>
      </div>
      <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
        <div className="mb-2 text-xs font-600 uppercase tracking-wider text-white/40">Change password</div>
        <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="new password" />
        <Button size="sm" variant="ghost" className="mt-2" onClick={async () => { const r = await actions.updatePassword(pw); setMsg(r?.error ? r.error.message : "Password updated."); setPw(""); }}>
          Update password
        </Button>
      </div>
      {msg && <div className="sm:col-span-2 text-xs text-white/50">{msg}</div>}
    </div>
  );
}

function Snapshots() {
  const { data, actions } = useApp();
  const snaps = data.snapshots || [];
  return (
    <GlassCard className="p-5">
      <SectionTitle
        icon={History}
        title="Snapshot System"
        subtitle="Automatic monthly, quarterly & yearly safety nets"
        right={<Button size="sm" variant="ghost" icon={Camera} onClick={() => actions.snapshotNow("manual")}>Snapshot now</Button>}
      />
      {snaps.length ? (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {snaps.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/5">
              <Badge color={s.type === "manual" ? "white" : s.type === "yearly" ? "gold" : "blue"}>{s.type}</Badge>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-600 text-white">{s.label}</div>
                <div className="text-[11px] text-white/40">{new Date(s.createdAt).toLocaleString("en-GB")}</div>
              </div>
              <button
                onClick={() => { if (confirm(`Restore "${s.label}"? Current data will be replaced.`)) actions.restoreSnapshotById(s.id); }}
                className="rounded-lg px-2.5 py-1.5 text-xs font-600 text-brand-300 hover:bg-brand-500/15"
              >
                Restore
              </button>
              <button onClick={() => actions.deleteSnapshot(s.id)} className="rounded-lg p-1.5 text-white/40 hover:bg-red-500/20 hover:text-red-300">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={History} title="No snapshots yet" subtitle="Snapshots are created automatically as months pass." />
      )}
    </GlassCard>
  );
}

export default function Account() {
  const { data, actions, sync } = useApp();
  const jsonRef = useRef(null);
  const csvRef = useRef(null);
  const [toast, setToast] = useState("");
  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  const onImportJSON = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const next = await importJSON(file);
      actions.replaceData(next);
      flash("Full backup restored.");
    } catch {
      flash("Import failed — invalid file.");
    }
    e.target.value = "";
  };

  const onImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const next = await importCSV(file, data);
      actions.replaceData(next);
      flash("Transactions imported from CSV.");
    } catch {
      flash("CSV import failed.");
    }
    e.target.value = "";
  };

  const lastBackup = (data.snapshots || [])[0]?.createdAt;

  return (
    <div className="space-y-6">
      <SectionTitle icon={Cloud} title="Account & Data" subtitle="Your data, your ownership — never locked in" />

      <AuthPanel />

      <GlassCard className="p-5">
        <SectionTitle icon={RefreshCw} title="Sync Status" />
        <div className="flex flex-wrap items-center gap-4">
          <SyncStatus />
          <div className="text-sm text-white/55">
            <div>Status: <span className="font-600 text-white capitalize">{sync.state}</span></div>
            <div>Last synced: <span className="text-white/70">{relative(sync.lastSynced)}</span></div>
            <div>Last backup snapshot: <span className="text-white/70">{relative(lastBackup)}</span></div>
          </div>
          {sync.error && <Badge color="red">{sync.error}</Badge>}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <SectionTitle icon={Download} title="Backup & Export" subtitle="Take your data anywhere, anytime" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="ghost" icon={Download} onClick={() => { exportJSON(data); flash("Full backup downloaded."); }}>Export Full Backup (JSON)</Button>
          <Button variant="ghost" icon={FileText} onClick={() => { exportCSV(data); flash("CSV exported."); }}>Export Transactions (CSV)</Button>
          <Button variant="ghost" icon={Upload} onClick={() => jsonRef.current?.click()}>Import Full Backup (JSON)</Button>
          <Button variant="ghost" icon={Upload} onClick={() => csvRef.current?.click()}>Import Transactions (CSV)</Button>
          <input ref={jsonRef} type="file" accept="application/json" className="hidden" onChange={onImportJSON} />
          <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onImportCSV} />
        </div>
      </GlassCard>

      <Snapshots />

      <GlassCard className="p-5">
        <SectionTitle icon={RotateCcw} title="Reset & Danger Zone" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="ghost" icon={RotateCcw} onClick={() => { if (confirm("Reload demo data? Replaces current data.")) { actions.replaceData(resetData()); flash("Demo data restored."); } }}>
            Reset to Demo Data
          </Button>
          <Button variant="danger" icon={Trash2} onClick={() => { if (confirm("Delete ALL local data and start blank?")) { actions.replaceData(clearData()); flash("All data cleared."); } }}>
            Delete User Data
          </Button>
        </div>
        <div className="mt-3 flex flex-col items-start gap-3 rounded-xl border border-red-400/15 bg-red-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-600 text-red-200">Delete cloud account data</div>
            <div className="text-xs text-white/40">Removes your synced record from the cloud and signs you out.</div>
          </div>
          <Button
            variant="danger"
            icon={Trash2}
            onClick={async () => {
              if (confirm("Delete your cloud data and sign out?")) {
                await actions.deleteAccountData();
                await actions.signOut();
                flash("Cloud data deleted.");
              }
            }}
          >
            Delete Account Data
          </Button>
        </div>
      </GlassCard>

      <div className="pb-2 text-center text-xs text-white/30">
        Money OS · v{data.meta?.version || 2} · You own 100% of your data.
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-600 text-ink-950 shadow-glow animate-fade-up lg:bottom-8">
          <Check size={15} /> {toast}
        </div>
      )}
    </div>
  );
}
