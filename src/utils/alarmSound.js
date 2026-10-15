// One shared alarm sound for the whole app.
//
// Two things used to keep the reminder silent, both fixed here:
//   1. A browser suspends (or refuses) an AudioContext until the page has
//      had a real user gesture, so the very first alarm made no sound.
//      `unlockAudio()` runs once on the first click/key/touch and resumes
//      the context, which then stays usable for the rest of the session.
//   2. Chrome allows only a handful of AudioContexts per page. Creating a
//      new one for every beep meant the alarm went quiet after a few
//      rings; here exactly one context is created and reused.
//
// The alarm is a three-tone chime, loud enough to notice but short.

const MUTE_KEY = 'reminder_sound_muted';

let ctx = null;
let unlocked = false;

const context = () => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx || ctx.state === 'closed') ctx = new AudioCtx();
  return ctx;
};

export const isAlarmMuted = () => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false; // private mode / blocked storage — default to audible
  }
};

export const setAlarmMuted = (muted) => {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // Not being able to remember the choice is not worth failing over.
  }
};

// Called once on the first user gesture so the context is ready when a
// reminder actually fires (browsers block audio started without one).
export const unlockAudio = () => {
  if (unlocked) return;
  const audio = context();
  if (!audio) return;
  unlocked = true;
  audio.resume?.().catch(() => {});
};

if (typeof window !== 'undefined') {
  const once = () => {
    unlockAudio();
    ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.removeEventListener(e, once));
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, once, { passive: true }));
}

/**
 * Play the alarm chime. `force` ignores the mute setting — used by the
 * "Test sound" button, which should always be audible.
 */
export const playAlarm = ({ force = false } = {}) => {
  if (!force && isAlarmMuted()) return;
  try {
    const audio = context();
    if (!audio) return;
    // A context that was suspended in the background needs waking first,
    // otherwise the notes are scheduled and never heard.
    if (audio.state === 'suspended') audio.resume?.().catch(() => {});

    const tone = (freq, start, duration, volume = 0.22) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(start);
      osc.stop(start + duration + 0.02);
    };

    const now = audio.currentTime;
    tone(880, now, 0.18);
    tone(1175, now + 0.2, 0.18);
    tone(1568, now + 0.4, 0.3);
  } catch {
    // Audio can still be refused (autoplay policy, no output device) — the
    // modal and the spoken title carry the reminder on their own.
  }
};

export default playAlarm;
