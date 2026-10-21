// The signed-in person on this site. The keys are the ones MILE's api
// service reads, so the shared pages send the token without any change.
// (This site has its own storage — MILE's sign-in is not visible here.)
const TOKEN = 'super50_token';
const USER = 'super50_user';

// Only staff use the appraisal.
export const STAFF_ROLES = ['teacher', 'admin', 'guide', 'pms_admin', 'super50_admin', 'tp_admin'];
export const isStaff = (u) => [u?.role, ...(u?.roles || [])].some((r) => STAFF_ROLES.includes(r));

export const getUser = () => {
  try {
    return localStorage.getItem(TOKEN) ? JSON.parse(localStorage.getItem(USER) || 'null') : null;
  } catch {
    return null;
  }
};

export const signIn = ({ token, user }) => {
  localStorage.setItem(TOKEN, token);
  localStorage.setItem(USER, JSON.stringify(user));
};

export const signOut = () => {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(USER);
};
