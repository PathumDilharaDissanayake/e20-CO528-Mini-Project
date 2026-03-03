import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
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

export const useSocket = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { socket, isConnected, onlineUsers } = useSelector((state: RootState) => state.socket);

  useEffect(() => {
    if (!token || !user) return;

    // Use VITE_SOCKET_URL (messaging service) instead of API gateway URL
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      'http://localhost:3007';

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      dispatch(setConnected(true));
      console.log('Socket connected to', socketUrl);
    });

    newSocket.on('disconnect', () => {
      dispatch(setConnected(false));
      console.log('Socket disconnected');
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

    dispatch(setSocket(newSocket));

    return () => {
      newSocket.close();
      dispatch(setSocket(null));
    };
  }, [token, user, dispatch]);

  const joinChat = useCallback(
    (chatId: string) => {
      socket?.emit('join-chat', chatId);
    },
    [socket]
  );

  const leaveChat = useCallback(
    (chatId: string) => {
      socket?.emit('leave-chat', chatId);
    },
    [socket]
  );

  const sendMessage = useCallback(
    (chatId: string, content: string) => {
      socket?.emit('send-message', { chatId, content });
    },
    [socket]
  );

  const emitTyping = useCallback(
    (chatId: string, isTyping: boolean) => {
      socket?.emit('typing', { chatId, isTyping });
    },
    [socket]
  );

  const onNewMessage = useCallback(
    (callback: (message: Message) => void) => {
      socket?.on('new-message', callback);
      return () => {
        socket?.off('new-message', callback);
      };
    },
    [socket]
  );

  const onMessageRead = useCallback(
    (callback: (data: { messageId: string; userId: string }) => void) => {
      socket?.on('message-read', callback);
      return () => {
        socket?.off('message-read', callback);
      };
    },
    [socket]
  );

  return {
    socket,
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
