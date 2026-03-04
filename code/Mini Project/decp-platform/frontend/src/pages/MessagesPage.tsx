import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
  TextField,
  InputAdornment,
  Avatar,
  List,
  ListItemButton,
  Badge,
  Divider,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemText,
  ListItemAvatar,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import { Search, Edit, GroupAdd } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useGetChatsQuery } from '@services/chatApi';
import { useGetUsersQuery } from '@services/userApi';
import { useCreateChatMutation } from '@services/chatApi';
import { ChatRoom } from '@components/messaging/ChatRoom';
import { Chat, User } from '@types';
import { formatRelativeTime } from '@utils';

const ChatListItem: React.FC<{
  chat: Chat;
  isSelected: boolean;
  currentUserId: string;
  onSelect: (chat: Chat) => void;
}> = ({ chat, isSelected, currentUserId, onSelect }) => {
  const otherParticipant = chat.isGroup
    ? null
    : chat.participants?.find((p) => (p._id || p.id) !== currentUserId) || chat.participants?.[0];

  const displayName = chat.isGroup
    ? chat.groupName || chat.title || 'Group Chat'
    : `${otherParticipant?.firstName || 'User'} ${otherParticipant?.lastName || ''}`.trim();

  const lastMsg = (chat.lastMessage as any);
  const lastMsgText = lastMsg?.content || lastMsg?.text || 'Start a conversation';
  const lastMsgTime = lastMsg?.createdAt;

  return (
    <ListItemButton
      onClick={() => onSelect(chat)}
      selected={isSelected}
      sx={{
        py: 1.5,
        px: 2,
        gap: 1.5,
        borderRadius: 0,
        '&.Mui-selected': {
          bgcolor: 'rgba(22,101,52,0.1)',
          borderLeft: '3px solid',
          borderColor: 'primary.main',
          '&:hover': { bgcolor: 'rgba(22,101,52,0.12)' },
        },
        '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
      }}
    >
      <Badge
        badgeContent={chat.unreadCount || 0}
        color="primary"
        max={9}
        sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}
      >
        <Avatar
          src={chat.isGroup ? chat.groupAvatar : otherParticipant?.avatar}
          sx={{ width: 44, height: 44, background: 'linear-gradient(135deg, #6366f1, #818cf8)', fontSize: '1rem', fontWeight: 700 }}
        >
          {displayName[0]?.toUpperCase()}
        </Avatar>
      </Badge>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
          <Typography variant="body2" fontWeight={700} noWrap sx={{ flex: 1, mr: 1 }}>
            {displayName}
          </Typography>
          {lastMsgTime && (
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', flexShrink: 0 }}>
              {formatRelativeTime(lastMsgTime)}
            </Typography>
          )}
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ display: 'block', fontWeight: (chat.unreadCount || 0) > 0 ? 600 : 400 }}
        >
          {lastMsgText}
        </Typography>
      </Box>
    </ListItemButton>
  );
};

