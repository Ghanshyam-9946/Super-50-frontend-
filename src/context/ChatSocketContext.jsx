import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { io } from "socket.io-client";
import {
  messageReceived,
  messageReadUpdated,
  presenceUpdated,
  typingUpdated,
  fetchConversations,
} from "../features/chat/chatSlice";
import { announceNewMessage, unlockAudioOnFirstGesture } from "../utils/speak";

// Same base the REST client (services/api.js) uses, minus the trailing
// "/api" — Socket.io connects to the server origin, not an API path.
const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const ChatSocketContext = createContext(null);

// One socket connection for the whole app, established here and only here
// (Layout.jsx mounts this once around everything) — every component that
// needs to send/receive chat events goes through the shared instance via
// useChatSocket() below. Previously each caller (Layout AND ChatPage) ran
// its own useChatSocket() hook, which each opened its OWN socket.io
// connection; since the server broadcasts a new message to every socket
// joined to `user:<id>`, having two live sockets for the same user meant
// every message arrived — and got dispatched into the store — twice.
export function ChatSocketProvider({ children }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const activeConversationId = useSelector((s) => s.chat.activeConversationId);
  const socketRef = useRef(null);

  const isStudent = (user?.roles?.length ? user.roles : [user?.role]).includes("student");

  // Read inside the socket handler below instead of closing over the
  // useSelector value directly — the handler is registered once per
  // effect run (deps: [user?._id, isStudent]), so a plain closure would
  // keep seeing whichever conversation was active at connect time, not
  // whichever one is open right now.
  const activeConversationIdRef = useRef(activeConversationId);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    if (!user || isStudent) return undefined;
    const token = localStorage.getItem("super50_token");
    if (!token) return undefined;

    unlockAudioOnFirstGesture();
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("message:new", (message) => {
      dispatch(messageReceived(message));
      // Chime + spoken alert (Hindi + English) — skip your own sent messages
      // (the server broadcasts to every participant, sender included) and
      // skip the conversation you're actually looking at right now: open in
      // the /chat page or the bubble (both set activeConversationId, and
      // both clear it when closed/left) AND this tab is on screen. If you've
      // switched to another tab, you still want to hear it.
      const senderId = message.sender?._id || message.sender;
      const isOwnMessage = senderId === user._id;
      const isViewingIt =
        message.conversation === activeConversationIdRef.current &&
        document.visibilityState === "visible";
      if (!isOwnMessage && !isViewingIt) {
        announceNewMessage(message.sender?.name);
      }
    });
    socket.on("message:read", (payload) => dispatch(messageReadUpdated(payload)));
    socket.on("presence:update", (payload) => dispatch(presenceUpdated(payload)));
    socket.on("typing:update", (payload) => dispatch(typingUpdated(payload)));

    dispatch(fetchConversations());

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, isStudent]);

  const sendMessage = useCallback(({ conversationId, text, attachments }) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject(new Error("Chat is not connected"));
      socketRef.current.emit("message:send", { conversationId, text, attachments }, (ack) => {
        if (ack?.success) resolve(ack.data);
        else reject(new Error(ack?.message || "Failed to send message"));
      });
    });
  }, []);

  const markRead = useCallback((conversationId) => {
    socketRef.current?.emit("conversation:read", { conversationId }, () => {});
  }, []);

  const openConversation = useCallback((conversationId) => {
    socketRef.current?.emit("conversation:open", { conversationId });
  }, []);
  const closeConversation = useCallback((conversationId) => {
    socketRef.current?.emit("conversation:close", { conversationId });
  }, []);

  const startTyping = useCallback((conversationId) => {
    socketRef.current?.emit("typing:start", { conversationId });
  }, []);
  const stopTyping = useCallback((conversationId) => {
    socketRef.current?.emit("typing:stop", { conversationId });
  }, []);

  const value = { sendMessage, markRead, openConversation, closeConversation, startTyping, stopTyping };

  return <ChatSocketContext.Provider value={value}>{children}</ChatSocketContext.Provider>;
}

export default function useChatSocket() {
  const ctx = useContext(ChatSocketContext);
  if (!ctx) {
    throw new Error("useChatSocket must be used within a ChatSocketProvider");
  }
  return ctx;
}
