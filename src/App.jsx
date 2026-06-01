import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid,
} from "recharts";
import {
  Command, CheckSquare, MessageSquare, BarChart3, Sprout, Hourglass, Settings as Cog,
  Plus, Trash2, ChevronUp, ChevronDown, X, Send, Sparkles, Flame, AlertTriangle,
  Target, Quote, Heart, RotateCcw, Download, Upload, Pencil, Check, Loader2, ArrowRight,
} from "lucide-react";

/* ============================================================================
   THE 1% OPERATING SYSTEM
   A personal operating system — not a habit tracker.
   ========================================================================== */

/* ---------- Persistence layer (cross-session) ---------- */
const STORE_KEY = "one_percent_os_v1";
const store = {
  async get(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  },
  async set(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  },
};

/* ---------- Date helpers ---------- */
const dkey = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fromKey = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const weekdayShort = (d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(d).getDay()];
const isSunday = (d = new Date()) => new Date(d).getDay() === 0;

/* ---------- Defaults ---------- */
const CATEGORIES = ["Body", "Business", "Mind", "Relationships"];
const CAT_COLOR = { Body: "#d98c5f", Business: "#c9a24a", Mind: "#7fa6c9", Relationships: "#b07fc9" };

const defaultHabits = () => [
  { id: "h1", name: "Train hard", category: "Body", points: 20, priority: "critical", note: "" },
  { id: "h2", name: "Deep business work (90m)", category: "Business", points: 20, priority: "critical", note: "" },
  { id: "h3", name: "Sales outreach", category: "Business", points: 15, priority: "high", note: "" },
  { id: "h4", name: "Sleep before target", category: "Body", points: 15, priority: "critical", note: "" },
  { id: "h5", name: "Read 20 minutes", category: "Mind", points: 10, priority: "medium", note: "" },
  { id: "h6", name: "Hit protein + hydration", category: "Body", points: 5, priority: "medium", note: "" },
  { id: "h7", name: "Recovery / mobility", category: "Body", points: 5, priority: "low", note: "" },
  { id: "h8", name: "Connect with someone who matters", category: "Relationships", points: 10, priority: "medium", note: "" },
];

const freshDB = () => ({
  profile: {
    name: "",
    birthYear: 1995,
    startDate: dkey(),
    vision: "",
    goalsBusiness: "",
    goalsFitness: "",
    goalsFinancial: "",
    standards: ["I keep my word", "I train regardless of mood", "I finish what I start", "I do difficult things"],
    values: ["Discipline", "Courage", "Growth", "Integrity"],
    mission: "",
    nonNegotiables: ["Train", "Move my business forward", "Sleep on time"],
  },
  habits: defaultHabits(),
  logs: {},          // key -> { done:{habitId:true}, identity:{...}, holdingBack:"", correction:{} }
  ceo: {},           // key -> { prospects, calls, meetings, websites, revenue, clients, projects }
  aiPlans: {},       // key -> [{text, done}]
  lessons: {},       // key -> {quote, lesson, application, action}
  savedLessons: [],  // [{quote,lesson,...}]
  letters: [],       // [{date, text}]
  weeklyMirror: {},  // weekKey -> {text}
  chat: [],          // [{role, content}]
  comeback: null,    // {date, tasks:[{text,done}]}
  meta: { created: dkey(), onboarded: false },
});

/* ---------- AI bridge (real Claude calls) ---------- */
async function callClaude(system, userText, maxTokens = 900) {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, prompt: userText, maxTokens }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return (data.text || "").trim();
  } catch (e) {
    return "";
  }
}
const parseJSON = (txt) => {
  if (!txt) return null;
  try { return JSON.parse(txt.replace(/```json|```/g, "").trim()); } catch (e) { return null; }
};

function profileContext(db) {
  const p = db.profile;
  return `USER PROFILE
Name: ${p.name || "the user"}
Future vision (3-5y): ${p.vision || "(not set)"}
Business/career goals: ${p.goalsBusiness || "(not set)"}
Fitness goals: ${p.goalsFitness || "(not set)"}
Financial goals: ${p.goalsFinancial || "(not set)"}
Current mission: ${p.mission || "(not set)"}
Core values: ${p.values.join(", ")}
Personal standards: ${p.standards.join("; ")}
Non-negotiables: ${p.nonNegotiables.join("; ")}`;
}
function behaviourContext(db) {
  const rows = last(db, 10).map((k) => {
    const s = disciplineScore(db, k);
    const total = db.habits.length;
    const done = db.habits.filter((h) => db.logs[k]?.done?.[h.id]).length;
    return `${k} (${weekdayShort(fromKey(k))}): score ${s}, ${done}/${total} habits`;
  });
  return `RECENT BEHAVIOUR (most recent last)\n${rows.join("\n") || "no history yet"}`;
}
const COACH_SYSTEM = `You are the user's FUTURE SELF — the version of them, 3-5 years from now, who actually built the life they described. You have already become disciplined, successful, and at peace. You speak to your past self.

Voice: calm, direct, intelligent, honest, high-performance. Never cheesy. Never fake-motivational. Never insulting. Never use exclamation marks excessively. You do not flatter. You tell the truth with respect because you remember exactly what it felt like to be where they are. Keep responses tight — usually 2-5 sentences unless asked for more.`;

/* ---------- Scoring ---------- */
function disciplineScore(db, key) {
  const log = db.logs[key];
  const totalPts = db.habits.reduce((a, h) => a + (h.points || 0), 0);
  if (!totalPts) return 0;
  const done = db.habits.reduce((a, h) => a + (log?.done?.[h.id] ? (h.points || 0) : 0), 0);
  return Math.round((done / totalPts) * 100);
}
function categoryScore(db, key, cat) {
  const hs = db.habits.filter((h) => h.category === cat);
  const total = hs.reduce((a, h) => a + (h.points || 0), 0);
  if (!total) return null;
  const log = db.logs[key];
  const done = hs.reduce((a, h) => a + (log?.done?.[h.id] ? (h.points || 0) : 0), 0);
  return Math.round((done / total) * 100);
}
function last(db, n) {
  const arr = [];
  for (let i = n - 1; i >= 0; i--) arr.push(dkey(addDays(new Date(), -i)));
  return arr;
}
function avgScore(db, keys) {
  const vals = keys.map((k) => disciplineScore(db, k));
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
}
function streak(db) {
  let cur = 0;
  for (let i = 0; i < 400; i++) {
    const k = dkey(addDays(new Date(), -i));
    if (disciplineScore(db, k) >= 60) cur++;
    else break;
  }
  let best = 0, run = 0;
  const start = fromKey(db.meta.created);
  const days = Math.max(1, Math.round((new Date() - start) / 86400000) + 1);
  for (let i = days; i >= 0; i--) {
    const k = dkey(addDays(new Date(), -i));
    if (disciplineScore(db, k) >= 60) { run++; best = Math.max(best, run); } else run = 0;
  }
  return { current: cur, best };
}
function habitConsistency(db) {
  const keys = last(db, 30);
  return db.habits.map((h) => {
    const hits = keys.filter((k) => db.logs[k]?.done?.[h.id]).length;
    return { habit: h, rate: Math.round((hits / keys.length) * 100), hits };
  });
}

/* ---------- Drift detection ---------- */
function detectDrift(db) {
  const recent3 = last(db, 3);
  const prev7 = last(db, 10).slice(0, 7);
  const recentAvg = avgScore(db, recent3);
  const baseAvg = avgScore(db, prev7);
  const poorDays = recent3.filter((k) => disciplineScore(db, k) < 50).length;
  const hasHistory = Object.keys(db.logs).length >= 3;
  if (!hasHistory) return { level: 0 };

  if (poorDays >= 3 || (baseAvg - recentAvg >= 25 && recentAvg < 55)) {
    return {
      level: 3,
      title: "Look at your recent actions.",
      body: "Are these the actions of the person you said you wanted to become?",
    };
  }
  if (poorDays >= 2 || (baseAvg - recentAvg >= 15)) {
    return {
      level: 2,
      title: "This is becoming a pattern.",
      body: "You don't have a motivation problem. You have a standards problem.",
    };
  }
  if (baseAvg - recentAvg >= 8 || poorDays >= 1) {
    return {
      level: 1,
      title: "You're not failing. You're drifting.",
      body: "The future you're building isn't lost in one day. It's lost through small compromises repeated over time.",
    };
  }
  return { level: 0 };
}
function redFlags(db) {
  const flags = [];
  const keys7 = last(db, 7);
  const critical = db.habits.filter((h) => h.priority === "critical");
  critical.forEach((h) => {
    const missed = keys7.filter((k) => db.logs[k] && !db.logs[k]?.done?.[h.id]).length;
    const tracked = keys7.filter((k) => db.logs[k]).length;
    if (tracked >= 3 && missed >= 3) {
      flags.push({ habit: h, missed, msg: `${h.name} missed ${missed} times in the last 7 days.` });
    }
  });
  return flags;
}

