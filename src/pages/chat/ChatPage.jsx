import { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  MessageCircle,
  Search,
  Plus,
  Paperclip,
  Send,
  Loader2,
  Users,
  Check,
  CheckCheck,
  X,
} from "lucide-react";
import api from "../../services/api";
import useChatSocket from "../../context/ChatSocketContext";
import NewChatModal from "../../components/chat/NewChatModal";
import {
  fetchConversations,
  fetchMessages,
  setActiveConversation,
  markConversationReadThunk,
} from "../../features/chat/chatSlice";

const otherParticipant = (conversation, userId) =>
  conversation.isGroup ? null : conversation.participants.find((p) => p._id !== userId);

const conversationTitle = (conversation, userId) => {
  if (conversation.isGroup) return conversation.name || "Group";
  const other = otherParticipant(conversation, userId);
  return other?.name || "Unknown";
};

const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const formatDay = (date) => new Date(date).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });

export default function ChatPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { conversations, activeConversationId, messagesByConversation, onlineUserIds, typingByConversation, loadingConversations } =
    useSelector((s) => s.chat);
  const { sendMessage, markRead, openConversation, closeConversation, startTyping, stopTyping } = useChatSocket();

  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [text, setText] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  const activeConversation = conversations.find((c) => c._id === activeConversationId);
  const messages = useMemo(() => messagesByConversation[activeConversationId] || [], [messagesByConversation, activeConversationId]);
  const typingUserIds = (typingByConversation[activeConversationId] || []).filter((id) => id !== user._id);

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

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, activeConversationId]);

  const handleTextChange = (value) => {
    setText(value);
    if (!activeConversationId) return;
    startTyping(activeConversationId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(activeConversationId), 1500);
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
      stopTyping(activeConversationId);
    } catch (err) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => conversationTitle(c, user._id).toLowerCase().includes(q));
  }, [conversations, search, user._id]);

  // Each message compares its own day against the previous message's day —
  // no running/mutated variable, so this stays a pure derivation.
  const messagesWithDaySeparators = useMemo(
    () =>
      messages.map((message, index) => {
        const day = formatDay(message.createdAt);
        const prevDay = index > 0 ? formatDay(messages[index - 1].createdAt) : null;
        return { message, day, showDaySeparator: day !== prevDay };
      }),
    [messages]
  );

  return (
    <div className="h-[calc(100vh-2rem)] m-4 flex glass-card rounded-3xl overflow-hidden">
      {/* Conversation list */}
      <div className="w-80 shrink-0 border-r border-[var(--border-light)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-light)] flex items-center justify-between">
          <h2 className="font-display font-black text-lg text-[var(--text-primary)] flex items-center gap-2">
            <MessageCircle size={20} className="text-[var(--primary)]" /> Chat
          </h2>
          <button
            onClick={() => setShowNewChat(true)}
            className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
            title="New chat"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="p-3 border-b border-[var(--border-light)]">
          <div className="flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2">
            <Search size={14} className="text-[var(--text-secondary)] shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-[var(--primary)]" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center text-xs text-[var(--text-secondary)] p-8">
              No conversations yet — click + to start one.
            </div>
          ) : (
            filteredConversations.map((c) => {
              const other = otherParticipant(c, user._id);
              const isOnline = other && onlineUserIds.includes(other._id);
              return (
                <button
                  key={c._id}
                  onClick={() => openThread(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-[var(--border-light)] hover:bg-[var(--bg-hover)] ${
                    activeConversationId === c._id ? "bg-[var(--bg-hover)]" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-sm">
                      {c.isGroup ? <Users size={16} /> : conversationTitle(c, user._id)[0]?.toUpperCase()}
                    </div>
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--bg-card)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-[var(--text-primary)] truncate">{conversationTitle(c, user._id)}</span>
                      {c.lastMessage?.sentAt && (
                        <span className="text-[10px] text-[var(--text-secondary)] shrink-0">{formatTime(c.lastMessage.sentAt)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-[var(--text-secondary)] truncate">{c.lastMessage?.text || "No messages yet"}</span>
                      {c.unreadCount > 0 && (
                        <span className="badge bg-[var(--primary)] text-white shrink-0 !text-[10px] px-1.5">{c.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] text-sm">
            Select a conversation, or start a new one.
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-[var(--border-light)] flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-sm">
                {activeConversation.isGroup ? <Users size={16} /> : conversationTitle(activeConversation, user._id)[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-[var(--text-primary)] truncate">{conversationTitle(activeConversation, user._id)}</div>
                {activeConversation.isGroup ? (
                  <div className="text-[11px] text-[var(--text-secondary)] truncate">{activeConversation.participants.length} members</div>
                ) : (
                  onlineUserIds.includes(otherParticipant(activeConversation, user._id)?._id) && (
                    <div className="text-[11px] text-emerald-500 font-bold">Online</div>
                  )
                )}
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1">
              {messagesWithDaySeparators.map(({ message: m, day, showDaySeparator }) => {
                const isOwn = (m.sender?._id || m.sender) === user._id;
                const isRead = m.readBy && m.readBy.length > 1;
                return (
                  <div key={m._id}>
                    {showDaySeparator && (
                      <div className="text-center my-3">
                        <span className="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--bg-input)] px-3 py-1 rounded-full">{day}</span>
                      </div>
                    )}
                    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-1.5`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${
                          isOwn ? "bg-[var(--primary)] text-white rounded-br-sm" : "bg-[var(--bg-input)] text-[var(--text-primary)] rounded-bl-sm"
                        }`}
                      >
                        {!isOwn && activeConversation.isGroup && (
                          <div className="text-[10px] font-bold opacity-70 mb-0.5">{m.sender?.name}</div>
                        )}
                        {m.text && <div className="whitespace-pre-wrap break-words">{m.text}</div>}
                        {m.attachments?.map((a, i) => (
                          <a
                            key={i}
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-1.5 text-xs mt-1.5 underline ${isOwn ? "text-white/90" : "text-[var(--primary)]"}`}
                          >
                            <Paperclip size={12} /> {a.name}
                          </a>
                        ))}
                        <div className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${isOwn ? "text-white/70" : "text-[var(--text-secondary)]"}`}>
                          {formatTime(m.createdAt)}
                          {isOwn && (isRead ? <CheckCheck size={12} /> : <Check size={12} />)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {typingUserIds.length > 0 && (
                <div className="text-xs text-[var(--text-secondary)] italic px-1">typing…</div>
              )}
            </div>

            <div className="p-3 border-t border-[var(--border-light)]">
              {pendingAttachment && (
                <div className="flex items-center gap-2 bg-[var(--bg-input)] rounded-lg px-3 py-1.5 mb-2 text-xs w-fit">
                  <Paperclip size={12} /> {pendingAttachment.name}
                  <button onClick={() => setPendingAttachment(null)}>
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2.5 rounded-lg border border-[var(--border-light)] text-[var(--text-secondary)] disabled:opacity-40"
                  title="Attach a file"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                </button>
                <textarea
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder="Type a message…"
                  className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || (!text.trim() && !pendingAttachment)}
                  className="btn-premium p-2.5 rounded-xl disabled:opacity-40"
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </div>
  );
}
