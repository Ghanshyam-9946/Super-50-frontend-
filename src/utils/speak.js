// Browser-native text-to-speech (zero dependencies, zero backend) — used to
// announce new chat messages aloud for faculty/admin. Feature-detected and
// wrapped in try/catch throughout: speechSynthesis can be entirely absent
// (some in-app webviews) or throw in restricted contexts, and a failed
// announcement must never break the actual chat feature it's attached to.
const isSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

export const speak = (text, lang) => {
  if (!isSupported() || !text) return;
  try {
    // Chrome can leave the synth "paused" (e.g. after the tab was in the
    // background), silently swallowing every later utterance.
    window.speechSynthesis.resume();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1;
    // speechSynthesis queues utterances automatically (FIFO) — calling
    // speak() twice back-to-back plays them one after another with no
    // extra scheduling code needed for the Hindi-then-English pairing.
    window.speechSynthesis.speak(utterance);
  } catch {
    // Swallow — see file header.
  }
};

// One shared AudioContext for chimes, created lazily and reused (a new
// context per sound piles up and browsers cap how many can exist).
let audioCtx = null;
const getAudioCtx = () => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
};

// Short rising two-note chime — a real notification sound, so a message is
// audible even where no TTS voice is installed or speech is unavailable.
export const playChime = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const tone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };
    const now = ctx.currentTime;
    tone(660, now, 0.12);
    tone(880, now + 0.14, 0.18);
  } catch {
    // Swallow — see file header.
  }
};

// Browsers refuse to start audio (Web Audio and speech) until the page has
// had a user gesture — and a chat message arrives via a socket event, never
// a gesture. So on the very first click/tap/key anywhere, start the shared
// AudioContext and prime speech; from then on, later messages can play.
let unlockInstalled = false;
export const unlockAudioOnFirstGesture = () => {
  if (unlockInstalled || typeof window === "undefined") return;
  unlockInstalled = true;
  const events = ["pointerdown", "keydown", "touchstart"];
  const unlock = () => {
    try {
      getAudioCtx();
      if (isSupported()) {
        const primer = new SpeechSynthesisUtterance("");
        primer.volume = 0;
        window.speechSynthesis.speak(primer);
      }
    } catch {
      // Swallow — see file header.
    }
    events.forEach((e) => window.removeEventListener(e, unlock, true));
  };
  events.forEach((e) => window.addEventListener(e, unlock, true));
};

// Sender name only, not the message body — reading someone's private
// message content aloud in a shared/open space is a real sensitivity a
// simple "new message" ping avoids, matching how phone notification
// sounds also don't read content aloud by default.
export const announceNewMessage = (senderName) => {
  playChime();
  if (!isSupported() || !senderName) return;
  speak(`${senderName} का नया संदेश`, "hi-IN");
  speak(`New message from ${senderName}`, "en-IN");
};