/* ============================================================================
   APP
   ========================================================================== */
export default function App() {
  const [db, setDb] = useState(null);
  const [tab, setTab] = useState("command");
  const saveTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const raw = await store.get(STORE_KEY);
      let parsed = null;
      try { parsed = raw ? JSON.parse(raw) : null; } catch (e) {}
      setDb(parsed || freshDB());
    })();
  }, []);

  const persist = useCallback((next) => {
    setDb(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { store.set(STORE_KEY, JSON.stringify(next)); }, 250);
  }, []);

  const update = useCallback((fn) => {
    setDb((cur) => {
      const next = typeof fn === "function" ? fn(structuredClone(cur)) : fn;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => store.set(STORE_KEY, JSON.stringify(next)), 250);
      return next;
    });
  }, []);

  if (!db) {
    return (
      <Shell>
        <div className="flex h-[80vh] items-center justify-center text-stone-600">
          <Loader2 className="animate-spin" size={28} />
        </div>
      </Shell>
    );
  }

  if (!db.meta.onboarded) {
    return <Shell><Onboarding db={db} update={update} /></Shell>;
  }

  const tabs = [
    { id: "command", label: "Command", icon: Command },
    { id: "today", label: "Today", icon: CheckSquare },
    { id: "coach", label: "Coach", icon: MessageSquare },
    { id: "insight", label: "Insight", icon: BarChart3 },
    { id: "growth", label: "Growth", icon: Sprout },
    { id: "legacy", label: "Legacy", icon: Hourglass },
    { id: "settings", label: "Settings", icon: Cog },
  ];

  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:pt-10">
        {tab === "command" && <Command_ db={db} update={update} setTab={setTab} />}
        {tab === "today" && <Today db={db} update={update} />}
        {tab === "coach" && <Coach db={db} update={update} />}
        {tab === "insight" && <Insight db={db} update={update} />}
        {tab === "growth" && <Growth db={db} update={update} />}
        {tab === "legacy" && <Legacy db={db} />}
        {tab === "settings" && <SettingsView db={db} update={update} persist={persist} />}
      </div>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.08] bg-[#f4f1ea]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-stretch justify-between px-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="group flex flex-1 flex-col items-center gap-1 py-2.5 transition">
                <Icon size={19} className={active ? "text-[#cda349]" : "text-stone-600 group-hover:text-[#3a342b]"} />
                <span className={`text-[10px] tracking-wide ${active ? "text-[#cda349]" : "text-stone-500 group-hover:text-stone-600"}`}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </Shell>
  );
}

