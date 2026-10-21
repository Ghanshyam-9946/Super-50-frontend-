// Where the Appraisal portal lives. It is a separate site that uses the
// same MILE API and the same accounts.
const clean = (u) => String(u || '').trim().replace(/\/+$/, '');

export const APPRAISAL_URL = clean(import.meta.env.VITE_APPRAISAL_URL) || 'https://appraisal.sistec.ac.in';
export const MILE_URL = clean(import.meta.env.VITE_MILE_URL) || 'https://mile.sistec.ac.in';

// The portal URL that signs the person in with a one-time code and then
// opens `next`. The code goes after "#" so it never reaches a server log.
export const portalSignInUrl = (code, next = '/appraisal/my') =>
  `${APPRAISAL_URL}/sso#${new URLSearchParams({ code, next }).toString()}`;