export const MessagesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: chatsData, isLoading } = useGetChatsQuery(undefined, {
    pollingInterval: 10000, // refresh every 10 s for new conversations
  });

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<string[]>([]);
  const [createChat, { isLoading: isCreatingChat }] = useCreateChatMutation();
  const { data: usersData, isFetching: isSearching } = useGetUsersQuery(
    { search: userQuery, limit: 10 },
    { skip: !userQuery.trim() }
  );

  const currentUserId = user?._id || user?.id || '';
  const chats = (chatsData?.data || []).filter((c: Chat) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const otherP = c.participants?.find((p) => (p._id || p.id) !== currentUserId);
    const name = c.isGroup
      ? (c.groupName || c.title || '').toLowerCase()
      : `${otherP?.firstName || ''} ${otherP?.lastName || ''}`.toLowerCase();
    return name.includes(term);
  });

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
  };

  const handleBack = () => {
    setSelectedChat(null);
  };

  const handleStartDirect = async (targetUser: User) => {
    try {
      const result = await createChat({ participantId: targetUser._id || targetUser.id || '' }).unwrap();
      if (result.data) {
        setSelectedChat(result.data);
      }
      setNewChatOpen(false);
      setUserQuery('');
    } catch (e) { console.error(e); }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedGroupUsers.length === 0) return;
    try {
      const result = await createChat({ groupName: groupName.trim(), participantIds: selectedGroupUsers }).unwrap();
      if (result.data) setSelectedChat(result.data);
      setNewGroupOpen(false);
      setGroupName('');
      setSelectedGroupUsers([]);
      setUserQuery('');
    } catch (e) { console.error(e); }
  };

  const sidebarContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sidebar Header */}
      <Box sx={{ px: 2, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="h6" fontWeight={800}>Messages</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="New group">
              <IconButton size="small" onClick={() => setNewGroupOpen(true)}><GroupAdd fontSize="small" /></IconButton>
            </Tooltip>
            <Tooltip title="New message">
              <IconButton size="small" onClick={() => setNewChatOpen(true)}><Edit fontSize="small" /></IconButton>
            </Tooltip>
          </Box>
        </Box>
        <TextField
          size="small"
          fullWidth
          placeholder="Search conversations…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              '& fieldset': { borderColor: 'transparent' },
              '&.Mui-focused fieldset': { borderColor: 'primary.main' },
            },
          }}
        />
      </Box>

      {/* Chat List */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.disabled" variant="body2">Loading…</Typography>
          </Box>
        ) : chats.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.disabled" variant="body2" gutterBottom>
              {searchTerm ? 'No conversations found' : 'No messages yet'}
            </Typography>
            {!searchTerm && (
              <Button variant="outlined" size="small" sx={{ mt: 1, borderRadius: '20px' }} onClick={() => setNewChatOpen(true)}>
                Start a conversation
              </Button>
            )}
          </Box>
        ) : (
          <List disablePadding>
            {chats.map((chat: Chat, i: number) => (
              <React.Fragment key={chat._id || chat.id || i}>
                <ChatListItem
                  chat={chat}
                  isSelected={(selectedChat?._id || selectedChat?.id) === (chat._id || chat.id)}
                  currentUserId={currentUserId}
                  onSelect={handleSelectChat}
                />
                {i < chats.length - 1 && <Divider sx={{ mx: 2 }} />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );

  const selectedChatId = selectedChat?._id || selectedChat?.id || '';

  // Mobile view
  if (isMobile) {
    return (
      <Box sx={{ height: 'calc(100vh - 120px)' }}>
        {selectedChat ? (
          <Paper sx={{ height: '100%', overflow: 'hidden', borderRadius: '16px' }}>
            {/* Key by chatId to fully reset ChatRoom state on chat switch */}
            <ChatRoom key={selectedChatId} chat={selectedChat} onBack={handleBack} isMobile />
          </Paper>
        ) : (
          <Paper sx={{ height: '100%', overflow: 'hidden', borderRadius: '16px' }}>
            {sidebarContent}
          </Paper>
        )}
      </Box>
    );
  }

  // Desktop view
  return (
    <Box sx={{ height: 'calc(100vh - 120px)' }}>
      <Paper
        sx={{
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Sidebar */}
        <Box
          sx={{
            width: 320,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {sidebarContent}
        </Box>

        {/* Chat Area */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {selectedChat ? (
            /* Key by chatId so ChatRoom fully remounts on chat switch — clears localMessages */
            <ChatRoom key={selectedChatId} chat={selectedChat} />
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                color: 'text.disabled',
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '24px',
                  background: 'rgba(99,102,241,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Edit sx={{ fontSize: 36, color: '#6366f1' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="text.secondary">
                Your Messages
              </Typography>
              <Typography variant="body2" color="text.disabled" textAlign="center" maxWidth={260}>
                Select a conversation from the list or start a new one
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* New Direct Chat Dialog */}
      <Dialog open={newChatOpen} onClose={() => { setNewChatOpen(false); setUserQuery(''); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>New Conversation</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search people by name…"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            autoFocus
            sx={{ mb: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
          />
          {isSearching && <Box sx={{ textAlign: 'center', py: 2 }}><CircularProgress size={24} /></Box>}
          {!isSearching && userQuery.trim() && usersData?.data?.length === 0 && (
            <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>No users found</Typography>
          )}
          <List dense disablePadding>
            {(usersData?.data || []).filter(u => (u._id || u.id) !== currentUserId).map((u: User) => (
              <ListItemButton key={u._id || u.id} onClick={() => handleStartDirect(u)} sx={{ borderRadius: '8px' }} disabled={isCreatingChat}>
                <ListItemAvatar>
                  <Avatar src={u.avatar} sx={{ width: 36, height: 36, fontSize: '0.875rem' }}>
                    {u.firstName?.[0]}{u.lastName?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={`${u.firstName} ${u.lastName}`.trim()} secondary={u.role} />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => { setNewChatOpen(false); setUserQuery(''); }} size="small">Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* New Group Dialog */}
      <Dialog open={newGroupOpen} onClose={() => { setNewGroupOpen(false); setUserQuery(''); setGroupName(''); setSelectedGroupUsers([]); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>New Group Chat</DialogTitle>
        <DialogContent sx={{ pt: '8px !important', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField
            fullWidth size="small" label="Group Name" value={groupName}
            onChange={(e) => setGroupName(e.target.value)} required
          />
          <TextField
            fullWidth size="small" placeholder="Search members…"
            value={userQuery} onChange={(e) => setUserQuery(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
          />
          {selectedGroupUsers.length > 0 && (
            <Typography variant="caption" color="text.secondary">{selectedGroupUsers.length} member(s) selected</Typography>
          )}
          <List dense disablePadding sx={{ maxHeight: 200, overflowY: 'auto' }}>
            {(usersData?.data || []).filter(u => (u._id || u.id) !== currentUserId).map((u: User) => {
              const uid = u._id || u.id || '';
              const checked = selectedGroupUsers.includes(uid);
              return (
                <ListItemButton key={uid} dense onClick={() => setSelectedGroupUsers(prev => checked ? prev.filter(id => id !== uid) : [...prev, uid])} sx={{ borderRadius: '8px' }}>
                  <Checkbox size="small" checked={checked} sx={{ p: 0.5, mr: 1 }} />
                  <ListItemAvatar><Avatar src={u.avatar} sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>{u.firstName?.[0]}</Avatar></ListItemAvatar>
                  <ListItemText primary={`${u.firstName} ${u.lastName}`.trim()} secondary={u.role} primaryTypographyProps={{ variant: 'body2' }} />
                </ListItemButton>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
          <Button size="small" onClick={() => { setNewGroupOpen(false); setUserQuery(''); setGroupName(''); setSelectedGroupUsers([]); }}>Cancel</Button>
          <Button size="small" variant="contained" onClick={handleCreateGroup} disabled={isCreatingChat || !groupName.trim() || selectedGroupUsers.length === 0}>
            {isCreatingChat ? 'Creating…' : 'Create Group'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessagesPage;
