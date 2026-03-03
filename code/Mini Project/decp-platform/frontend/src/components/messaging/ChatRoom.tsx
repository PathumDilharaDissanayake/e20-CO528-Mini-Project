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
  // localMessages: optimistic temp messages not yet confirmed by server
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  const chatId = chat._id || chat.id || '';
  const currentUserId = user?._id || user?.id || '';

  const { data: messagesData, isLoading: isLoadingMessages } = useGetMessagesQuery(
    { chatId, page: 1, limit: 50 },
    { skip: !chatId, pollingInterval: 5000 } // Poll every 5s as fallback for socket events
  );
  const [sendMessage] = useSendMessageMutation();
  const { joinChat, leaveChat, onNewMessage } = useSocket();

  const serverMessages = messagesData?.data || [];

  // IDs already returned by the server
  const serverMessageIds = useMemo(
    () => new Set(serverMessages.map((m) => m._id || m.id)),
    [serverMessages]
  );

  // Show server messages + only the temp messages not yet in server data
  const allMessages = useMemo(() => {
    const pendingLocals = localMessages.filter((lm) => {
      const id = lm._id || lm.id || '';
      return !serverMessageIds.has(id);
    });
    return [...serverMessages, ...pendingLocals];
  }, [serverMessages, localMessages, serverMessageIds]);

  // Reset local state when chat changes
  useEffect(() => {
    setLocalMessages([]);
    setMessageText('');
  }, [chatId]);

  // Socket: join room and handle incoming messages from others
  useEffect(() => {
    if (!chatId) return;

    joinChat(chatId);

    const unsubscribe = onNewMessage((message: Message) => {
      const msgChatId = message.chat || message.conversationId;
      if (msgChatId !== chatId) return;

      const senderId = message.sender?._id || message.sender?.id || message.senderId;
      // Ignore own messages — they're added optimistically then confirmed via refetch
      if (senderId === currentUserId) return;

      setLocalMessages((prev) => {
        const id = message._id || message.id || '';
        if (prev.some((m) => (m._id || m.id) === id)) return prev;
        return [...prev, message];
      });
    });

    return () => {
      leaveChat(chatId);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Auto-scroll to bottom
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
      sender: user || { _id: currentUserId, firstName: 'You', role: 'student' },
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
      // Remove temp — the invalidated query refetch will include the real message
      setLocalMessages((prev) => prev.filter((m) => (m._id || m.id) !== tempId));
    } catch (error) {
      console.error('Failed to send message:', error);
      // Keep temp message to indicate it was attempted
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
      {/* Header */}
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
        }}
      >
        {isMobile && (
          <IconButton onClick={onBack} size="small">
            <ArrowBack />
          </IconButton>
        )}
        <Avatar
          src={chat.isGroup ? chat.groupAvatar : otherParticipant?.avatar}
          sx={{ width: 40, height: 40, background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}
        >
          {chatName[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {chatName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {chat.isGroup ? `${chat.participants?.length || 0} members` : 'Active'}
          </Typography>
        </Box>
        <Tooltip title="Voice call">
          <IconButton size="small"><Phone fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Video call">
          <IconButton size="small"><VideoCall fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="More options">
          <IconButton size="small"><MoreVert fontSize="small" /></IconButton>
        </Tooltip>
      </Paper>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.015)',
        }}
      >
        {isLoadingMessages && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} color="primary" />
          </Box>
        )}

        {!isLoadingMessages && allMessages.length === 0 && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Typography color="text.disabled" variant="body2">No messages yet</Typography>
            <Typography color="text.disabled" variant="caption">Say hello to {chatName}!</Typography>
          </Box>
        )}

        {allMessages.map((message) => {
          const isMine = isMyMessage(message);
          const isTemp = (message._id || message.id || '').startsWith('temp-');
          const sender = (message.sender || { firstName: 'User', lastName: '', role: 'student' }) as any;

          return (
            <Box
              key={message._id || message.id}
              sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', mb: 0.5 }}
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
                  <Avatar
                    src={sender.avatar || sender.profilePicture}
                    sx={{
                      width: 30,
                      height: 30,
                      mb: 0.25,
                      background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                      fontSize: '0.72rem',
                      flexShrink: 0,
                    }}
                  >
                    {(sender.firstName || 'U')[0]}
                  </Avatar>
                )}
                <Box>
                  {chat.isGroup && !isMine && (
                    <Typography variant="caption" sx={{ ml: 1, color: 'primary.main', fontWeight: 600, fontSize: '0.7rem' }}>
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
                        : (t: any) => t.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      opacity: isTemp ? 0.75 : 1,
                      transition: 'opacity 0.3s',
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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.25 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: isMine ? 'rgba(255,255,255,0.65)' : 'text.disabled', fontSize: '0.62rem' }}
                      >
                        {formatRelativeTime(message.createdAt || new Date().toISOString())}
                      </Typography>
                      {isMine && !isTemp && (
                        <DoneAll sx={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }} />
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

      {/* Input */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
          <Tooltip title="Attach file">
            <IconButton size="small" sx={{ color: 'text.secondary', mb: 0.5 }}>
              <AttachFile fontSize="small" />
            </IconButton>
          </Tooltip>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message…"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
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
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
              '&:disabled': { opacity: 0.4, background: 'rgba(99,102,241,0.3)', boxShadow: 'none' },
            }}
          >
            <Send fontSize="small" sx={{ color: 'white' }} />
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
