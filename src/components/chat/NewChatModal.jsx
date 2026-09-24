import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, User, Users, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { searchChatUsers, startDirectConversation, createGroupConversation } from "../../features/chat/chatSlice";

export default function NewChatModal({ onClose }) {
  const dispatch = useDispatch();
  const { chatUsers } = useSelector((s) => s.chat);
  const [search, setSearch] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => dispatch(searchChatUsers(search)), 250);
    return () => clearTimeout(t);
  }, [search, dispatch]);

  const toggleSelect = (userId) =>
    setSelected((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));

  const startDirect = async (userId) => {
    setStarting(true);
    try {
      await dispatch(startDirectConversation(userId)).unwrap();
      onClose();
    } catch (err) {
      toast.error(err || "Failed to start conversation");
    } finally {
      setStarting(false);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) return toast.error("Enter a group name");
    if (selected.length === 0) return toast.error("Pick at least one member");
    setStarting(true);
    try {
      await dispatch(createGroupConversation({ name: groupName.trim(), memberIds: selected })).unwrap();
      onClose();
    } catch (err) {
      toast.error(err || "Failed to create group");
    } finally {
      setStarting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md glass-card rounded-3xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="p-5 border-b border-[var(--border-light)] flex items-center justify-between">
            <h3 className="font-display font-black text-lg text-[var(--text-primary)]">New Chat</h3>
            <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <X size={18} />
            </button>
          </div>

          <div className="p-4 flex gap-2 border-b border-[var(--border-light)]">
            <button
              onClick={() => setIsGroup(false)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg ${
                !isGroup ? "bg-[var(--primary)] text-white" : "border border-[var(--border-light)] text-[var(--text-primary)]"
              }`}
            >
              <User size={13} /> Direct
            </button>
            <button
              onClick={() => setIsGroup(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg ${
                isGroup ? "bg-[var(--primary)] text-white" : "border border-[var(--border-light)] text-[var(--text-primary)]"
              }`}
            >
              <Users size={13} /> Group
            </button>
          </div>

          {isGroup && (
            <div className="px-4 pt-3">
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
          )}

          <div className="px-4 pt-3">
            <div className="flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2">
              <Search size={14} className="text-[var(--text-secondary)] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search faculty / admin…"
                className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {chatUsers.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] text-center py-6">No users found.</p>
            ) : (
              chatUsers.map((u) => (
                <label
                  key={u._id}
                  onClick={() => {
                    // In group mode the checkbox owns the toggle (via its own
                    // onChange, fired both by a direct click and by the
                    // browser's native label->input forwarding) — handling
                    // it here too used to double-toggle it, which is why a
                    // mouse click looked like it wasn't registering.
                    if (!isGroup) startDirect(u._id);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer hover:bg-[var(--bg-hover)]"
                >
                  {isGroup && (
                    <input type="checkbox" checked={selected.includes(u._id)} onChange={() => toggleSelect(u._id)} />
                  )}
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0">
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[var(--text-primary)] truncate">{u.name}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] truncate">{u.email}</div>
                  </div>
                </label>
              ))
            )}
          </div>

          {isGroup && (
            <div className="p-4 border-t border-[var(--border-light)]">
              <button
                onClick={createGroup}
                disabled={starting}
                className="btn-premium w-full text-sm px-4 py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {starting ? <Loader2 size={14} className="animate-spin" /> : `Create Group (${selected.length})`}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
