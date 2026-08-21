import { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { MessageCircle, X, Search, Plus, Paperclip, Send, Loader2, Users, Check, CheckCheck, ArrowLeft } from "lucide-react";
import api from "../../services/api";
import useChatSocket from "../../context/ChatSocketContext";
import NewChatModal from "./NewChatModal";
import {
  fetchMessages,
  setActiveConversation,
  markConversationReadThunk,
} from "../../features/chat/chatSlice";

// A compact, always-available version of ChatPage.jsx — same Redux slice
// and useChatSocket() hook (both already global via ChatSocketProvider in
// Layout.jsx), just a smaller two-view (list / thread) panel instead of a
// full page, so it can float on every screen without needing a route change.
const otherParticipant = (conversation, userId) =>
  conversation.isGroup ? null : conversation.participants.find((p) => p._id !== userId);

const conversationTitle = (conversation, userId) => {
  if (conversation.isGroup) return conversation.name || "Group";
  const other = otherParticipant(conversation, userId);
  return other?.name || "Unknown";
};

const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function FloatingChatBubble() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const { conversations, activeConversationId, messagesByConversation, onlineUserIds, loadingConversations } =
    useSelector((s) => s.chat);
  const { sendMessage, markRead, openConversation, closeConversation } = useChatSocket();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [text, setText] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const isStudent = (user?.roles?.length ? user.roles : [user?.role]).includes("student");
  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations]
  );

  const activeConversation = conversations.find((c) => c._id === activeConversationId);
  const messages = useMemo(() => messagesByConversation[activeConversationId] || [], [messagesByConversation, activeConversationId]);

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => conversationTitle(c, user._id).toLowerCase().includes(q));
  }, [conversations, search, user._id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, activeConversationId]);

  // NewChatModal sets activeConversationId itself once a direct/group chat
  // is started — jump the bubble straight to that thread instead of
  // leaving it on the list.
  useEffect(() => {
    if (activeConversationId && open && !messagesByConversation[activeConversationId]) {
      dispatch(fetchMessages({ conversationId: activeConversationId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  if (!user || isStudent || location.pathname === "/chat") return null;

  const openThread = (conversation) => {
    if (activeConversationId && activeConversationId !== conversation._id) closeConversation(activeConversationId);
    dispatch(setActiveConversation(conversation._id));
    if (!messagesByConversation[conversation._id]) {
      dispatch(fetchMessages({ conversationId: conversation._id }));
    }
    openConversation(conversation._id);
    if (conversation.unreadCount > 0) {
      markRead(conversation._id);
      dispatch(markConversationReadThunk(conversation._id));
    }
  };

  const backToList = () => {
    if (activeConversationId) closeConversation(activeConversationId);
    dispatch(setActiveConversation(null));
  };

  const toggleOpen = () => {
    setOpen((o) => !o);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !activeConversationId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post(`/chat/conversations/${activeConversationId}/attachments`, fd);
      if (data.success) setPendingAttachment(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!activeConversationId || (!text.trim() && !pendingAttachment)) return;
    setSending(true);
    try {
      await sendMessage({
        conversationId: activeConversationId,
        text: text.trim(),
        attachments: pendingAttachment ? [pendingAttachment] : [],
      });
      setText("");
      setPendingAttachment(null);
    } catch (err) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        title="Chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unreadTotal > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadTotal > 9 ? "9+" : unreadTotal}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-[200] w-[360px] h-[520px] max-h-[70vh]">
        {/*
          Two nested divs on purpose: `.glass-card` (src/index.css) sets its
          own `position: relative`, which — combined on the same element as
          Tailwind's `fixed` utility — wins the cascade (equal specificity,
          later in source order) and silently downgrades the panel from
          fixed to relative positioning, making it render far off-screen.
          Keeping `fixed` on this outer wrapper alone, with the visual
          `glass-card` styling on an inner div, avoids the clash.
        */}
        <div className="glass-card w-full h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[var(--border-light)]">
          {!activeConversation ? (
            <>
              <div className="p-3 border-b border-[var(--border-light)] flex items-center justify-between">
                <h3 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                  <MessageCircle size={16} className="text-[var(--primary)]" /> Chat
                </h3>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
                  title="New chat"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="p-2 border-b border-[var(--border-light)]">
                <div className="flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5">
                  <Search size={12} className="text-[var(--text-secondary)] shrink-0" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search…"
                    className="flex-1 bg-transparent outline-none text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingConversations ? (
                  <div className="flex justify-center p-6">
                    <Loader2 size={18} className="animate-spin text-[var(--primary)]" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center text-xs text-[var(--text-secondary)] p-6">No conversations yet.</div>
                ) : (
                  filteredConversations.map((c) => {
                    const other = otherParticipant(c, user._id);
                    const isOnline = other && onlineUserIds.includes(other._id);
                    return (
                      <button
                        key={c._id}
                        onClick={() => openThread(c)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-b border-[var(--border-light)] hover:bg-[var(--bg-hover)]"
                      >
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-xs">
                            {c.isGroup ? <Users size={13} /> : conversationTitle(c, user._id)[0]?.toUpperCase()}
                          </div>
                          {isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[var(--bg-card)]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-[var(--text-primary)] truncate">{conversationTitle(c, user._id)}</span>
                            {c.lastMessage?.sentAt && (
                              <span className="text-[9px] text-[var(--text-secondary)] shrink-0">{formatTime(c.lastMessage.sentAt)}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-[var(--text-secondary)] truncate">{c.lastMessage?.text || "No messages yet"}</span>
                            {c.unreadCount > 0 && (
                              <span className="badge bg-[var(--primary)] text-white shrink-0 !text-[9px] px-1.5">{c.unreadCount}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <>
              <div className="p-3 border-b border-[var(--border-light)] flex items-center gap-2">
                <button onClick={backToList} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <ArrowLeft size={16} />
                </button>
                <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0">
                  {activeConversation.isGroup ? <Users size={13} /> : conversationTitle(activeConversation, user._id)[0]?.toUpperCase()}
                </div>
                <div className="font-bold text-xs text-[var(--text-primary)] truncate">{conversationTitle(activeConversation, user._id)}</div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1">
                {messages.map((m) => {
                  const isOwn = (m.sender?._id || m.sender) === user._id;
                  const isRead = m.readBy && m.readBy.length > 1;
                  return (
                    <div key={m._id} className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1.5`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-xs ${
                          isOwn ? "bg-[var(--primary)] text-white rounded-br-sm" : "bg-[var(--bg-input)] text-[var(--text-primary)] rounded-bl-sm"
                        }`}
                      >
                        {!isOwn && activeConversation.isGroup && (
                          <div className="text-[9px] font-bold opacity-70 mb-0.5">{m.sender?.name}</div>
                        )}
                        {m.text && <div className="whitespace-pre-wrap break-words">{m.text}</div>}
                        {m.attachments?.map((a, i) => (
                          <a
                            key={i}
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-1 text-[10px] mt-1 underline ${isOwn ? "text-white/90" : "text-[var(--primary)]"}`}
                          >
                            <Paperclip size={10} /> {a.name}
                          </a>
                        ))}
                        <div className={`flex items-center gap-1 justify-end mt-0.5 text-[9px] ${isOwn ? "text-white/70" : "text-[var(--text-secondary)]"}`}>
                          {formatTime(m.createdAt)}
                          {isOwn && (isRead ? <CheckCheck size={10} /> : <Check size={10} />)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-2.5 border-t border-[var(--border-light)]">
                {pendingAttachment && (
                  <div className="flex items-center gap-1.5 bg-[var(--bg-input)] rounded-lg px-2.5 py-1 mb-1.5 text-[10px] w-fit">
                    <Paperclip size={10} /> {pendingAttachment.name}
                    <button onClick={() => setPendingAttachment(null)}>
                      <X size={10} />
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-1.5">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-2 rounded-lg border border-[var(--border-light)] text-[var(--text-secondary)] disabled:opacity-40 shrink-0"
                    title="Attach a file"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                  </button>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                    placeholder="Type a message…"
                    className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none resize-none"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || (!text.trim() && !pendingAttachment)}
                    className="btn-premium p-2 rounded-xl disabled:opacity-40 shrink-0"
                  >
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      )}

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </>
  );
}
