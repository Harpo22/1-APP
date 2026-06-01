import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal, Field, MoneyInput, Select, Input, Textarea, Toggle, Button, Badge, cx } from "./ui.jsx";
import { todayISO, parseMonthKey } from "../lib/format.js";
import {
  PAYMENT_METHODS,
  PERSONAL_INCOME_CATEGORIES,
  PERSONAL_EXPENSE_CATEGORIES,
  BUSINESS_REVENUE_CATEGORIES,
  BUSINESS_EXPENSE_CATEGORIES,
  WASTE_VERDICTS,
  WASTE_TRIGGERS,
} from "../lib/constants.js";
import { useApp } from "../context/AppContext.jsx";

function defaultDateForMonth(monthKey) {
  const today = todayISO();
  if (today.startsWith(monthKey)) return today;
  return `${monthKey}-15`;
}

export function TransactionModal({ open, onClose, scope, editing, defaultType = "expense" }) {
  const { actions, symbol, selectedMonth } = useApp();
  const isPersonal = scope === "personal";

  const [type, setType] = useState(defaultType);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(defaultDateForMonth(selectedMonth));
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [notes, setNotes] = useState("");
  const [necessary, setNecessary] = useState(true);
  const [verdict, setVerdict] = useState("");
  const [why, setWhy] = useState("");
  const [trigger, setTrigger] = useState("");

  const incomeCats = isPersonal ? PERSONAL_INCOME_CATEGORIES : BUSINESS_REVENUE_CATEGORIES;
  const expenseCats = isPersonal ? PERSONAL_EXPENSE_CATEGORIES : BUSINESS_EXPENSE_CATEGORIES;
  const cats = type === "income" ? incomeCats : expenseCats;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setDate(editing.date);
      setPaymentMethod(editing.paymentMethod || "Card");
      setNotes(editing.notes || "");
      setNecessary(editing.necessary !== false);
      setVerdict(editing.waste?.verdict || "");
      setWhy(editing.waste?.why || "");
      setTrigger(editing.waste?.trigger || "");
    } else {
      setType(defaultType);
      setAmount("");
      setCategory((defaultType === "income" ? incomeCats : expenseCats)[0]);
      setDate(defaultDateForMonth(selectedMonth));
      setPaymentMethod("Card");
      setNotes("");
      setNecessary(true);
      setVerdict("");
      setWhy("");
      setTrigger("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  useEffect(() => {
    if (!cats.includes(category)) setCategory(cats[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const showWaste = isPersonal && type === "expense" && !necessary;

  const save = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    const payload = {
      scope,
      type,
      amount: amt,
      category,
      date,
      paymentMethod,
      notes: notes.trim(),
      necessary: type === "income" ? true : necessary,
      waste: showWaste ? { verdict, why: why.trim(), trigger } : null,
    };
    if (editing) actions.updateTransaction(editing.id, payload);
    else actions.addTransaction(payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${editing ? "Edit" : "Add"} ${isPersonal ? "Personal" : "Business"} Transaction`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{editing ? "Save changes" : "Add transaction"}</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* type toggle */}
        <div className="grid grid-cols-2 gap-2">
          {["income", "expense"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cx(
                "rounded-xl px-3 py-2.5 text-sm font-600 capitalize ring-1 transition",
                type === t
                  ? t === "income"
                    ? "bg-brand-500/15 text-brand-300 ring-brand-400/30"
                    : "bg-red-500/15 text-red-300 ring-red-400/30"
                  : "bg-white/5 text-white/50 ring-white/10"
              )}
            >
              {isPersonal ? (t === "income" ? "Income" : "Expense") : t === "income" ? "Revenue" : "Expense"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount">
            <MoneyInput symbol={symbol} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" autoFocus />
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)} options={cats} />
          </Field>
          <Field label="Payment Method">
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} options={PAYMENT_METHODS} />
          </Field>
        </div>

        <Field label="Notes">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was this for?" />
        </Field>

        {isPersonal && type === "expense" && (
          <Field label="Was this purchase necessary?">
            <div className="flex items-center gap-3">
              <Toggle checked={necessary} onChange={setNecessary} labels={["Unnecessary", "Necessary"]} />
              {!necessary && <Badge color="red">Counts as wasted money</Badge>}
            </div>
          </Field>
        )}

        {showWaste && (
          <div className="animate-fade-up rounded-xl border border-red-400/20 bg-red-500/5 p-4">
            <div className="mb-3 flex items-start gap-2">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-300" />
              <p className="text-sm font-700 text-red-200">
                WAS THIS PURCHASE WORTH MOVING FURTHER AWAY FROM YOUR FUTURE?
              </p>
            </div>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {WASTE_VERDICTS.map((v) => (
                <button
                  key={v}
                  onClick={() => setVerdict(v)}
                  className={cx(
                    "rounded-lg px-2 py-2 text-xs font-600 ring-1 transition",
                    verdict === v ? "bg-white/15 text-white ring-white/30" : "bg-white/5 text-white/50 ring-white/10"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <Field label="Why did I buy this?" className="mb-3">
              <Textarea value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Be honest with yourself…" className="min-h-[60px]" />
            </Field>
            <Field label="What triggered it?">
              <Select value={trigger} onChange={(e) => setTrigger(e.target.value)} options={["", ...WASTE_TRIGGERS].map((t) => ({ value: t, label: t || "Select trigger…" }))} />
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
}
