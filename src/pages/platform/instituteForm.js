// The plain parts of an institute's form, kept apart from the components.

export const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm w-full";
export const labelCls = "flex flex-col gap-1 text-[10px] font-bold uppercase text-[var(--text-secondary)]";

export const PLANS = ["basic", "academic", "complete", "custom"];

const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

// The editable fields as the form holds them, from a saved record.
export const toForm = (inst = {}) => ({
  name: inst.name || "",
  domains: (inst.domains || []).join(", "),
  plan: inst.plan || "custom",
  limits: { students: inst.limits?.students ?? "", faculty: inst.limits?.faculty ?? "" },
  subscription: { startsAt: day(inst.subscription?.startsAt), endsAt: day(inst.subscription?.endsAt) },
  contact: { person: inst.contact?.person || "", email: inst.contact?.email || "", phone: inst.contact?.phone || "" },
  notes: inst.notes || "",
  modules: inst.modules || [],
});

// The form back into what the API takes.
export const fromForm = (f) => ({
  name: f.name.trim(),
  domains: f.domains,
  plan: f.plan,
  limits: { students: f.limits.students === "" ? null : Number(f.limits.students), faculty: f.limits.faculty === "" ? null : Number(f.limits.faculty) },
  subscription: { startsAt: f.subscription.startsAt || null, endsAt: f.subscription.endsAt || null },
  contact: f.contact,
  notes: f.notes,
  modules: f.modules,
});
