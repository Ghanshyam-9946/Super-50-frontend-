// Browser-native text-to-speech (zero dependencies, zero backend) — used to
// announce new chat messages aloud for faculty/admin. Feature-detected and
// wrapped in try/catch throughout: speechSynthesis can be entirely absent
// (some in-app webviews) or throw in restricted contexts, and a failed
// announcement must never break the actual chat feature it's attached to.
const isSupported = () => typeof window !== "undefined" && "speechSynthesis" in window;

export const speak = (text, lang) => {
  if (!isSupported() || !text) return;
  try {
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

// Sender name only, not the message body — reading someone's private
// message content aloud in a shared/open space is a real sensitivity a
// simple "new message" ping avoids, matching how phone notification
// sounds also don't read content aloud by default.
export const announceNewMessage = (senderName) => {
  if (!isSupported() || !senderName) return;
  speak(`${senderName} का नया संदेश`, "hi-IN");
  speak(`New message from ${senderName}`, "en-IN");
};
