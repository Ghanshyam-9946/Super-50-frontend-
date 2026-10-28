import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/chat/conversations');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ conversationId, before } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/chat/conversations/${conversationId}/messages`, {
        params: before ? { before } : undefined,
      });
      return { conversationId, messages: data.data, prepend: !!before };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load messages');
    }
  }
);

export const startDirectConversation = createAsyncThunk(
  'chat/startDirectConversation',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/chat/conversations/direct', { userId });
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start conversation');
    }
  }
);

export const createGroupConversation = createAsyncThunk(
  'chat/createGroupConversation',
  async ({ name, memberIds }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/chat/conversations/group', { name, memberIds });
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create group');
    }
  }
);

export const markConversationReadThunk = createAsyncThunk(
  'chat/markConversationRead',
  async (conversationId, { rejectWithValue }) => {
    try {
      await api.patch(`/chat/conversations/${conversationId}/read`);
      return conversationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);

export const searchChatUsers = createAsyncThunk(
  'chat/searchChatUsers',
  async (search, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/chat/users', { params: search ? { search } : undefined });
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search users');
    }
  }
);

const upsertConversation = (state, conversation) => {
  const idx = state.conversations.findIndex((c) => c._id === conversation._id);
  if (idx === -1) {
    state.conversations.unshift(conversation);
  } else {
    state.conversations[idx] = { ...state.conversations[idx], ...conversation };
  }
};

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations: [],
    activeConversationId: null,
    messagesByConversation: {},
    hasMoreByConversation: {},
    onlineUserIds: [],
    typingByConversation: {},
    chatUsers: [],
    loadingConversations: false,
    loadingMessages: false,
    error: null,
  },
  reducers: {
    clearChatError: (state) => {
      state.error = null;
    },
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload;
    },
    // Pushed by useChatSocket on `message:new` — the sender's own tab also
    // receives this (server broadcasts to every participant, sender
    // included) so a single code path keeps every open tab consistent.
    // De-duped by _id as a defensive backstop (belt-and-suspenders on top
    // of there being exactly one socket connection per session) — a socket
    // reconnect/replay or a genuine multi-tab session could otherwise
    // double-insert the same message.
    messageReceived: (state, action) => {
      const message = action.payload;
      const convId = message.conversation;
      if (!state.messagesByConversation[convId]) state.messagesByConversation[convId] = [];
      const alreadyHave = state.messagesByConversation[convId].some((m) => m._id === message._id);
      if (alreadyHave) return;
      state.messagesByConversation[convId].push(message);

      const conv = state.conversations.find((c) => c._id === convId);
      if (conv) {
        conv.lastMessage = { text: message.text, sender: message.sender?._id || message.sender, sentAt: message.createdAt };
        conv.updatedAt = message.createdAt;
        if (convId !== state.activeConversationId) conv.unreadCount = (conv.unreadCount || 0) + 1;
        state.conversations = [conv, ...state.conversations.filter((c) => c._id !== convId)];
      }
    },
    // Pushed on `message:read` — someone (maybe me, on another tab; maybe
    // the other participant) marked a conversation read.
    messageReadUpdated: (state, action) => {
      const { conversationId, userId } = action.payload;
      const messages = state.messagesByConversation[conversationId];
      if (messages) {
        messages.forEach((m) => {
          if (!m.readBy) m.readBy = [];
          if (!m.readBy.includes(userId)) m.readBy.push(userId);
        });
      }
    },
    presenceUpdated: (state, action) => {
      const { userId, online } = action.payload;
      state.onlineUserIds = online
        ? [...new Set([...state.onlineUserIds, userId])]
        : state.onlineUserIds.filter((id) => id !== userId);
    },
    typingUpdated: (state, action) => {
      const { conversationId, userId, typing } = action.payload;
      const current = state.typingByConversation[conversationId] || [];
      state.typingByConversation[conversationId] = typing
        ? [...new Set([...current, userId])]
        : current.filter((id) => id !== userId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loadingConversations = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loadingConversations = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loadingConversations = false;
        state.error = action.payload;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.loadingMessages = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loadingMessages = false;
        const { conversationId, messages, prepend } = action.payload;
        const existing = state.messagesByConversation[conversationId] || [];
        state.messagesByConversation[conversationId] = prepend ? [...messages, ...existing] : messages;
        state.hasMoreByConversation[conversationId] = messages.length >= 30;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loadingMessages = false;
        state.error = action.payload;
      })
      .addCase(startDirectConversation.fulfilled, (state, action) => {
        upsertConversation(state, action.payload);
        state.activeConversationId = action.payload._id;
      })
      .addCase(createGroupConversation.fulfilled, (state, action) => {
        upsertConversation(state, action.payload);
        state.activeConversationId = action.payload._id;
      })
      .addCase(markConversationReadThunk.fulfilled, (state, action) => {
        const conv = state.conversations.find((c) => c._id === action.payload);
        if (conv) conv.unreadCount = 0;
      })
      .addCase(searchChatUsers.fulfilled, (state, action) => {
        state.chatUsers = action.payload;
      });
  },
});

export const { clearChatError, setActiveConversation, messageReceived, messageReadUpdated, presenceUpdated, typingUpdated } =
  chatSlice.actions;

export default chatSlice.reducer;
