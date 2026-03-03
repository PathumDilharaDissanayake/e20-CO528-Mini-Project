import React from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Badge,
  Box,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { Chat } from '@types';
import { formatDate } from '@utils';

interface ChatListProps {
  chats: Chat[];
  selectedChatId?: string;
  onSelectChat: (chat: Chat) => void;
  onlineUsers: string[];
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
  onlineUsers,
}) => {
  const [search, setSearch] = React.useState('');

  const getFirstParticipant = (chat: Chat) => chat.participants?.[0] || { firstName: 'User', lastName: '', role: 'student' as const };

  const filteredChats = chats.filter((chat) => {
    const searchLower = search.toLowerCase();
    if (chat.isGroup) {
      return (chat.groupName || chat.title || '').toLowerCase().includes(searchLower);
    }

    const otherParticipant = getFirstParticipant(chat);
    return (
      (otherParticipant.firstName || '').toLowerCase().includes(searchLower) ||
      (otherParticipant.lastName || '').toLowerCase().includes(searchLower)
    );
  });

  const getChatName = (chat: Chat) => {
    if (chat.isGroup) return chat.groupName || chat.title || 'Group Chat';
    const otherParticipant = getFirstParticipant(chat);
    return `${otherParticipant.firstName || 'User'} ${otherParticipant.lastName || ''}`.trim();
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroup) return chat.groupAvatar;
    return getFirstParticipant(chat).avatar;
  };

  const getOtherParticipantId = (chat: Chat) => {
    if (chat.isGroup) return null;
    const participant = getFirstParticipant(chat);
    return participant._id || participant.id || null;
  };

  return (
    <Box className="h-full flex flex-col">
      <Box className="p-3 border-b border-gray-200 dark:border-gray-800">
        <TextField
          fullWidth
          size="small"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" className="text-gray-400" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <List className="flex-1 overflow-y-auto p-0">
        {filteredChats.map((chat) => {
          const chatId = chat._id || chat.id || '';
          const isSelected = chatId === selectedChatId;
          const otherParticipantId = getOtherParticipantId(chat);
          const isOnline = otherParticipantId ? onlineUsers.includes(otherParticipantId) : false;

          return (
            <ListItem
              key={chatId}
              onClick={() => onSelectChat(chat)}
              className={`
                border-b border-gray-100 dark:border-gray-800 cursor-pointer
                ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
              `}
            >
              <ListItemAvatar>
                <Badge
                  variant="dot"
                  color="success"
                  invisible={!isOnline}
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                  <Avatar src={getChatAvatar(chat)} className="bg-gradient-to-br from-blue-500 to-purple-600">
                    {getChatName(chat)[0]}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle2" className={`font-semibold ${isSelected ? 'text-blue-600' : ''}`}>
                    {getChatName(chat)}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" className="text-gray-500 truncate">
                    {chat.lastMessage?.content || 'No messages yet'}
                  </Typography>
                }
              />
              <Box className="flex flex-col items-end ml-2">
                {chat.lastMessage?.createdAt && (
                  <Typography variant="caption" className="text-gray-400">
                    {formatDate(chat.lastMessage.createdAt)}
                  </Typography>
                )}
                {(chat.unreadCount || 0) > 0 && (
                  <Badge badgeContent={chat.unreadCount} color="error" className="mt-1" />
                )}
              </Box>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default ChatList;