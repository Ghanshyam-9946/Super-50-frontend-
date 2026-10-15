// Everything this software shows is Indian time, in 12-hour form.
//
// A browser formats dates in the viewer's own zone and locale. For a
// college whose every date is Indian, that meant a student abroad, or
// anybody whose Windows clock was set to another region, read the wrong
// time for a class, a deadline or a gate pass. The clock differed too: a
// bare toLocaleString() printed "14:30" under one locale and "2:30 pm"
// under another, so the same screen disagreed with itself between users.
//
// Setting the defaults here, once, means a call site written tomorrow is
// right without anybody remembering a rule. Anything that genuinely needs
// another zone or a 24-hour clock still gets it by passing `timeZone` or
// `hour12` itself — these are defaults, not an override.

const IST = "Asia/Kolkata";
const LOCALE = "en-IN";

// `[]` is how "no preference" is spelled at a call site; treat it as unset
// rather than handing it to Intl as a locale.
const noLocale = (locales) =>
  locales === undefined || locales === null || (Array.isArray(locales) && locales.length === 0);

let applied = false;

export const applyIstDefaults = () => {
  if (applied) return;
  applied = true;

  const patch = (method, alwaysShowsTime) => {
    const original = Date.prototype[method];
    Date.prototype[method] = function istDefault(locales, options) {
      const opts = { ...(options || {}) };
      if (opts.timeZone === undefined) opts.timeZone = IST;

      // hour12 is only meaningful when a time is actually rendered; adding
      // it to a date-only call would be noise.
      const showsTime = alwaysShowsTime || opts.hour !== undefined || opts.timeStyle !== undefined;
      if (showsTime && opts.hour12 === undefined && opts.hourCycle === undefined) {
        opts.hour12 = true;
      }

      // An explicitly chosen locale is kept — 'en-CA' is used on purpose in
      // places to get a YYYY-MM-DD key, and must not become 'en-IN'.
      const out = original.call(this, noLocale(locales) ? LOCALE : locales, opts);

      // en-IN writes the day period in lower case ("2:30 pm"); every notice
      // and report here says "2:30 PM". Only touched when the 12-hour clock
      // was this module's doing — a caller who asked for hour12 themselves
      // gets their locale's own spelling, untouched.
      return showsTime && opts.hour12 === true && (options || {}).hour12 === undefined
        ? out.replace(/(\s)([ap])\.?m\.?/gi, (_m, sp, p) => sp + p.toUpperCase() + "M")
        : out;
    };
  };

  patch("toLocaleString", true);
  patch("toLocaleTimeString", true);
  patch("toLocaleDateString", false);
};

// The house format, for code that would rather say what it means than
// remember the options object.
export const istDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { timeZone: IST, day: "2-digit", month: "short", year: "numeric" });

export const istTime = (d) =>
  new Date(d).toLocaleTimeString("en-IN", { timeZone: IST, hour: "2-digit", minute: "2-digit", hour12: true });

export const istDateTime = (d) => `${istDate(d)}, ${istTime(d)}`;

// Today in IST as YYYY-MM-DD — what an <input type="date"> expects, and the
// key half the app uses. Built from the IST parts, never from a UTC slice.
export const istYmd = (d = new Date()) =>
  new Date(d).toLocaleDateString("en-CA", { timeZone: IST });

// Applied as soon as this module is imported. Importing it first in
// main.jsx is therefore enough — no call to remember, and no window in
// which a module body could format a date under the old defaults.
applyIstDefaults();

export { IST, LOCALE };
