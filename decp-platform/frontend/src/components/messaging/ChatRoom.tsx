import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Paper,
  Fab,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Send,
  AttachFile,
  MoreVert,
  ArrowBack,
  Phone,
  VideoCall,
  DoneAll,
} from '@mui/icons-material';
import { Chat, Message } from '@types';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useGetMessagesQuery, useSendMessageMutation } from '@services/chatApi';
import { useSocket } from '@hooks';
import { formatRelativeTime } from '@utils';

interface ChatRoomProps {
  chat: Chat;
  onBack?: () => void;
  isMobile?: boolean;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ chat, onBack, isMobile }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageText, setMessageText] = useState('');
  // localMessages: optimistic temp messages + real-time socket messages not yet in server data
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  const chatId = chat._id || chat.id || '';
  const currentUserId = user?._id || user?.id || '';

  const { data: messagesData, isLoading: isLoadingMessages } = useGetMessagesQuery(
    { chatId, page: 1, limit: 50 },
    { skip: !chatId, pollingInterval: 8000 }
  );
  const [sendMessage] = useSendMessageMutation();
  const { joinChat, leaveChat, onNewMessage, isConnected } = useSocket();

  const serverMessages = messagesData?.data || [];

  // IDs already returned by the server
  const serverMessageIds = useMemo(
    () => new Set(serverMessages.map((m) => m._id || m.id)),
    [serverMessages]
  );

  // Show server messages + only the temp/socket messages not yet in server data
  const allMessages = useMemo(() => {
    const pendingLocals = localMessages.filter((lm) => {
      const id = lm._id || lm.id || '';
      return !serverMessageIds.has(id);
    });
    return [...serverMessages, ...pendingLocals].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });
  }, [serverMessages, localMessages, serverMessageIds]);

  // Reset local state when chat changes
  useEffect(() => {
    setLocalMessages([]);
    setMessageText('');
  }, [chatId]);

  // Helper: resolve sender info from chat participants (socket only sends senderId)
  const resolveSender = useCallback((senderId: string) => {
    const found = chat.participants?.find(
      (p) => (p._id || p.id) === senderId
    );
    return found || { _id: senderId, id: senderId, firstName: 'User', lastName: '', role: 'student' as const };
  }, [chat.participants]);

  // Socket: join room and handle incoming messages.
  // Depends on isConnected so it re-runs once socket is ready (fixes race condition
  // where join-chat was emitted before socket connected).
  useEffect(() => {
    if (!chatId || !isConnected) return;

    joinChat(chatId);

    const unsubscribe = onNewMessage((message: Message) => {
      const msgChatId = message.chat || message.conversationId;
      if (msgChatId && msgChatId !== chatId) return;

      const senderId = message.sender?._id || message.sender?.id || message.senderId || '';
      // Ignore own messages — they're added optimistically and confirmed via refetch
      if (senderId === currentUserId) return;

      // Enrich with full sender object from chat participants
      const enrichedMessage: Message = {
        ...message,
        sender: resolveSender(senderId),
        senderId,
      };

      setLocalMessages((prev) => {
        const id = enrichedMessage._id || enrichedMessage.id || '';
        if (id && prev.some((m) => (m._id || m.id) === id)) return prev;
        return [...prev, enrichedMessage];
      });
    });

    return () => {
      leaveChat(chatId);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, isConnected]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  const handleSend = useCallback(async () => {
    const text = messageText.trim();
    if (!text || !chatId || isSending) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      _id: tempId,
      id: tempId,
      chat: chatId,
      conversationId: chatId,
      sender: user as any || { _id: currentUserId, firstName: 'You', role: 'student' },
      senderId: currentUserId,
      content: text,
      readBy: [currentUserId],
      createdAt: new Date().toISOString(),
    };

    setLocalMessages((prev) => [...prev, tempMessage]);
    setMessageText('');
    setIsSending(true);

    try {
      await sendMessage({ chatId, content: text }).unwrap();
      // Remove temp — the refetch will include the real message
      setLocalMessages((prev) => prev.filter((m) => (m._id || m.id) !== tempId));
    } catch (error) {
      console.error('[ChatRoom] Failed to send message:', error);
      // Keep temp message visible so user knows it was attempted
    } finally {
      setIsSending(false);
    }
  }, [messageText, chatId, isSending, user, currentUserId, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMyMessage = (message: Message) => {
    const senderId = message.sender?._id || message.sender?.id || message.senderId;
    return senderId === currentUserId;
  };

  const otherParticipant = chat.isGroup
    ? null
    : chat.participants?.find((p) => (p._id || p.id) !== currentUserId) || chat.participants?.[0];

  const chatName = chat.isGroup
    ? chat.groupName || chat.title || 'Group Chat'
    : `${otherParticipant?.firstName || 'User'} ${otherParticipant?.lastName || ''}`.trim();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Header ── */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderRadius: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          background: (t) =>
            t.palette.mode === 'dark'
              ? 'rgba(15,23,42,0.8)'
              : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {isMobile && (
          <IconButton onClick={onBack} size="small">
            <ArrowBack />
          </IconButton>
        )}
        <Avatar
          src={chat.isGroup ? chat.groupAvatar : otherParticipant?.avatar}
          sx={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            fontSize: '1rem',
            fontWeight: 700,
          }}
        >
          {chatName[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {chatName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isConnected && (
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#22c55e',
                  flexShrink: 0,
                }}
              />
            )}
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
              {chat.isGroup
                ? `${chat.participants?.length || 0} members`
                : isConnected
                ? 'Online'
                : 'Connecting…'}
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Voice call (coming soon)">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <Phone fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Video call (coming soon)">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <VideoCall fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="More options">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* ── Messages ── */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          bgcolor: (t) =>
            t.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.01)'
              : 'rgba(0,0,0,0.015)',
        }}
      >
        {isLoadingMessages && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} color="primary" />
          </Box>
        )}

        {!isLoadingMessages && !isConnected && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CircularProgress size={10} /> Connecting to live chat…
            </Typography>
          </Box>
        )}

        {!isLoadingMessages && allMessages.length === 0 && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              py: 6,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(129,140,248,0.08))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              <Send sx={{ color: '#6366f1', fontSize: 28 }} />
            </Box>
            <Typography color="text.secondary" variant="body2" fontWeight={600}>
              No messages yet
            </Typography>
            <Typography color="text.disabled" variant="caption">
              Say hello to {chatName}!
            </Typography>
          </Box>
        )}

        {allMessages.map((message) => {
          const isMine = isMyMessage(message);
          const isTemp = (message._id || message.id || '').startsWith('temp-');
          const sender = (message.sender || { firstName: 'User', lastName: '', role: 'student' }) as any;
          const senderName = `${sender.firstName || 'User'} ${sender.lastName || ''}`.trim();

          return (
            <Box
              key={message._id || message.id}
              sx={{
                display: 'flex',
                justifyContent: isMine ? 'flex-end' : 'flex-start',
                mb: 0.5,
                animation: 'fadeInUp 0.2s ease-out both',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  maxWidth: '72%',
                  flexDirection: isMine ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                }}
              >
                {!isMine && (
                  <Tooltip title={senderName}>
                    <Avatar
                      src={sender.avatar || sender.profilePicture}
                      sx={{
                        width: 30,
                        height: 30,
                        mb: 0.25,
                        background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                        fontSize: '0.72rem',
                        flexShrink: 0,
                        fontWeight: 700,
                      }}
                    >
                      {(sender.firstName || 'U')[0]}
                    </Avatar>
                  </Tooltip>
                )}
                <Box>
                  {chat.isGroup && !isMine && (
                    <Typography
                      variant="caption"
                      sx={{ ml: 1, color: 'primary.main', fontWeight: 600, fontSize: '0.7rem' }}
                    >
                      {sender.firstName}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: isMine ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                      background: isMine
                        ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                        : (t: any) =>
                            t.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                      boxShadow: isMine
                        ? '0 2px 8px rgba(99,102,241,0.3)'
                        : '0 1px 4px rgba(0,0,0,0.08)',
                      opacity: isTemp ? 0.75 : 1,
                      transition: 'opacity 0.3s',
                      border: isMine
                        ? 'none'
                        : '1px solid',
                      borderColor: isMine ? 'transparent' : 'divider',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: isMine ? 'white' : 'text.primary',
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {message.content}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 0.5,
                        mt: 0.25,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: isMine ? 'rgba(255,255,255,0.65)' : 'text.disabled',
                          fontSize: '0.62rem',
                        }}
                      >
                        {formatRelativeTime(message.createdAt || new Date().toISOString())}
                      </Typography>
                      {isMine && !isTemp && (
                        <DoneAll sx={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }} />
                      )}
                      {isTemp && (
                        <CircularProgress size={8} sx={{ color: 'rgba(255,255,255,0.5)' }} />
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* ── Input ── */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
          flexShrink: 0,
          background: (t) =>
            t.palette.mode === 'dark'
              ? 'rgba(15,23,42,0.8)'
              : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <Tooltip title="Attach file (coming soon)">
            <IconButton size="small" sx={{ color: 'text.secondary', mb: 0.5 }}>
              <AttachFile fontSize="small" />
            </IconButton>
          </Tooltip>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={isConnected ? 'Type a message…' : 'Connecting…'}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            size="small"
            disabled={!isConnected && !messageText}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                bgcolor: (t) =>
                  t.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(0,0,0,0.04)',
                '& fieldset': { borderColor: 'transparent' },
                '&:hover fieldset': { borderColor: 'primary.light' },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' },
              },
            }}
          />
          <Fab
            size="small"
            disabled={!messageText.trim() || isSending}
            onClick={handleSend}
            sx={{
              flexShrink: 0,
              mb: 0.5,
              background: messageText.trim()
                ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                : undefined,
              boxShadow: messageText.trim()
                ? '0 4px 12px rgba(99,102,241,0.35)'
                : 'none',
              transition: 'all 0.2s ease',
              '&:disabled': {
                opacity: 0.4,
                background: 'rgba(99,102,241,0.3)',
                boxShadow: 'none',
              },
            }}
          >
            {isSending ? (
              <CircularProgress size={16} sx={{ color: 'white' }} />
            ) : (
              <Send fontSize="small" sx={{ color: messageText.trim() ? 'white' : undefined }} />
            )}
          </Fab>
        </Box>
        <Typography variant="caption" color="text.disabled" sx={{ ml: 1, fontSize: '0.65rem' }}>
          Press Enter to send · Shift+Enter for new line
        </Typography>
      </Paper>
    </Box>
  );
};

export default ChatRoom;
