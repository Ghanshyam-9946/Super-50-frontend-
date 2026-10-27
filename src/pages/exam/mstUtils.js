import api from "../../services/api";

// Values and helpers shared by the MST Exam pages.

export const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]";
export const labelCls = "flex flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]";
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
export const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
export const dateText = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) : "");
export const errText = (err, fallback) => err?.response?.data?.message || fallback;

// Downloads a file from the API, keeping the server's file name.
export const download = async (url, fallback, params) => {
  const res = await api.get(url, { responseType: "blob", params });
  const name = /filename="([^"]+)"/.exec(res.headers["content-disposition"] || "")?.[1] || fallback;
  const href = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 30000);
};
