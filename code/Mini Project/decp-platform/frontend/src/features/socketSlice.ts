import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SocketState {
  socket: any;
  isConnected: boolean;
  onlineUsers: string[];
  typingUsers: Record<string, boolean>;
}

const initialState: SocketState = {
  socket: null,
  isConnected: false,
  onlineUsers: [],
  typingUsers: {},
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setSocket: (state, action: PayloadAction<any>) => {
      state.socket = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setOnlineUsers: (state, action: PayloadAction<string[]>) => {
      state.onlineUsers = action.payload;
    },
    userOnline: (state, action: PayloadAction<string>) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    userOffline: (state, action: PayloadAction<string>) => {
      state.onlineUsers = state.onlineUsers.filter((id) => id !== action.payload);
    },
    setTyping: (state, action: PayloadAction<{ userId: string; isTyping: boolean }>) => {
      state.typingUsers[action.payload.userId] = action.payload.isTyping;
    },
  },
});

export const {
  setSocket,
  setConnected,
  setOnlineUsers,
  userOnline,
  userOffline,
  setTyping,
} = socketSlice.actions;
export default socketSlice.reducer;
