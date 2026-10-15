import { useSyncExternalStore } from "react";
import api from "../services/api";

// Which institute this page belongs to and which modules it has, fetched
// once per page load from GET /institute/current. Until it arrives (or if
// the server has no platform switched on) every module counts as on — the
// menu never flickers away from a working app.
// SISTec's own presentation — what the app has always shown — until the
// server says otherwise.
const LEGACY_BRANDING = {
  appName: "MILE",
  name: "Sagar Institute of Science & Technology (SISTec), Bhopal",
  shortName: "SISTec",
  tagline: "",
  logoUrl: "",
  primaryColor: "",
  emailDomains: ["sistec.ac.in"],
};

let state = { loaded: false, platform: false, institute: null, modules: null, catalog: [], branding: LEGACY_BRANDING, subscription: null };
const listeners = new Set();
let loading = null;

const emit = () => listeners.forEach((l) => l());

export const loadInstitute = (force = false) => {
  if (loading && !force) return loading;
  loading = api.get("/institute/current")
    .then(({ data }) => {
      state = {
        loaded: true,
        platform: !!data.platform,
        institute: data.institute,
        modules: data.modules || null,
        catalog: data.catalog || [],
        branding: { ...LEGACY_BRANDING, ...(data.branding || {}) },
        subscription: data.subscription || null,
      };
      emit();
      return state;
    })
    .catch(() => {
      state = { ...state, loaded: true };
      emit();
      return state;
    });
  return loading;
};

const under = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);

// The module a page belongs to, or null (core / not listed).
export const moduleForPath = (path, info = state) => {
  for (const m of info.catalog || []) {
    if (m.core) continue;
    if ((m.paths || []).some((p) => under(path, p))) return m;
  }
  return null;
};

// The module whose role permissions cover a page — including the core
// ones roles can be given (the student/staff directory).
export const permissionModuleForPath = (path, info = state) => {
  for (const m of info.catalog || []) {
    if (m.core && !m.permissioned) continue;
    if ((m.paths || []).some((p) => under(path, p))) return m;
  }
  return null;
};

// What this user's roles say about a page: hidden (the matrix took it
// away), granted (a custom role gives it), or nothing to say.
export const roleVerdict = (path, user, info = state) => {
  const mod = permissionModuleForPath(path, info);
  const perms = mod && user?.permissions?.[mod.key];
  if (!perms) return { hidden: false, granted: false };
  return { hidden: perms.view === false, granted: (perms.grants || []).includes("view") };
};

export const isPathEnabled = (path, info = state) => {
  if (!info.modules || !path) return true;
  const mod = moduleForPath(path, info);
  return !mod || info.modules.includes(mod.key);
};

// An institute created on the platform (not SISTec's own campuses): its
// documents carry its own name and logo instead of SISTec's.
export const isOwnInstitute = (info = state) => !!info.institute && !info.institute.legacy;

// For code outside React (printing a dossier).
export const getBranding = () => ({ ...state.branding, own: isOwnInstitute() });

// Whether the institute has a module, by its key ("chat", "assistant"...).
export const isModuleOn = (key, info = state) => !info.modules || info.modules.includes(key);

export const useInstitute = () => useSyncExternalStore(
  (listener) => {
    listeners.add(listener);
    if (!loading) loadInstitute();
    return () => listeners.delete(listener);
  },
  () => state,
);

export const useBranding = () => {
  const info = useInstitute();
  return { ...info.branding, own: isOwnInstitute(info) };
};
