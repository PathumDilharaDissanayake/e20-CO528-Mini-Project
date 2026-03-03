import React, { useState } from 'react';
import { Box, Paper, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useGetChatsQuery } from '@services/chatApi';
import { ChatList } from '@components/messaging/ChatList';
import { ChatRoom } from '@components/messaging/ChatRoom';
import { EmptyState } from '@components/common';
import { Chat } from '@types';

export const MessagesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const { onlineUsers } = useSelector((state: RootState) => state.socket);
  const { data: chatsData, isLoading } = useGetChatsQuery();

  const chats = chatsData?.data || [];

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
  };

  const handleBack = () => {
    setSelectedChat(null);
  };

  if (isLoading) {
    return (
      <Box className="h-[calc(100vh-140px)] flex items-center justify-center">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  // Mobile view
  if (isMobile) {
    return (
      <Box className="h-[calc(100vh-140px)]">
        {selectedChat ? (
          <ChatRoom
            chat={selectedChat}
            onBack={handleBack}
            isMobile
          />
        ) : (
          <Paper className="h-full overflow-hidden">
            <Box className="p-4 border-b border-gray-200 dark:border-gray-800">
              <Typography variant="h6" className="font-bold">
                Messages
              </Typography>
            </Box>
            {chats.length === 0 ? (
              <EmptyState
                icon="empty"
                title="No messages"
                description="Start a conversation with your connections!"
              />
            ) : (
              <ChatList
                chats={chats}
                onSelectChat={handleSelectChat}
                onlineUsers={onlineUsers}
              />
            )}
          </Paper>
        )}
      </Box>
    );
  }

  // Desktop view
  return (
    <Box className="h-[calc(100vh-140px)]">
      <Paper className="h-full overflow-hidden flex">
        {/* Chat List */}
        <Box className="w-80 border-r border-gray-200 dark:border-gray-800">
          <Box className="p-4 border-b border-gray-200 dark:border-gray-800">
            <Typography variant="h6" className="font-bold">
              Messages
            </Typography>
          </Box>
          {chats.length === 0 ? (
            <EmptyState
              icon="empty"
              title="No messages"
              description="Start a conversation with your connections!"
            />
          ) : (
            <ChatList
              chats={chats}
              selectedChatId={selectedChat?._id || selectedChat?.id}
              onSelectChat={handleSelectChat}
              onlineUsers={onlineUsers}
            />
          )}
        </Box>

        {/* Chat Room */}
        <Box className="flex-1">
          {selectedChat ? (
            <ChatRoom chat={selectedChat} />
          ) : (
            <Box className="h-full flex items-center justify-center">
              <EmptyState
                icon="empty"
                title="Select a conversation"
                description="Choose a chat from the list to start messaging"
              />
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default MessagesPage;
