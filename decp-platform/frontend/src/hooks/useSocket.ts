import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { RootState, AppDispatch } from '@store';
import {
  setSocket,
  setConnected,
  setOnlineUsers,
  userOnline,
  userOffline,
  setTyping,
} from '@features/socketSlice';
import { addToast } from '@features/uiSlice';
import { Message } from '@types';

// Module-level singleton — prevents multiple components from each creating their
// own socket connection (which caused duplicate sockets and join-chat race conditions).
let _socketSingleton: Socket | null = null;
let _currentToken: string | null = null;

export const useSocket = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { socket, isConnected, onlineUsers } = useSelector((state: RootState) => state.socket);

  useEffect(() => {
    // Logged out — destroy socket
    if (!token || !user) {
      if (_socketSingleton) {
        _socketSingleton.close();
        _socketSingleton = null;
        _currentToken = null;
        dispatch(setSocket(null));
        dispatch(setConnected(false));
      }
      return;
    }

    // Token unchanged and socket already connected — do nothing
    if (_socketSingleton?.connected && _currentToken === token) return;

    // Close stale socket if token rotated
    if (_socketSingleton && _currentToken !== token) {
      _socketSingleton.close();
      _socketSingleton = null;
    }

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      'http://localhost:3007';

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    _socketSingleton = newSocket;
    _currentToken = token;

    newSocket.on('connect', () => {
      dispatch(setConnected(true));
      dispatch(setSocket(newSocket));
      console.log('[Socket] Connected to', socketUrl);
    });

    newSocket.on('disconnect', (reason) => {
      dispatch(setConnected(false));
      console.log('[Socket] Disconnected:', reason);
    });

    newSocket.on('reconnect', () => {
      dispatch(setConnected(true));
      console.log('[Socket] Reconnected');
    });

    newSocket.on('online-users', (users: string[]) => {
      dispatch(setOnlineUsers(users));
    });

    newSocket.on('user-online', (userId: string) => {
      dispatch(userOnline(userId));
    });

    newSocket.on('user-offline', (userId: string) => {
      dispatch(userOffline(userId));
    });

    newSocket.on('typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      dispatch(setTyping({ userId, isTyping }));
    });

    const handleNotification = (notification: { title?: string; message?: string }) => {
      dispatch(
        addToast({
          message: notification.message || notification.title || 'New notification',
          type: 'info',
        })
      );
    };
    newSocket.on('new-notification', handleNotification);
    newSocket.on('new_notification', handleNotification);

    // Store immediately (even before connect) so other hooks can attach listeners
    dispatch(setSocket(newSocket));

    // No cleanup on unmount — socket persists until logout (token becomes null above)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?._id || (user as any)?.id]);

  // ── Utility wrappers ─────────────────────────────────────────────────────────

  const joinChat = useCallback(
    (chatId: string) => {
      const s = _socketSingleton || socket;
      if (s) {
        s.emit('join-chat', chatId);
        s.emit('join_conversation', chatId); // backend dual-support
      }
    },
    [socket]
  );

  const leaveChat = useCallback(
    (chatId: string) => {
      const s = _socketSingleton || socket;
      s?.emit('leave-chat', chatId);
    },
    [socket]
  );

  const sendMessage = useCallback(
    (chatId: string, content: string) => {
      const s = _socketSingleton || socket;
      s?.emit('send-message', { chatId, content });
    },
    [socket]
  );

  const emitTyping = useCallback(
    (chatId: string, isTyping: boolean) => {
      const s = _socketSingleton || socket;
      s?.emit('typing', { chatId, isTyping });
    },
    [socket]
  );

  const onNewMessage = useCallback(
    (callback: (message: Message) => void) => {
      const s = _socketSingleton || socket;
      if (!s) return () => {};

      // Backend emits both 'new-message' (kebab) and 'new_message' (snake).
      // Listen to both — deduplicate by message id inside the callback.
      const seen = new Set<string>();

      const handler = (payload: any) => {
        // Backend new-message payload: { ...message.toJSON(), conversationId }
        // Backend new_message payload: { message: {...}, conversationId }
        const raw = payload?.message || payload;
        const id = raw?._id || raw?.id || '';
        if (id && seen.has(id)) return;
        if (id) seen.add(id);

        // Normalize: ensure conversationId maps to message.conversationId
        const normalized: Message = {
          ...raw,
          _id: raw?._id || raw?.id || `socket-${Date.now()}`,
          id: raw?._id || raw?.id || `socket-${Date.now()}`,
          conversationId: raw?.conversationId || payload?.conversationId || '',
          chat: raw?.conversationId || payload?.conversationId || '',
          senderId: raw?.senderId || raw?.sender?._id || raw?.sender?.id || '',
          sender: raw?.sender || { _id: raw?.senderId, id: raw?.senderId },
          content: raw?.content || '',
          createdAt: raw?.createdAt || new Date().toISOString(),
        };
        callback(normalized);
      };

      s.on('new-message', handler);
      s.on('new_message', handler);

      return () => {
        s.off('new-message', handler);
        s.off('new_message', handler);
      };
    },
    [socket]
  );

  const onMessageRead = useCallback(
    (callback: (data: { messageId: string; userId: string }) => void) => {
      const s = _socketSingleton || socket;
      if (!s) return () => {};
      s.on('message-read', callback);
      return () => {
        s.off('message-read', callback);
      };
    },
    [socket]
  );

  return {
    socket: _socketSingleton || socket,
    isConnected,
    onlineUsers,
    joinChat,
    leaveChat,
    sendMessage,
    emitTyping,
    onNewMessage,
    onMessageRead,
  };
};

export default useSocket;