/* ---------- Shell + global styles ---------- */
function Shell({ children }) {
  return (
    <div className="min-h-screen w-full bg-[#f4f1ea] text-[#2b2620] antialiased"
      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Sora:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display{font-family:'Fraunces',Georgia,serif;}
        .font-mono{font-family:'IBM Plex Mono',monospace;}
        ::-webkit-scrollbar{width:8px;height:8px;}
        ::-webkit-scrollbar-thumb{background:#d8d2c4;border-radius:8px;}
        .glass{background:#ffffff;border:1px solid rgba(0,0,0,0.08);box-shadow:0 1px 2px rgba(0,0,0,0.04),0 10px 28px -14px rgba(0,0,0,0.14);}
        @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .rise{animation:rise .5s cubic-bezier(.2,.7,.2,1) both;}
      `}</style>
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(1100px 500px at 80% -10%, rgba(205,163,73,0.07), transparent 60%), radial-gradient(900px 500px at -10% 100%, rgba(205,163,73,0.04), transparent 55%)" }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ---------- Small UI primitives ---------- */
const Card = ({ children, className = "" }) => (
  <div className={`glass rounded-2xl ${className}`}>{children}</div>
);
const Label = ({ children }) => (
  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-600">{children}</p>
);
const Gold = ({ children, className = "" }) => (
  <span className={`text-[#cda349] ${className}`}>{children}</span>
);
function Btn({ children, onClick, variant = "solid", className = "", disabled }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-40";
  const styles = {
    solid: "bg-[#cda349] text-black hover:bg-[#dab861]",
    ghost: "border border-black/[0.12] text-[#2b2620] hover:bg-black/[0.04]",
    dark: "bg-black/[0.05] text-[#2b2620] hover:bg-black/[0.06] border border-black/[0.08]",
  };
  return <button disabled={disabled} onClick={onClick} className={`${base} ${styles[variant]} ${className}`}>{children}</button>;
}
function Ring({ value, size = 150, label }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  const col = value >= 80 ? "#cda349" : value >= 55 ? "#c9a24a" : value >= 30 ? "#d98c5f" : "#c95f5f";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(0,0,0,0.10)" strokeWidth="8" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={col} strokeWidth="8" fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.7,.2,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-semibold text-[#14110b]">{value}</span>
        {label && <span className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-stone-600">{label}</span>}
      </div>
    </div>
  );
}
function TagInput({ items, onChange, placeholder }) {
  const [v, setV] = useState("");
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 rounded-lg border border-black/[0.12] bg-black/[0.035] px-2.5 py-1 text-sm">
            {it}
            <button onClick={() => onChange(items.filter((_, j) => j !== i))}><X size={13} className="text-stone-600 hover:text-[#14110b]" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={v} onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) { onChange([...items, v.trim()]); setV(""); } }}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-black/[0.12] bg-black/[0.02] px-3 py-2 text-sm outline-none focus:border-[#cda349]/50" />
        <Btn variant="dark" onClick={() => { if (v.trim()) { onChange([...items, v.trim()]); setV(""); } }}><Plus size={16} /></Btn>
      </div>
    </div>
  );
}

/* ============================================================================
   ONBOARDING
   ========================================================================== */
function Onboarding({ db, update }) {
  const [step, setStep] = useState(0);
  const [p, setP] = useState(db.profile);
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));

  const steps = [
    {
      title: "Who are you becoming?",
      sub: "This is not a habit tracker. It is the system that closes the gap between who you say you want to be and what your actions show.",
      body: (
        <div className="space-y-4">
          <div>
            <Label>Your name</Label>
            <input value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="First name"
              className="w-full rounded-xl border border-black/[0.12] bg-black/[0.02] px-3 py-2.5 outline-none focus:border-[#cda349]/50" />
          </div>
          <div>
            <Label>Future Vision — who do you want to become in 3–5 years?</Label>
            <textarea value={p.vision} onChange={(e) => set("vision", e.target.value)} rows={4}
              placeholder="Describe the person you are building. Be specific and honest."
              className="w-full resize-none rounded-xl border border-black/[0.12] bg-black/[0.02] px-3 py-2.5 outline-none focus:border-[#cda349]/50" />
          </div>
        </div>
      ),
    },
    {
      title: "The goals beneath the vision",
      sub: "Vision is direction. These are the coordinates.",
      body: (
        <div className="space-y-4">
          <Field label="Business / Career goals" v={p.goalsBusiness} on={(x) => set("goalsBusiness", x)} ph="Income target, business milestones, career moves…" />
          <Field label="Fitness goals" v={p.goalsFitness} on={(x) => set("goalsFitness", x)} ph="Weight, physique, performance…" />
          <Field label="Financial goals" v={p.goalsFinancial} on={(x) => set("goalsFinancial", x)} ph="Income, savings, investments…" />
        </div>
      ),
    },
    {
      title: "Your standards",
      sub: "Standards are the floor you refuse to drop below — even on your worst day.",
      body: <TagInput items={p.standards} onChange={(x) => set("standards", x)} placeholder="e.g. I train regardless of mood" />,
    },
    {
      title: "Your values",
      sub: "The principles you'll be measured against.",
      body: <TagInput items={p.values} onChange={(x) => set("values", x)} placeholder="e.g. Discipline" />,
    },
    {
      title: "Your mission & non-negotiables",
      sub: "One mission. A few things that happen no matter what.",
      body: (
        <div className="space-y-4">
          <Field label="Current mission" v={p.mission} on={(x) => set("mission", x)} ph="e.g. Build a successful agency and an elite body" />
          <div>
            <Label>Daily non-negotiables</Label>
            <TagInput items={p.nonNegotiables} onChange={(x) => set("nonNegotiables", x)} placeholder="e.g. Train" />
          </div>
          <div>
            <Label>Birth year (for your Legacy clock)</Label>
            <input type="number" value={p.birthYear} onChange={(e) => set("birthYear", Number(e.target.value))}
              className="w-40 rounded-xl border border-black/[0.12] bg-black/[0.02] px-3 py-2.5 outline-none focus:border-[#cda349]/50 font-mono" />
          </div>
        </div>
      ),
    },
  ];

  const cur = steps[step];
  const finish = () => update((d) => { d.profile = p; d.meta.onboarded = true; d.meta.created = dkey(); d.profile.startDate = dkey(); return d; });

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-12">
      <div className="mb-8 rise">
        <p className="mb-3 text-[11px] uppercase tracking-[0.4em] text-[#cda349]">The 1% Operating System</p>
        <h1 className="font-display text-4xl font-semibold leading-tight text-[#14110b] md:text-5xl">{cur.title}</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone-600">{cur.sub}</p>
      </div>
      <Card className="rise p-6">{cur.body}</Card>
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 w-8 rounded-full transition ${i <= step ? "bg-[#cda349]" : "bg-black/[0.06]"}`} />
          ))}
        </div>
        <div className="flex gap-2">
          {step > 0 && <Btn variant="ghost" onClick={() => setStep(step - 1)}>Back</Btn>}
          {step < steps.length - 1
            ? <Btn onClick={() => setStep(step + 1)}>Continue <ArrowRight size={16} /></Btn>
            : <Btn onClick={finish}>Enter the system <ArrowRight size={16} /></Btn>}
        </div>
      </div>
    </div>
  );
}
const Field = ({ label, v, on, ph }) => (
  <div>
    <Label>{label}</Label>
    <textarea value={v} onChange={(e) => on(e.target.value)} rows={2} placeholder={ph}
      className="w-full resize-none rounded-xl border border-black/[0.12] bg-black/[0.02] px-3 py-2.5 text-sm outline-none focus:border-[#cda349]/50" />
  </div>
);

/* ============================================================================
   COMMAND  (Mission Control)
   ========================================================================== */
function Command_({ db, update, setTab }) {
  const today = dkey();
  const score = disciplineScore(db, today);
  const drift = useMemo(() => detectDrift(db), [db]);
  const flags = useMemo(() => redFlags(db), [db]);
  const plan = db.aiPlans[today] || [];
  const [loadingPlan, setLoadingPlan] = useState(false);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "This morning" : hour < 18 ? "This afternoon" : "Tonight";
  const aligned = score >= 60;

  const genPlan = async () => {
    setLoadingPlan(true);
    const weak = habitConsistency(db).sort((a, b) => a.rate - b.rate).slice(0, 3).map((x) => x.habit.name);
    const sys = `You generate a daily action plan as the user's future self. Return ONLY a JSON array of exactly 5 short imperative tasks (strings, max ~8 words each) that move the user toward their vision. No commentary, no markdown.`;
    const txt = await callClaude(sys,
      `${profileContext(db)}\n${behaviourContext(db)}\nWeakest areas lately: ${weak.join(", ")}.\nGenerate today's 5 highest-leverage actions.`, 400);
    let tasks = parseJSON(txt);
    if (!Array.isArray(tasks)) {
      tasks = ["Train with full intent", "90 minutes of deep business work", "Contact 5 prospects", "Read 20 minutes", "Sleep before your target time"];
    }
    update((d) => { d.aiPlans[today] = tasks.slice(0, 5).map((t) => ({ text: String(t), done: false })); return d; });
    setLoadingPlan(false);
  };

  return (
    <div className="space-y-5">
      <header className="rise">
        <p className="text-[11px] uppercase tracking-[0.3em] text-stone-600">Command Centre</p>
        <h1 className="font-display text-3xl font-semibold text-[#14110b] md:text-4xl">
          {greet}, {db.profile.name || "operator"}.
        </h1>
      </header>

      {/* Mission */}
      <Card className="rise overflow-hidden p-6" >
        <Label>Current Mission</Label>
        <p className="font-display text-2xl font-medium leading-snug text-[#14110b]">
          {db.profile.mission || "Set your mission in Settings."}
        </p>
        <p className={`mt-3 text-sm ${aligned ? "text-[#cda349]" : "text-[#d98c5f]"}`}>
          {Object.keys(db.logs).length === 0
            ? "The system is listening. Your first day of evidence starts now."
            : aligned
              ? "Today's actions moved you closer to your mission."
              : "Today's actions are moving you further from your mission."}
        </p>
      </Card>

      {/* Score + plan */}
      <div className="grid gap-5 md:grid-cols-[auto,1fr]">
        <Card className="flex flex-col items-center justify-center p-6 rise">
          <Ring value={score} label="Discipline" />
          <p className="mt-3 text-center text-xs text-stone-600">
            {db.habits.filter((h) => db.logs[today]?.done?.[h.id]).length}/{db.habits.length} habits · weighted
          </p>
        </Card>

        <Card className="p-5 rise">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><Sparkles size={16} className="text-[#cda349]" /><span className="text-sm font-medium">Future Self Daily Plan</span></div>
            <Btn variant="dark" onClick={genPlan} disabled={loadingPlan} className="!py-1.5 !px-3 text-xs">
              {loadingPlan ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {plan.length ? "Regenerate" : "Generate"}
            </Btn>
          </div>
          {plan.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-600">Generate today's 5 highest-leverage actions, chosen by your future self.</p>
          ) : (
            <ul className="space-y-1.5">
              {plan.map((t, i) => (
                <li key={i}>
                  <button onClick={() => update((d) => { d.aiPlans[today][i].done = !d.aiPlans[today][i].done; return d; })}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-black/[0.04]">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${t.done ? "border-[#cda349] bg-[#cda349]" : "border-black/25"}`}>
                      {t.done && <Check size={13} className="text-black" />}
                    </span>
                    <span className={t.done ? "text-stone-600 line-through" : "text-[#2b2620]"}>{t.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Drift alert */}
      {drift.level > 0 && <DriftCard drift={drift} db={db} onComeback={() => setTab("growth")} />}

      {/* Red flags */}
      {flags.length > 0 && (
        <div className="space-y-3 rise">
          {flags.map((f, i) => <RedFlagCard key={i} flag={f} db={db} />)}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 rise md:grid-cols-4">
        <QuickLink icon={CheckSquare} label="Run today" onClick={() => setTab("today")} />
        <QuickLink icon={MessageSquare} label="Talk to future self" onClick={() => setTab("coach")} />
        <QuickLink icon={Sprout} label="Today's lesson" onClick={() => setTab("growth")} />
        <QuickLink icon={BarChart3} label="See the data" onClick={() => setTab("insight")} />
      </div>
    </div>
  );
}
const QuickLink = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick} className="glass flex items-center gap-3 rounded-xl p-4 text-left transition hover:border-[#cda349]/30">
    <Icon size={18} className="text-[#cda349]" />
    <span className="text-sm">{label}</span>
  </button>
);

function DriftCard({ drift, db, onComeback }) {
  const colors = { 1: "#c9a24a", 2: "#d98c5f", 3: "#c95f5f" };
  const c = colors[drift.level];
  return (
    <Card className="rise p-5" >
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} style={{ color: c }} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: c }}>Drift Detection · Level {drift.level}</span>
          </div>
          <p className="mt-1 font-display text-xl text-[#14110b]">{drift.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-stone-600">{drift.body}</p>
          {drift.level >= 3 && (
            <div className="mt-3">
              <Btn onClick={onComeback}>Start Comeback <ArrowRight size={15} /></Btn>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
function RedFlagCard({ flag, db }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const getInsight = async () => {
    setLoading(true);
    const txt = await callClaude(COACH_SYSTEM,
      `${profileContext(db)}\nThe user has missed "${flag.habit.name}" ${flag.missed} times this week — a critical habit. Give one short corrective insight (2 sentences max) as their future self. No fluff.`, 200);
    setInsight(txt || "This is a load-bearing habit. Reinstate it today before it becomes your new baseline.");
    setLoading(false);
  };
  return (
    <Card className="border-l-2 p-4" >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-[#c95f5f]">⚠</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#14110b]">{flag.msg}</p>
          {insight ? (
            <p className="mt-1.5 text-sm text-stone-600">{insight}</p>
          ) : (
            <button onClick={getInsight} className="mt-1.5 text-xs text-[#cda349] hover:underline">
              {loading ? "Thinking…" : "Get corrective insight"}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ============================================================================
   TODAY
   ========================================================================== */
function Today({ db, update }) {
  const today = dkey();
  const log = db.logs[today] || {};
  const score = disciplineScore(db, today);
  const completed = db.habits.filter((h) => log.done?.[h.id]).length;
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);

  const toggle = (id) => update((d) => {
    d.logs[today] = d.logs[today] || { done: {} };
    d.logs[today].done = d.logs[today].done || {};
    d.logs[today].done[id] = !d.logs[today].done[id];
    return d;
  });
  const move = (idx, dir) => update((d) => {
    const a = d.habits; const j = idx + dir;
    if (j < 0 || j >= a.length) return d;
    [a[idx], a[j]] = [a[j], a[idx]]; return d;
  });
  const remove = (id) => update((d) => { d.habits = d.habits.filter((h) => h.id !== id); return d; });

  const grouped = CATEGORIES.map((c) => ({ cat: c, items: db.habits.filter((h) => h.category === c) })).filter((g) => g.items.length);

  return (
    <div className="space-y-5">
      <header className="rise flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-stone-600">{weekdayShort(new Date())} · {today}</p>
          <h1 className="font-display text-3xl font-semibold text-[#14110b]">Today's Execution</h1>
        </div>
      </header>

      <Card className="rise grid grid-cols-3 divide-x divide-black/[0.08] p-5">
        <Stat label="Completed" value={`${completed}/${db.habits.length}`} />
        <Stat label="Completion" value={`${db.habits.length ? Math.round((completed / db.habits.length) * 100) : 0}%`} />
        <Stat label="Discipline" value={`${score}`} accent />
      </Card>

      {grouped.map((g) => (
        <div key={g.cat} className="rise">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className="h-2 w-2 rounded-full" style={{ background: CAT_COLOR[g.cat] }} />
            <Label>{g.cat}</Label>
          </div>
          <Card className="divide-y divide-black/[0.07]">
            {g.items.map((h) => {
              const idx = db.habits.findIndex((x) => x.id === h.id);
              const done = !!log.done?.[h.id];
              return (
                <div key={h.id} className="group flex items-center gap-3 px-4 py-3">
                  <button onClick={() => toggle(h.id)}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${done ? "border-[#cda349] bg-[#cda349]" : "border-black/25 hover:border-[#cda349]/60"}`}>
                    {done && <Check size={15} className="text-black" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`truncate text-sm ${done ? "text-stone-600 line-through" : "text-[#14110b]"}`}>{h.name}</p>
                    {h.note && <p className="truncate text-xs text-stone-500">{h.note}</p>}
                  </div>
                  <span className="font-mono text-xs text-stone-500">{h.points}pt</span>
                  {h.priority === "critical" && <span className="rounded bg-[#c95f5f]/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[#d98c5f]">core</span>}
                  <div className="flex items-center opacity-0 transition group-hover:opacity-100">
                    <button onClick={() => move(idx, -1)} className="p-1 text-stone-500 hover:text-[#14110b]"><ChevronUp size={15} /></button>
                    <button onClick={() => move(idx, 1)} className="p-1 text-stone-500 hover:text-[#14110b]"><ChevronDown size={15} /></button>
                    <button onClick={() => setEditId(h.id)} className="p-1 text-stone-500 hover:text-[#14110b]"><Pencil size={14} /></button>
                    <button onClick={() => remove(h.id)} className="p-1 text-stone-500 hover:text-[#c95f5f]"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      ))}

      <Btn variant="dark" onClick={() => setAdding(true)} className="w-full"><Plus size={16} /> Add habit / task</Btn>

      {(adding || editId) && (
        <HabitEditor db={db} update={update} editId={editId}
          onClose={() => { setAdding(false); setEditId(null); }} />
      )}

      <IdentityScore db={db} update={update} />
      <CourseCorrection db={db} update={update} />
    </div>
  );
}
const Stat = ({ label, value, accent }) => (
  <div className="flex flex-col items-center px-2">
    <span className={`font-display text-2xl font-semibold ${accent ? "text-[#cda349]" : "text-[#14110b]"}`}>{value}</span>
    <span className="mt-1 text-[10px] uppercase tracking-[0.18em] text-stone-600">{label}</span>
  </div>
);

function HabitEditor({ db, update, editId, onClose }) {
  const existing = editId ? db.habits.find((h) => h.id === editId) : null;
  const [f, setF] = useState(existing || { name: "", category: "Body", points: 10, priority: "medium", note: "" });
  const save = () => {
    if (!f.name.trim()) return;
    update((d) => {
      if (editId) d.habits = d.habits.map((h) => (h.id === editId ? { ...f } : h));
      else d.habits.push({ ...f, id: "h" + Date.now() });
      return d;
    });
    onClose();
  };
  return (
    <Modal onClose={onClose} title={editId ? "Edit habit" : "New habit"}>
      <div className="space-y-3">
        <input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Habit name"
          className="w-full rounded-xl border border-black/[0.12] bg-black/[0.02] px-3 py-2.5 outline-none focus:border-[#cda349]/50" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Category</Label>
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}
              className="w-full rounded-xl border border-black/[0.12] bg-[#ffffff] px-3 py-2.5 outline-none">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label>Priority</Label>
            <select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}
              className="w-full rounded-xl border border-black/[0.12] bg-[#ffffff] px-3 py-2.5 outline-none">
              {["critical", "high", "medium", "low"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <Label>Weight (points): {f.points}</Label>
          <input type="range" min="1" max="25" value={f.points} onChange={(e) => setF({ ...f, points: Number(e.target.value) })} className="w-full accent-[#cda349]" />
        </div>
        <input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Note (optional)"
          className="w-full rounded-xl border border-black/[0.12] bg-black/[0.02] px-3 py-2 text-sm outline-none focus:border-[#cda349]/50" />
        <Btn onClick={save} className="w-full">Save</Btn>
      </div>
    </Modal>
  );
}

function IdentityScore({ db, update }) {
  const today = dkey();
  const dims = ["discipline", "focus", "courage", "consistency", "leadership"];
  const id = db.logs[today]?.identity || {};
  const set = (k, v) => update((d) => {
    d.logs[today] = d.logs[today] || { done: {} };
    d.logs[today].identity = { ...(d.logs[today].identity || {}), [k]: v };
    return d;
  });
  const filled = dims.filter((k) => id[k]).length;
  const total = filled ? Math.round((dims.reduce((a, k) => a + (id[k] || 0), 0) / (filled * 10)) * 100) : 0;
  return (
    <Card className="rise p-5">
      <div className="mb-1 flex items-center justify-between">
        <Label>Identity Score · "Did I act like who I'm becoming?"</Label>
        <span className="font-display text-2xl font-semibold text-[#cda349]">{total}</span>
      </div>
      <div className="mt-3 space-y-3">
        {dims.map((k) => (
          <div key={k} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs capitalize text-stone-600">{k}</span>
            <input type="range" min="0" max="10" value={id[k] || 0} onChange={(e) => set(k, Number(e.target.value))} className="flex-1 accent-[#cda349]" />
            <span className="w-6 text-right font-mono text-xs text-[#3a342b]">{id[k] || 0}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CourseCorrection({ db, update }) {
  const today = dkey();
  const [input, setInput] = useState(db.logs[today]?.holdingBack || "");
  const [out, setOut] = useState(db.logs[today]?.correction || null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const sys = `You are a precise performance coach. The user states what's holding them back. Return ONLY JSON: {"problem":"...","cause":"...","solution":"...","action":"..."}. Keep each field to one tight sentence. "action" is one immediate thing they can do tonight.`;
    const txt = await callClaude(sys, `${profileContext(db)}\nWhat's holding them back: "${input}"`, 400);
    const j = parseJSON(txt) || { problem: input, cause: "Friction or avoidance has crept in.", solution: "Shrink the task until it's impossible to refuse.", action: "Do the smallest version right now." };
    setOut(j);
    update((d) => { d.logs[today] = d.logs[today] || { done: {} }; d.logs[today].holdingBack = input; d.logs[today].correction = j; return d; });
    setLoading(false);
  };
  return (
    <Card className="rise p-5">
      <Label>Course Correction · Evening Reflection</Label>
      <p className="mb-3 text-sm text-[#3a342b]">What is currently holding you back?</p>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2}
        placeholder="Be honest. Name it."
        className="w-full resize-none rounded-xl border border-black/[0.12] bg-black/[0.02] px-3 py-2.5 text-sm outline-none focus:border-[#cda349]/50" />
      <Btn variant="dark" onClick={run} disabled={loading} className="mt-3">
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Diagnose
      </Btn>
      {out && (
        <div className="mt-4 space-y-2.5 border-t border-black/[0.08] pt-4">
          <Diag label="Problem" v={out.problem} />
          <Diag label="Likely cause" v={out.cause} />
          <Diag label="Tomorrow's solution" v={out.solution} />
          <Diag label="One immediate action" v={out.action} accent />
        </div>
      )}
    </Card>
  );
}
const Diag = ({ label, v, accent }) => (
  <div>
    <p className="text-[10px] uppercase tracking-[0.18em] text-stone-600">{label}</p>
    <p className={`text-sm ${accent ? "text-[#cda349]" : "text-[#2b2620]"}`}>{v}</p>
  </div>
);

/* ============================================================================
   COACH
   ========================================================================== */
function Coach({ db, update }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const chat = db.chat;
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    update((d) => { d.chat.push({ role: "user", content: msg }); return d; });
    setLoading(true);
    const history = [...chat, { role: "user", content: msg }].slice(-10)
      .map((m) => `${m.role === "user" ? "PAST SELF" : "YOU (future self)"}: ${m.content}`).join("\n");
    const reply = await callClaude(COACH_SYSTEM,
      `${profileContext(db)}\n${behaviourContext(db)}\n\nConversation:\n${history}\n\nRespond as their future self.`, 500);
    update((d) => { d.chat.push({ role: "assistant", content: reply || "Say that again — clearly this time." }); return d; });
    setLoading(false);
  };

  const starters = ["I don't feel like training today.", "Am I actually on track?", "Talk me out of quitting.", "What should I focus on this week?"];

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <header className="rise mb-3">
        <p className="text-[11px] uppercase tracking-[0.3em] text-stone-600">Future Self Coach</p>
        <h1 className="font-display text-3xl font-semibold text-[#14110b]">The version of you that made it.</h1>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl">
        {chat.length === 0 && (
          <Card className="p-6 text-center">
            <p className="font-display text-lg text-[#14110b]">I'm you — a few years ahead.</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
              I remember exactly where you are. Ask me anything. I won't flatter you, and I won't lie to you.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {starters.map((s) => (
                <button key={s} onClick={() => setInput(s)}
                  className="rounded-full border border-black/[0.12] px-3 py-1.5 text-xs text-[#3a342b] hover:border-[#cda349]/40 hover:text-[#14110b]">
                  {s}
                </button>
              ))}
            </div>
          </Card>
        )}
        {chat.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === "user" ? "bg-[#cda349] text-black" : "glass text-[#2b2620]"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="glass rounded-2xl px-4 py-3"><Loader2 size={16} className="animate-spin text-[#cda349]" /></div></div>}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex items-end gap-2">
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={1} placeholder="Speak to your future self…"
          className="flex-1 resize-none rounded-xl border border-black/[0.12] bg-black/[0.035] px-4 py-3 text-sm outline-none focus:border-[#cda349]/50" />
        <Btn onClick={send} disabled={loading} className="!p-3"><Send size={18} /></Btn>
      </div>
    </div>
  );
}

/* ============================================================================
   INSIGHT  (Dashboard + Analytics)
   ========================================================================== */
function Insight({ db, update }) {
  const trend = last(db, 14).map((k) => ({ d: weekdayShort(fromKey(k)), score: disciplineScore(db, k) }));
  const periods = [
    { label: "Daily", v: disciplineScore(db, dkey()) },
    { label: "Weekly", v: avgScore(db, last(db, 7)) },
    { label: "Monthly", v: avgScore(db, last(db, 30)) },
    { label: "Yearly", v: avgScore(db, last(db, 365)) },
  ];
  const consistency = habitConsistency(db);
  const best = [...consistency].sort((a, b) => b.rate - a.rate)[0];
  const worst = [...consistency].sort((a, b) => a.rate - b.rate)[0];

  return (
    <div className="space-y-5">
      <header className="rise">
        <p className="text-[11px] uppercase tracking-[0.3em] text-stone-600">Performance Dashboard</p>
        <h1 className="font-display text-3xl font-semibold text-[#14110b]">The Data Doesn't Argue.</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 rise md:grid-cols-4">
        {periods.map((p) => (
          <Card key={p.label} className="p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-stone-600">{p.label}</p>
            <p className="font-display text-3xl font-semibold text-[#14110b]">{p.v}</p>
          </Card>
        ))}
      </div>

      <Card className="rise p-5">
        <Label>Discipline — last 14 days</Label>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ left: -20, right: 6, top: 6 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#cda349" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#cda349" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(0,0,0,0.07)" vertical={false} />
              <XAxis dataKey="d" tick={{ fill: "#78716c", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#78716c", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12, color: "#14110b" }} />
              <Area type="monotone" dataKey="score" stroke="#cda349" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Life areas */}
      <div className="grid gap-3 rise md:grid-cols-2">
        {CATEGORIES.map((c) => {
          const s = categoryScore(db, dkey(), c);
          const week = avgScore7Cat(db, c);
          return (
            <Card key={c} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CAT_COLOR[c] }} />
                  <span className="text-sm font-medium text-[#14110b]">{c}</span>
                </div>
                <span className="font-display text-2xl font-semibold" style={{ color: CAT_COLOR[c] }}>{s ?? "—"}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[0.04]">
                <div className="h-full rounded-full" style={{ width: `${s || 0}%`, background: CAT_COLOR[c] }} />
              </div>
              <p className="mt-2 text-xs text-stone-600">7-day average: {week}</p>
            </Card>
          );
        })}
      </div>

      {/* Heatmap */}
      <Card className="rise p-5">
        <Label>Consistency Heatmap · last 16 weeks</Label>
        <Heatmap db={db} />
      </Card>

      {/* Habit consistency */}
      <Card className="rise p-5">
        <Label>Habit Consistency · 30 days</Label>
        <div className="space-y-2.5">
          {consistency.map((c) => (
            <div key={c.habit.id} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-xs text-[#3a342b]">{c.habit.name}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.04]">
                <div className="h-full rounded-full bg-[#cda349]" style={{ width: `${c.rate}%` }} />
              </div>
              <span className="w-10 text-right font-mono text-xs text-stone-600">{c.rate}%</span>
            </div>
          ))}
        </div>
        {best && (
          <div className="mt-4 flex gap-4 border-t border-black/[0.08] pt-4 text-xs">
            <span className="text-stone-600">Most consistent: <Gold>{best.habit.name}</Gold></span>
            <span className="text-stone-600">Most missed: <span className="text-[#d98c5f]">{worst.habit.name}</span></span>
          </div>
        )}
      </Card>

      <CEODashboard db={db} update={update} />
      <MonthlyReport db={db} />
    </div>
  );
}
function avgScore7Cat(db, cat) {
  const vals = last(db, 7).map((k) => categoryScore(db, k, cat)).filter((v) => v !== null);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
}
function Heatmap({ db }) {
  const weeks = 16;
  const cells = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const col = [];
    for (let d = 6; d >= 0; d--) {
      const date = addDays(new Date(), -(w * 7 + d));
      const k = dkey(date);
      const has = !!db.logs[k];
      const s = disciplineScore(db, k);
      col.push({ k, s, has });
    }
    cells.push(col);
  }
  const color = (c) => {
    if (!c.has) return "rgba(0,0,0,0.07)";
    if (c.s >= 80) return "#cda349";
    if (c.s >= 55) return "rgba(205,163,73,0.6)";
    if (c.s >= 30) return "rgba(217,140,95,0.5)";
    return "rgba(201,95,95,0.4)";
  };
  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {cells.map((col, i) => (
        <div key={i} className="flex flex-col gap-1">
          {col.map((c) => (
            <div key={c.k} title={`${c.k}: ${c.has ? c.s : "no data"}`}
              className="h-3.5 w-3.5 rounded-sm" style={{ background: color(c) }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function CEODashboard({ db, update }) {
  const today = dkey();
  const fields = [
    ["prospects", "Prospects contacted"], ["calls", "Sales calls"], ["meetings", "Meetings"],
    ["websites", "Websites built"], ["clients", "New clients"], ["projects", "Projects completed"], ["revenue", "Revenue ($)"],
  ];
  const data = db.ceo[today] || {};
  const set = (k, v) => update((d) => { d.ceo[today] = { ...(d.ceo[today] || {}), [k]: Number(v) || 0 }; return d; });
  const monthTotal = (k) => last(db, 30).reduce((a, day) => a + (db.ceo[day]?.[k] || 0), 0);
  return (
    <Card className="rise p-5">
      <Label>CEO Dashboard · Business Metrics (today)</Label>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {fields.map(([k, lbl]) => (
          <div key={k} className="rounded-xl border border-black/[0.08] bg-black/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-wide text-stone-600">{lbl}</p>
            <input type="number" value={data[k] || ""} onChange={(e) => set(k, e.target.value)} placeholder="0"
              className="mt-1 w-full bg-transparent font-display text-2xl font-semibold text-[#14110b] outline-none" />
            <p className="text-[10px] text-stone-500">30d: {monthTotal(k).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MonthlyReport({ db }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const gen = async () => {
    setLoading(true);
    const cons = habitConsistency(db);
    const best = [...cons].sort((a, b) => b.rate - a.rate)[0];
    const worst = [...cons].sort((a, b) => a.rate - b.rate)[0];
    const areas = CATEGORIES.map((c) => `${c}: ${avgScore7Cat(db, c)}`).join(", ");
    const sys = `You are the user's future self writing a monthly performance summary. 3-4 sentences. Calm, direct, honest. No fake positivity, no insults.`;
    const txt = await callClaude(sys,
      `${profileContext(db)}\nMonthly discipline avg: ${avgScore(db, last(db, 30))}. Best habit: ${best?.habit.name} (${best?.rate}%). Worst: ${worst?.habit.name} (${worst?.rate}%). Area scores: ${areas}.`, 350);
    setReport({ text: txt, best, worst, score: avgScore(db, last(db, 30)) });
    setLoading(false);
  };
  return (
    <Card className="rise p-5">
      <div className="flex items-center justify-between">
        <Label>Monthly Performance Report</Label>
        <Btn variant="dark" onClick={gen} disabled={loading} className="!py-1.5 !px-3 text-xs">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Generate
        </Btn>
      </div>
      {report ? (
        <div className="mt-2 space-y-3">
          <div className="flex gap-6">
            <Stat label="Month score" value={report.score} accent />
            <div><p className="text-[10px] uppercase tracking-wide text-stone-600">Strongest</p><p className="text-sm text-[#cda349]">{report.best?.habit.name}</p></div>
            <div><p className="text-[10px] uppercase tracking-wide text-stone-600">Weakest</p><p className="text-sm text-[#d98c5f]">{report.worst?.habit.name}</p></div>
          </div>
          <p className="text-sm leading-relaxed text-[#3a342b]">{report.text}</p>
        </div>
      ) : <p className="mt-2 text-sm text-stone-600">Generate an AI summary of your month.</p>}
    </Card>
  );
}

/* ============================================================================
   GROWTH  (Wisdom Vault, Reality Mirror, Comeback, Letters)
   ========================================================================== */
function Growth({ db, update }) {
  const [sub, setSub] = useState("wisdom");
  const subs = [["wisdom", "Wisdom Vault"], ["mirror", "Reality Mirror"], ["comeback", "Comeback"], ["letters", "Future Letters"]];
  return (
    <div className="space-y-5">
      <header className="rise">
        <p className="text-[11px] uppercase tracking-[0.3em] text-stone-600">Growth Systems</p>
        <h1 className="font-display text-3xl font-semibold text-[#14110b]">Sharpen the Operator.</h1>
      </header>
      <div className="flex flex-wrap gap-2 rise">
        {subs.map(([id, lbl]) => (
          <button key={id} onClick={() => setSub(id)}
            className={`rounded-full border px-3.5 py-1.5 text-xs transition ${sub === id ? "border-[#cda349] bg-[#cda349]/10 text-[#cda349]" : "border-black/[0.12] text-stone-600 hover:text-[#14110b]"}`}>
            {lbl}
          </button>
        ))}
      </div>
      {sub === "wisdom" && <WisdomVault db={db} update={update} />}
      {sub === "mirror" && <RealityMirror db={db} update={update} />}
      {sub === "comeback" && <Comeback db={db} update={update} />}
      {sub === "letters" && <Letters db={db} update={update} />}
    </div>
  );
}

function WisdomVault({ db, update }) {
  const today = dkey();
  const lesson = db.lessons[today];
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const gen = async () => {
    setLoading(true);
    const sys = `You curate timeless wisdom (discipline, leadership, stoicism, strategy, business, psychology). Return ONLY JSON: {"quote":"...","author":"...","lesson":"...","application":"...","action":"..."}. The quote must be real and correctly attributed and under 15 words. "lesson" = 1-2 sentences. "application" = how it applies to THIS user's goals. "action" = one concrete thing to do today.`;
    const txt = await callClaude(sys, `${profileContext(db)}\nGenerate today's lesson tailored to this user.`, 450);
    const j = parseJSON(txt);
    if (j) update((d) => { d.lessons[today] = j; return d; });
    setLoading(false);
  };
  const saved = db.savedLessons;
  const filtered = query
    ? saved.filter((l) => JSON.stringify(l).toLowerCase().includes(query.toLowerCase()))
    : saved;
  const isSaved = lesson && saved.some((l) => l.quote === lesson.quote);

  return (
    <div className="space-y-4">
      <Card className="rise p-6">
        <div className="mb-3 flex items-center justify-between">
          <Label>Today's Lesson</Label>
          {!lesson && <Btn variant="dark" onClick={gen} disabled={loading} className="!py-1.5 !px-3 text-xs">{loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Generate</Btn>}
        </div>
        {lesson ? (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Quote size={22} className="shrink-0 text-[#cda349]/60" />
              <div>
                <p className="font-display text-xl italic leading-snug text-[#14110b]">{lesson.quote}</p>
                {lesson.author && <p className="mt-1 text-xs text-stone-600">— {lesson.author}</p>}
              </div>
            </div>
            <Sec label="Lesson" v={lesson.lesson} />
            <Sec label="How it applies to your goals" v={lesson.application} />
            <Sec label="Action for today" v={lesson.action} accent />
            <div className="flex gap-2 pt-1">
              <Btn variant="dark" className="!py-1.5 text-xs" onClick={() => update((d) => {
                if (!d.savedLessons.some((l) => l.quote === lesson.quote)) d.savedLessons.unshift({ ...lesson, date: today });
                return d;
              })} disabled={isSaved}>
                <Heart size={14} className={isSaved ? "fill-[#cda349] text-[#cda349]" : ""} /> {isSaved ? "Saved" : "Save"}
              </Btn>
              <Btn variant="ghost" className="!py-1.5 text-xs" onClick={gen} disabled={loading}>New lesson</Btn>
            </div>
          </div>
        ) : <p className="text-sm text-stone-600">Generate a lesson tailored to who you're becoming.</p>}
      </Card>

      <Card className="rise p-5">
        <Label>Saved Lessons ({saved.length})</Label>
        {saved.length > 0 && (
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your vault…"
            className="mb-3 w-full rounded-xl border border-black/[0.12] bg-black/[0.02] px-3 py-2 text-sm outline-none focus:border-[#cda349]/50" />
        )}
        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-sm text-stone-600">Your vault is empty. Save lessons worth returning to.</p>}
          {filtered.map((l, i) => (
            <details key={i} className="group rounded-xl border border-black/[0.08] bg-black/[0.02] p-3">
              <summary className="cursor-pointer list-none text-sm text-[#2b2620]">
                <span className="text-[#cda349]/70">“</span>{l.quote}<span className="text-[#cda349]/70">”</span>
              </summary>
              <div className="mt-2 space-y-1.5 text-xs text-stone-600">
                <p>{l.lesson}</p><p className="text-[#cda349]">{l.action}</p>
              </div>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}
const Sec = ({ label, v, accent }) => (
  <div>
    <p className="text-[10px] uppercase tracking-[0.18em] text-stone-600">{label}</p>
    <p className={`mt-0.5 text-sm leading-relaxed ${accent ? "text-[#cda349]" : "text-[#3a342b]"}`}>{v}</p>
  </div>
);

function RealityMirror({ db, update }) {
  const weekKeys = last(db, 7);
  const wk = weekKeys[0];
  const existing = db.weeklyMirror[wk];
  const [report, setReport] = useState(existing || null);
  const [loading, setLoading] = useState(false);

  const counts = db.habits.filter((h) => ["critical", "high"].includes(h.priority)).slice(0, 5).map((h) => ({
    name: h.name,
    hits: weekKeys.filter((k) => db.logs[k]?.done?.[h.id]).length,
  }));

  const gen = async () => {
    setLoading(true);
    const sys = `You are the user's future self delivering a brutally honest but respectful weekly verdict. 2-3 sentences. No fake positivity. No insults. Truth only. Contrast their stated ambitions with what their week actually showed.`;
    const txt = await callClaude(sys,
      `${profileContext(db)}\nThis week's key habit completions (out of 7): ${counts.map((c) => `${c.name} ${c.hits}/7`).join(", ")}. Weekly discipline avg: ${avgScore(db, weekKeys)}.`, 300);
    const r = { text: txt || "Your ambitions remain high. This week, your actions only partly supported them.", counts };
    setReport(r);
    update((d) => { d.weeklyMirror[wk] = r; return d; });
    setLoading(false);
  };

  return (
    <Card className="rise p-6">
      <div className="flex items-center justify-between">
        <Label>Reality Mirror · Weekly Verdict</Label>
        {!isSunday() && <span className="text-[10px] text-stone-500">Designed for Sundays</span>}
      </div>
      <div className="mt-3 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-stone-600">You said you wanted</p>
          <p className="mt-1 font-display text-lg text-[#14110b]">{db.profile.vision || db.profile.mission || "—"}</p>
        </div>
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-stone-600">This week you did</p>
          <div className="space-y-1.5">
            {counts.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span className="text-[#3a342b]">{c.name}</span>
                <span className="font-mono" style={{ color: c.hits >= 5 ? "#cda349" : c.hits >= 3 ? "#d98c5f" : "#c95f5f" }}>{c.hits} / 7</span>
              </div>
            ))}
          </div>
        </div>
        {report?.text && (
          <div className="border-t border-black/[0.08] pt-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-stone-600">AI Verdict</p>
            <p className="mt-1 text-sm leading-relaxed text-[#2b2620]">{report.text}</p>
          </div>
        )}
        <Btn onClick={gen} disabled={loading}>{loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Generate this week's verdict</Btn>
      </div>
    </Card>
  );
}

function Comeback({ db, update }) {
  const cb = db.comeback;
  const [loading, setLoading] = useState(false);
  const start = async () => {
    setLoading(true);
    const sys = `Return ONLY a JSON array of exactly 3 short non-negotiable comeback tasks (strings) to restore momentum fast. Simple, undeniable, today.`;
    const txt = await callClaude(sys, `${profileContext(db)}\n${behaviourContext(db)}\nThe user is in decline and needs to restore momentum. Give 3 non-negotiables for today.`, 250);
    let arr = parseJSON(txt);
    if (!Array.isArray(arr)) arr = ["Train — no negotiation", "Complete one meaningful business task", "Go to bed on time"];
    update((d) => { d.comeback = { date: dkey(), tasks: arr.slice(0, 3).map((t) => ({ text: String(t), done: false })) }; return d; });
    setLoading(false);
  };
  const done = cb?.tasks.filter((t) => t.done).length || 0;
  return (
    <Card className="rise p-6">
      <Label>Comeback Protocol</Label>
      <p className="mb-4 text-sm text-stone-600">When you've drifted, you don't need a new plan. You need momentum. Three things. Today.</p>
      {!cb ? (
        <Btn onClick={start} disabled={loading} className="w-full">{loading ? <Loader2 size={15} className="animate-spin" /> : <Flame size={16} />} Start Comeback</Btn>
      ) : (
        <div className="space-y-3">
          {cb.tasks.map((t, i) => (
            <button key={i} onClick={() => update((d) => { d.comeback.tasks[i].done = !d.comeback.tasks[i].done; return d; })}
              className="flex w-full items-center gap-3 rounded-xl border border-black/[0.08] bg-black/[0.02] px-4 py-3 text-left hover:bg-black/[0.03]">
              <span className={`flex h-6 w-6 items-center justify-center rounded-lg border ${t.done ? "border-[#cda349] bg-[#cda349]" : "border-black/25"}`}>
                {t.done && <Check size={15} className="text-black" />}
              </span>
              <span className={`text-sm ${t.done ? "text-stone-600 line-through" : "text-[#14110b]"}`}>{t.text}</span>
            </button>
          ))}
          {done === 3 && <p className="text-center text-sm text-[#cda349]">Momentum restored. This is how you come back.</p>}
          <Btn variant="ghost" className="w-full" onClick={() => update((d) => { d.comeback = null; return d; })}>New comeback</Btn>
        </div>
      )}
    </Card>
  );
}

function Letters({ db, update }) {
  const [loading, setLoading] = useState(false);
  const write = async () => {
    setLoading(true);
    const sys = `You are the user's future self, 3-5 years ahead, having built the life they're working toward. Write them a short letter (120-180 words). Calm, wise, direct. Never cheesy. Reference their actual recent behaviour honestly — acknowledge what's working and what isn't. Sign off simply.`;
    const txt = await callClaude(sys, `${profileContext(db)}\n${behaviourContext(db)}\nWrite this month's letter.`, 600);
    if (txt) update((d) => { d.letters.unshift({ date: dkey(), text: txt }); return d; });
    setLoading(false);
  };
  return (
    <div className="space-y-4">
      <Card className="rise p-5">
        <Label>Future Self Letters</Label>
        <p className="mb-3 text-sm text-stone-600">Once a month, receive a letter from the version of you that made it — grounded in how you're actually living.</p>
        <Btn onClick={write} disabled={loading}>{loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Write this month's letter</Btn>
      </Card>
      {db.letters.map((l, i) => (
        <Card key={i} className="rise p-6">
          <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-stone-600">{l.date}</p>
          <p className="whitespace-pre-wrap font-display text-[15px] leading-relaxed text-[#2b2620]">{l.text}</p>
        </Card>
      ))}
    </div>
  );
}

/* ============================================================================
   LEGACY
   ========================================================================== */
function Legacy({ db }) {
  const now = new Date();
  const birth = new Date(db.profile.birthYear, 0, 1);
  const age = now.getFullYear() - db.profile.birthYear;
  const weeksLived = Math.floor((now - birth) / (7 * 86400000));
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weeksThisYear = Math.floor((now - startOfYear) / (7 * 86400000));
  const startJourney = fromKey(db.meta.created);
  const daysSince = Math.max(0, Math.round((now - startJourney) / 86400000));
  const lifeExpectancyWeeks = 80 * 52;

  // weeks won this year (avg score >= 60)
  let won = 0, lost = 0;
  for (let w = 0; w < weeksThisYear; w++) {
    const keys = [];
    for (let d = 0; d < 7; d++) keys.push(dkey(addDays(startOfYear, w * 7 + d)));
    const tracked = keys.filter((k) => db.logs[k]);
    if (tracked.length) { if (avgScore(db, keys) >= 60) won++; else lost++; }
  }
  const str = streak(db);

  return (
    <div className="space-y-5">
      <header className="rise">
        <p className="text-[11px] uppercase tracking-[0.3em] text-stone-600">Legacy Dashboard</p>
        <h1 className="font-display text-3xl font-semibold text-[#14110b]">Time Is the Only Currency.</h1>
        <p className="mt-1 text-sm text-stone-600">You are {age}. You have lived ~{weeksLived.toLocaleString()} weeks.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 rise md:grid-cols-4">
        <BigStat label="Age" v={age} />
        <BigStat label="Weeks lived" v={weeksLived.toLocaleString()} />
        <BigStat label="Weeks this year" v={weeksThisYear} />
        <BigStat label="Days on journey" v={daysSince} />
        <BigStat label="Weeks won" v={won} accent />
        <BigStat label="Weeks lost" v={lost} danger />
        <BigStat label="Current streak" v={`${str.current}d`} />
        <BigStat label="Best streak" v={`${str.best}d`} />
      </div>

      <Card className="rise p-5">
        <Label>Your Life in Weeks · {Math.round((weeksLived / lifeExpectancyWeeks) * 100)}% of ~80 years</Label>
        <div className="mt-2 flex flex-wrap gap-[3px]">
          {Array.from({ length: 80 }).map((_, y) => (
            <div key={y} className="flex gap-[3px]">
              {Array.from({ length: 52 }).map((__, w) => {
                const idx = y * 52 + w;
                const lived = idx < weeksLived;
                const current = idx === weeksLived;
                return <div key={w} className="h-[3px] w-[3px] rounded-[1px]"
                  style={{ background: current ? "#cda349" : lived ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.07)" }} />;
              })}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-stone-600">Each row is a year. Each dot is a week. The gold dot is now. The empty dots are not promised.</p>
      </Card>

      <Card className="rise p-5">
        <Label>Personal Records</Label>
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
          <Rec label="Best streak" v={`${str.best} days`} />
          <Rec label="Days tracked" v={Object.keys(db.logs).length} />
          <Rec label="Highest day" v={Math.max(0, ...Object.keys(db.logs).map((k) => disciplineScore(db, k)))} />
          <Rec label="Most consistent" v={habitConsistency(db).sort((a, b) => b.rate - a.rate)[0]?.habit.name || "—"} />
          <Rec label="Weeks won (year)" v={won} />
          <Rec label="Lessons saved" v={db.savedLessons.length} />
        </div>
      </Card>
    </div>
  );
}
const BigStat = ({ label, v, accent, danger }) => (
  <Card className="p-4">
    <p className="text-[10px] uppercase tracking-[0.18em] text-stone-600">{label}</p>
    <p className={`font-display text-2xl font-semibold ${accent ? "text-[#cda349]" : danger ? "text-[#c95f5f]" : "text-[#14110b]"}`}>{v}</p>
  </Card>
);
const Rec = ({ label, v }) => (
  <div><p className="text-[10px] uppercase tracking-wide text-stone-600">{label}</p><p className="mt-0.5 text-[#2b2620]">{v}</p></div>
);

/* ============================================================================
   SETTINGS
   ========================================================================== */
function SettingsView({ db, update, persist }) {
  const p = db.profile;
  const setP = (k, v) => update((d) => { d.profile[k] = v; return d; });
  const fileRef = useRef(null);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `1percent-os-backup-${dkey()}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => { try { persist(JSON.parse(r.result)); } catch (err) { alert("Invalid backup file."); } };
    r.readAsText(file);
  };
  const reset = () => { if (confirm("This erases all data permanently. Continue?")) persist(freshDB()); };

  return (
    <div className="space-y-5">
      <header className="rise">
        <p className="text-[11px] uppercase tracking-[0.3em] text-stone-600">System Settings</p>
        <h1 className="font-display text-3xl font-semibold text-[#14110b]">Configure the System.</h1>
      </header>

      <Card className="rise space-y-4 p-5">
        <Label>Identity</Label>
        <SInput label="Name" v={p.name} on={(x) => setP("name", x)} />
        <SArea label="Future vision" v={p.vision} on={(x) => setP("vision", x)} />
        <SArea label="Current mission" v={p.mission} on={(x) => setP("mission", x)} />
        <div className="grid gap-3 md:grid-cols-3">
          <SArea label="Business goals" v={p.goalsBusiness} on={(x) => setP("goalsBusiness", x)} />
          <SArea label="Fitness goals" v={p.goalsFitness} on={(x) => setP("goalsFitness", x)} />
          <SArea label="Financial goals" v={p.goalsFinancial} on={(x) => setP("goalsFinancial", x)} />
        </div>
        <div><Label>Standards</Label><TagInput items={p.standards} onChange={(x) => setP("standards", x)} placeholder="Add standard" /></div>
        <div><Label>Values</Label><TagInput items={p.values} onChange={(x) => setP("values", x)} placeholder="Add value" /></div>
        <div><Label>Non-negotiables</Label><TagInput items={p.nonNegotiables} onChange={(x) => setP("nonNegotiables", x)} placeholder="Add non-negotiable" /></div>
        <div className="w-40"><Label>Birth year</Label>
          <input type="number" value={p.birthYear} onChange={(e) => setP("birthYear", Number(e.target.value))}
            className="w-full rounded-xl border border-black/[0.12] bg-black/[0.02] px-3 py-2 font-mono outline-none focus:border-[#cda349]/50" />
        </div>
      </Card>

      <Card className="rise p-5">
        <Label>Habit Weightings</Label>
        <p className="mb-3 text-xs text-stone-600">Not all actions are equal. Tune what your discipline score rewards.</p>
        <div className="space-y-3">
          {db.habits.map((h) => (
            <div key={h.id} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-sm text-[#3a342b]">{h.name}</span>
              <input type="range" min="1" max="25" value={h.points}
                onChange={(e) => update((d) => { d.habits = d.habits.map((x) => x.id === h.id ? { ...x, points: Number(e.target.value) } : x); return d; })}
                className="flex-1 accent-[#cda349]" />
              <span className="w-10 text-right font-mono text-xs text-[#3a342b]">{h.points}pt</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="rise p-5">
        <Label>Data</Label>
        <div className="flex flex-wrap gap-2">
          <Btn variant="dark" onClick={exportData}><Download size={15} /> Export / Backup</Btn>
          <Btn variant="dark" onClick={() => fileRef.current?.click()}><Upload size={15} /> Import</Btn>
          <input ref={fileRef} type="file" accept="application/json" onChange={importData} className="hidden" />
          <Btn variant="ghost" onClick={reset} className="!text-[#c95f5f] !border-[#c95f5f]/30 hover:!bg-[#c95f5f]/10"><RotateCcw size={15} /> Reset everything</Btn>
        </div>
        <p className="mt-3 text-xs text-stone-500">Your data is stored privately and persists across sessions on this device.</p>
      </Card>
    </div>
  );
}
const SInput = ({ label, v, on }) => (
  <div><Label>{label}</Label>
    <input value={v} onChange={(e) => on(e.target.value)}
      className="w-full rounded-xl border border-black/[0.12] bg-black/[0.02] px-3 py-2 outline-none focus:border-[#cda349]/50" /></div>
);
const SArea = ({ label, v, on }) => (
  <div><Label>{label}</Label>
    <textarea value={v} onChange={(e) => on(e.target.value)} rows={2}
      className="w-full resize-none rounded-xl border border-black/[0.12] bg-black/[0.02] px-3 py-2 text-sm outline-none focus:border-[#cda349]/50" /></div>
);

/* ---------- Modal ---------- */
function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose}>
      <div className="glass w-full max-w-md rounded-t-3xl p-6 md:rounded-3xl rise" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl text-[#14110b]">{title}</h3>
          <button onClick={onClose} className="text-stone-600 hover:text-[#14110b]"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
