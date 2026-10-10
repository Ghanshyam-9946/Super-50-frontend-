import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, X, Send, Loader2, ThumbsUp, ThumbsDown, ArrowRight, RotateCcw } from "lucide-react";
import api from "../../services/api";

// The help assistant, fixed to the bottom middle of every signed-in page.
//
// It answers questions about this portal and sends people to the right page.
// It has no access to anybody's data — that was a deliberate choice, and the
// answers say so when somebody asks "what are my marks".

// Answers come back as light markdown. Rendering it as React elements rather
// than HTML keeps anything the model writes from becoming markup.
const inline = (text, keyBase) => {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      out.push(<strong key={`${keyBase}-b${i}`} className="font-bold">{token.slice(2, -2)}</strong>);
    } else {
      out.push(
        <code key={`${keyBase}-c${i}`} className="px-1 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] text-[11px]">
          {token.slice(1, -1)}
        </code>,
      );
    }
    last = m.index + token.length;
    i += 1;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

const Answer = ({ text }) => {
  const lines = String(text).split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        const bullet = trimmed.match(/^[-*]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-[var(--primary)] mt-[3px]">•</span>
              <span className="flex-1">{inline(bullet[1], i)}</span>
            </div>
          );
        }
        const numbered = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
        if (numbered) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="font-bold text-[var(--primary)]">{numbered[1]}.</span>
              <span className="flex-1">{inline(numbered[2], i)}</span>
            </div>
          );
        }
        if (/^#{1,4}\s/.test(trimmed)) {
          return <p key={i} className="font-bold pt-0.5">{inline(trimmed.replace(/^#{1,4}\s/, ""), i)}</p>;
        }
        return <p key={i}>{inline(trimmed, i)}</p>;
      })}
    </div>
  );
};

export default function AssistantBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [starters, setStarters] = useState([]);
  const [notice, setNotice] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    if (starters.length) return;
    api.get("/assistant/starters")
      .then(({ data }) => setStarters(data.starters || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const send = async (question) => {
    const text = String(question || "").trim();
    if (!text || busy) return;

    setDraft("");
    setNotice("");
    const history = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text }]);
    setBusy(true);

    try {
      const { data } = await api.post("/assistant/ask", { question: text, history, page: location.pathname });
      setMessages((prev) => [...prev, {
        role: "model", text: data.answer, sources: data.sources || [],
        logId: data.logId, grounded: data.grounded, feedback: "",
      }]);
    } catch (err) {
      const message = err.response?.data?.message || "I could not answer that just now.";
      setMessages((prev) => [...prev, { role: "model", text: message, sources: [], error: true }]);
    } finally {
      setBusy(false);
    }
  };

  const rate = async (index, feedback) => {
    const message = messages[index];
    if (!message?.logId || message.feedback) return;
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, feedback } : m)));
    setNotice(feedback === "up" ? "Thanks!" : "Thanks — your admin will see this.");
    setTimeout(() => setNotice(""), 2500);
    try {
      await api.post("/assistant/feedback", { logId: message.logId, feedback });
    } catch {
      // Feedback is a nicety; a failure here is not worth telling anybody.
    }
  };

  const go = (path) => {
    if (!path) return;
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Bottom middle, clear of the chat bubble in the bottom right. */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Ask about this portal"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[190] flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-[var(--primary)] text-white shadow-xl hover:scale-[1.03] active:scale-95 transition-transform"
        >
          <Sparkles size={16} />
          <span className="text-xs font-bold whitespace-nowrap">Ask AI</span>
        </button>
      )}

      {open && (
        // `fixed` must stay on its own element: `.glass-card` sets
        // position:relative and would silently cancel it (same note as the
        // chat bubble).
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[190] w-[min(440px,calc(100vw-1.5rem))] h-[min(580px,78vh)]">
          <div className="glass-card w-full h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[var(--border-light)]">
            {/* header */}
            <div className="px-4 py-3 border-b border-[var(--border-light)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center shrink-0">
                  <Sparkles size={15} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-sm text-[var(--text-primary)] leading-tight">Portal Assistant</h3>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate">Ask how anything here works</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button onClick={() => { setMessages([]); setNotice(""); }}
                    title="Start again"
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--primary)]/10">
                    <RotateCcw size={14} />
                  </button>
                )}
                <button onClick={() => setOpen(false)} title="Close"
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--primary)]/10">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* conversation */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm text-[var(--text-primary)]">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-[var(--text-secondary)] text-[13px] leading-relaxed">
                    I can explain any part of this portal and take you to the right page.
                    I cannot see your marks, attendance or application status — for those, open the page itself.
                  </p>
                  {starters.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Try asking</p>
                      {starters.map((s) => (
                        <button key={s} onClick={() => send(s)}
                          className="w-full text-left text-[12px] px-3 py-2 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                  {m.role === "user" ? (
                    <p className="max-w-[85%] bg-[var(--primary)] text-white rounded-2xl rounded-br-md px-3 py-2 text-[13px] break-words">
                      {m.text}
                    </p>
                  ) : (
                    <div className="max-w-full">
                      <div className={`rounded-2xl rounded-bl-md px-3 py-2.5 text-[13px] leading-relaxed ${
                        m.error
                          ? "bg-amber-500/10 border border-amber-500/30 text-[var(--text-primary)]"
                          : "bg-[var(--primary)]/[0.07] border border-[var(--border-light)]"
                      }`}>
                        <Answer text={m.text} />
                      </div>

                      {m.sources?.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {m.sources.filter((s) => s.path).map((s) => (
                            <button key={s.path} onClick={() => go(s.path)}
                              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20">
                              {s.title} <ArrowRight size={11} />
                            </button>
                          ))}
                        </div>
                      )}

                      {m.logId && (
                        <div className="mt-1 flex items-center gap-1">
                          <button onClick={() => rate(i, "up")} disabled={!!m.feedback} title="This helped"
                            className={`p-1 rounded-md ${m.feedback === "up" ? "text-emerald-500" : "text-[var(--text-secondary)] hover:text-emerald-500"} disabled:cursor-default`}>
                            <ThumbsUp size={12} />
                          </button>
                          <button onClick={() => rate(i, "down")} disabled={!!m.feedback} title="This did not help"
                            className={`p-1 rounded-md ${m.feedback === "down" ? "text-red-500" : "text-[var(--text-secondary)] hover:text-red-500"} disabled:cursor-default`}>
                            <ThumbsDown size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {busy && (
                <div className="flex items-center gap-2 text-[var(--text-secondary)] text-[12px]">
                  <Loader2 size={13} className="animate-spin" /> Looking it up…
                </div>
              )}
              <div ref={endRef} />
            </div>

            {notice && (
              <p className="px-4 pb-1 text-[11px] font-semibold text-[var(--primary)] shrink-0">{notice}</p>
            )}

            {/* ask */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(draft); }}
              className="p-3 border-t border-[var(--border-light)] flex gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Gate pass kaise banau?"
                maxLength={600}
                className="flex-1 bg-[var(--bg-app)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[var(--primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />
              <button type="submit" disabled={busy || !draft.trim()}
                className="bg-[var(--primary)] text-white rounded-xl px-3 disabled:opacity-40 disabled:cursor-not-allowed">
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
