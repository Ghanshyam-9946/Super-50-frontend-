import api from "../../services/api";

// Shared by the appraisal pages: the marks (same rules as the server's
// utils/appraisalTemplate.js, so the totals move as points are typed), the
// download, and who the signed-in person is in the process.

const num = (v) => (v === "" || v === null || v === undefined ? 0 : Number(v) || 0);
const r2 = (n) => Math.round(n * 100) / 100;

export const computeTotals = (tpl, review) => {
  if (!tpl || !review) return null;
  const groups = {};
  for (const g of tpl.SECTION_B) {
    let sum = 0;
    for (const p of g.parts) {
      let part;
      if (p.rows) part = (review[p.key] || []).reduce((n, r) => n + num(r.points), 0);
      else if (p.principal) part = tpl.TEACHING_ITEMS.reduce((n, t) => n + num(review.principalFeedback?.[t.key]), 0);
      else part = p.items.reduce((n, i) => n + Math.min(i.max, num(review.points?.[i.key])), 0);
      sum += Math.min(p.max, part);
    }
    groups[g.key] = r2(Math.min(g.max, sum));
  }
  const sectionB = r2(Object.values(groups).reduce((n, v) => n + v, 0));
  const sectionC = r2((review.competencies || []).reduce((n, c) => n + Math.min(10, num(c.rating)), 0));
  const totalMax = tpl.SECTION_B_MAX + tpl.SECTION_C_MAX;
  return {
    groups, sectionB, sectionC, total: r2(sectionB + sectionC),
    sectionBMax: tpl.SECTION_B_MAX, sectionCMax: tpl.SECTION_C_MAX, totalMax,
    percent: r2(((sectionB + sectionC) / totalMax) * 100),
  };
};

export const downloadBlob = async (url, fallbackName, params) => {
  const res = await api.get(url, { responseType: "blob", params });
  const name = /filename="([^"]+)"/.exec(res.headers["content-disposition"] || "")?.[1] || fallbackName;
  const href = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 30000);
};

const hasResp = (user, name) => (user?.responsibilities || []).some((r) => String(r).trim().toLowerCase() === name.toLowerCase());
const isAdmin = (user) => (user?.roles?.length ? user.roles : [user?.role]).includes("admin");

export const appraisalRoles = (user) => ({
  hr: isAdmin(user) || hasResp(user, "HR"),
  principal: isAdmin(user) || hasResp(user, "Principal"),
  hod: hasResp(user, "HOD"),
});

export const STATUS_STYLE = {
  faculty: "bg-amber-500/10 text-amber-600",
  hod: "bg-sky-500/10 text-sky-600",
  principal: "bg-violet-500/10 text-violet-600",
  completed: "bg-green-500/10 text-green-600",
};

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
