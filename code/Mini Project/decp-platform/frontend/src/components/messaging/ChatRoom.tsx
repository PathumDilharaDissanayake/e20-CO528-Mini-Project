import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Paper,
  Fab,
} from '@mui/material';
import {
  Send,
  AttachFile,
  MoreVert,
  ArrowBack,
  Phone,
  VideoCall,
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
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  const chatId = chat._id || chat.id || '';
  const { data: messagesData } = useGetMessagesQuery({ chatId, page: 1, limit: 50 });
  const [sendMessage] = useSendMessageMutation();
  const { joinChat, leaveChat, onNewMessage } = useSocket();

  const messages = messagesData?.data || [];
  const allMessages = useMemo(() => [...messages, ...localMessages], [messages, localMessages]);

  const currentUserId = user?._id || user?.id;
  const otherParticipant = chat.isGroup
    ? null
    : chat.participants?.find((p) => (p._id || p.id) !== currentUserId) || chat.participants?.[0];
  const chatName = chat.isGroup
    ? chat.groupName || chat.title || 'Group Chat'
    : `${otherParticipant?.firstName || 'User'} ${otherParticipant?.lastName || ''}`.trim();

  useEffect(() => {
    if (!chatId) {
      return;
    }

    joinChat(chatId);
    const unsubscribe = onNewMessage((message: Message) => {
      const messageChatId = message.chat || message.conversationId;
      if (messageChatId === chatId) {
        setLocalMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      leaveChat(chatId);
      unsubscribe();
    };
  }, [chatId, joinChat, leaveChat, onNewMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  const handleSend = async () => {
    if (!messageText.trim() || !chatId) return;

    const userId = user?._id || user?.id || 'me';
    const tempMessage: Message = {
      _id: Date.now().toString(),
      chat: chatId,
      sender: user || { _id: userId, firstName: 'You', role: 'student' },
      content: messageText,
      readBy: [userId],
      createdAt: new Date().toISOString(),
    };

    setLocalMessages((prev) => [...prev, tempMessage]);
    setMessageText('');

    try {
      await sendMessage({ chatId, content: messageText }).unwrap();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMyMessage = (message: Message) => {
    const senderId = message.sender?._id || message.sender?.id || message.senderId;
    const userId = user?._id || user?.id;
    return senderId === userId;
  };

  return (
    <Box className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <Paper elevation={1} className="p-3 flex items-center gap-3 rounded-none">
        {isMobile && (
          <IconButton onClick={onBack}>
            <ArrowBack />
          </IconButton>
        )}
        <Avatar
          src={chat.isGroup ? chat.groupAvatar : otherParticipant?.avatar}
          className="bg-gradient-to-br from-blue-500 to-purple-600"
        >
          {chatName[0]}
        </Avatar>
        <Box className="flex-1">
          <Typography variant="subtitle1" className="font-semibold">
            {chatName}
          </Typography>
          <Typography variant="caption" className="text-gray-500">
            {chat.isGroup ? `${chat.participants?.length || 0} participants` : 'Online'}
          </Typography>
        </Box>
        <IconButton>
          <Phone />
        </IconButton>
        <IconButton>
          <VideoCall />
        </IconButton>
        <IconButton>
          <MoreVert />
        </IconButton>
      </Paper>

      <Box className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.map((message) => {
          const isMine = isMyMessage(message);
          const sender = message.sender || {
            firstName: 'User',
            lastName: '',
            role: 'student' as const,
          };

          return (
            <Box key={message._id || message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <Box className={`flex gap-2 max-w-[70%] ${isMine ? 'flex-row-reverse' : ''}`}>
                {!isMine && (
                  <Avatar
                    src={sender.avatar || sender.profilePicture}
                    className="w-8 h-8 mt-1 bg-gradient-to-br from-blue-500 to-purple-600"
                  >
                    {(sender.firstName || 'U')[0]}
                  </Avatar>
                )}
                <Box
                  className={`
                    px-4 py-2 rounded-2xl
                    ${isMine
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }
                  `}
                >
                  {chat.isGroup && !isMine && (
                    <Typography variant="caption" className="opacity-70 block mb-1">
                      {sender.firstName || 'User'}
                    </Typography>
                  )}
                  <Typography variant="body2">{message.content || ''}</Typography>
                  <Typography
                    variant="caption"
                    className={`opacity-70 block mt-1 text-right ${isMine ? 'text-white' : 'text-gray-500'}`}
                  >
                    {formatRelativeTime(message.createdAt || new Date().toISOString())}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      <Paper elevation={1} className="p-3 rounded-none">
        <Box className="flex items-center gap-2">
          <IconButton>
            <AttachFile />
          </IconButton>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-gray-100 dark:bg-gray-800 rounded-full"
            InputProps={{
              className: 'rounded-full px-4',
            }}
          />
          <Fab
            size="small"
            color="primary"
            onClick={handleSend}
            disabled={!messageText.trim()}
            className="bg-gradient-to-r from-blue-500 to-purple-600"
          >
            <Send fontSize="small" />
          </Fab>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatRoom;
