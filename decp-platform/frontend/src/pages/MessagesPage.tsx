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
import { Search, Edit, GroupAdd, Message as MessageIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useGetChatsQuery } from '@services/chatApi';
import { useSearchUsersQuery } from '@services/userApi';
import { useCreateChatMutation } from '@services/chatApi';
import { ChatRoom } from '@components/messaging/ChatRoom';
import { Chat, User } from '@types';
import { formatRelativeTime } from '@utils';
import { useSocket } from '@hooks';

// ─── Avatar gradient helpers ───────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #6366f1, #818cf8)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #14b8a6, #06b6d4)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #3b82f6, #6366f1)',
  'linear-gradient(135deg, #059669, #14b8a6)',
  'linear-gradient(135deg, #f97316, #ef4444)',
];

function getAvatarGradient(name: string): string {
  if (!name) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

// ─── ChatListItem ──────────────────────────────────────────────────────────────

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
  const hasUnread = (chat.unreadCount || 0) > 0;
  const avatarGradient = getAvatarGradient(displayName);

  return (
    <ListItemButton
      onClick={() => onSelect(chat)}
      selected={isSelected}
      sx={{
        py: 1.75,
        px: 2,
        gap: 1.5,
        borderRadius: 0,
        position: 'relative',
        transition: 'all 0.2s ease',
        '&.Mui-selected': {
          background: 'linear-gradient(90deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)',
          borderLeft: '3px solid #10b981',
          '& .chat-name': { color: '#059669' },
          '&:hover': {
            background: 'linear-gradient(90deg, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.07) 100%)',
          },
        },
        '&:not(.Mui-selected)': {
          borderLeft: '3px solid transparent',
        },
        '&:hover:not(.Mui-selected)': {
          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        },
      }}
    >
      <Badge
        badgeContent={chat.unreadCount || 0}
        color="primary"
        max={9}
        sx={{
          '& .MuiBadge-badge': {
            fontSize: '0.6rem',
            minWidth: 17,
            height: 17,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: '0 2px 6px rgba(16,185,129,0.4)',
          },
        }}
      >
        <Avatar
          src={chat.isGroup ? chat.groupAvatar : otherParticipant?.avatar}
          sx={{
            width: 46,
            height: 46,
            background: avatarGradient,
            fontSize: '1rem',
            fontWeight: 700,
            boxShadow: isSelected ? '0 0 0 2px #10b981, 0 0 12px rgba(16,185,129,0.3)' : 'none',
            transition: 'box-shadow 0.2s ease',
          }}
        >
          {displayName[0]?.toUpperCase()}
        </Avatar>
      </Badge>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
          <Typography
            className="chat-name"
            variant="body2"
            fontWeight={hasUnread ? 800 : 700}
            noWrap
            sx={{
              flex: 1,
              mr: 1,
              transition: 'color 0.2s',
            }}
          >
            {displayName}
          </Typography>
          {lastMsgTime && (
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.63rem',
                flexShrink: 0,
                color: hasUnread ? '#10b981' : 'text.disabled',
                fontWeight: hasUnread ? 700 : 400,
              }}
            >
              {formatRelativeTime(lastMsgTime)}
            </Typography>
          )}
        </Box>
        <Typography
          variant="caption"
          noWrap
          sx={{
            display: 'block',
            fontWeight: hasUnread ? 600 : 400,
            color: hasUnread ? 'text.primary' : 'text.secondary',
            opacity: hasUnread ? 1 : 0.7,
          }}
        >
          {lastMsgText}
        </Typography>
      </Box>
    </ListItemButton>
  );
};

// ─── MessagesPage ──────────────────────────────────────────────────────────────

export const MessagesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: chatsData, isLoading, refetch: refetchChats } = useGetChatsQuery(undefined, {
    pollingInterval: 10000,
  });

  // Refetch chat list in real-time when any new message arrives on this user's room
  const { onNewMessage } = useSocket();
  React.useEffect(() => {
    const unsubscribe = onNewMessage(() => {
      refetchChats();
    });
    return unsubscribe;
  }, [onNewMessage, refetchChats]);

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<string[]>([]);
  const [createChat, { isLoading: isCreatingChat }] = useCreateChatMutation();
  // useSearchUsersQuery: when q is empty it returns ALL profiles (no firstName filter),
  // which is better than getUsers which skips users with empty firstName.
  const { data: usersData, isFetching: isSearching } = useSearchUsersQuery(
    { q: userQuery.trim() },
    { skip: !newChatOpen && !newGroupOpen }
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
      <Box
        sx={{
          px: 2,
          pt: 2.5,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          background: (t) =>
            t.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(16,185,129,0.04) 0%, transparent 100%)'
              : 'linear-gradient(180deg, rgba(16,185,129,0.03) 0%, transparent 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          {/* Gradient "Messages" text */}
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #14b8a6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
              fontSize: '1.25rem',
            }}
          >
            Messages
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="New group">
              <IconButton
                size="small"
                onClick={() => setNewGroupOpen(true)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: '#10b981', bgcolor: 'rgba(16,185,129,0.08)' },
                  transition: 'all 0.2s',
                }}
              >
                <GroupAdd fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="New message">
              <IconButton
                size="small"
                onClick={() => setNewChatOpen(true)}
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: '#10b981', bgcolor: 'rgba(16,185,129,0.08)' },
                  transition: 'all 0.2s',
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
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
              '&.Mui-focused fieldset': { borderColor: '#10b981' },
              '&:hover fieldset': { borderColor: 'rgba(16,185,129,0.3)' },
            },
          }}
        />
      </Box>

      {/* Chat List */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress size={24} sx={{ color: '#10b981' }} />
          </Box>
        ) : chats.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '15px',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(20,184,166,0.08))',
                border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <MessageIcon sx={{ fontSize: 24, color: '#10b981' }} />
            </Box>
            <Typography color="text.secondary" variant="body2" fontWeight={600} gutterBottom>
              {searchTerm ? 'No conversations found' : 'No messages yet'}
            </Typography>
            {!searchTerm && (
              <Button
                variant="outlined"
                size="small"
                sx={{
                  mt: 1,
                  borderRadius: '20px',
                  borderColor: '#10b981',
                  color: '#10b981',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'rgba(16,185,129,0.08)', borderColor: '#059669' },
                }}
                onClick={() => setNewChatOpen(true)}
              >
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
                {i < chats.length - 1 && <Divider sx={{ mx: 2, opacity: 0.5 }} />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );

  const selectedChatId = selectedChat?._id || selectedChat?.id || '';

  // Mobile view — use 100svh (small viewport height) to stay within browser chrome
  if (isMobile) {
    return (
      <Box sx={{ height: 'calc(100svh - 156px)' }}>
        {selectedChat ? (
          <Paper sx={{ height: '100%', overflow: 'hidden', borderRadius: '16px' }}>
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
    <Box sx={{ height: 'calc(100vh - 108px)' }}>
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
            <ChatRoom key={selectedChatId} chat={selectedChat} />
          ) : (
            // Attractive empty state
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2.5,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Background glow blobs */}
              <Box sx={{ position: 'absolute', top: '20%', left: '30%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
              <Box sx={{ position: 'absolute', bottom: '25%', right: '25%', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', filter: 'blur(35px)', pointerEvents: 'none' }} />

              {/* Gradient icon container */}
              <Box
                sx={{
                  width: 88,
                  height: 88,
                  borderRadius: '26px',
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(20,184,166,0.1) 50%, rgba(99,102,241,0.1) 100%)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  boxShadow: '0 0 40px rgba(16,185,129,0.12), inset 0 1px 1px rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <MessageIcon
                  sx={{
                    fontSize: 40,
                    background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                />
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.02em',
                    mb: 0.75,
                  }}
                >
                  Your Messages
                </Typography>
                <Typography variant="body2" color="text.disabled" textAlign="center" maxWidth={240} sx={{ lineHeight: 1.6 }}>
                  Select a conversation from the list or start a new one
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="small"
                startIcon={<Edit sx={{ fontSize: '16px !important' }} />}
                onClick={() => setNewChatOpen(true)}
                sx={{
                  borderRadius: '20px',
                  borderColor: '#10b981',
                  color: '#10b981',
                  fontWeight: 600,
                  px: 2.5,
                  '&:hover': { bgcolor: 'rgba(16,185,129,0.08)', borderColor: '#059669' },
                }}
              >
                New Message
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* New Direct Chat Dialog */}
      <Dialog
        open={newChatOpen}
        onClose={() => { setNewChatOpen(false); setUserQuery(''); }}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : '20px',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            pb: 1,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(20,184,166,0.04))',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          New Conversation
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search people by name…"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            autoFocus
            sx={{
              mb: 1.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&.Mui-focused fieldset': { borderColor: '#10b981' },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
          {isSearching && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CircularProgress size={24} sx={{ color: '#10b981' }} />
            </Box>
          )}
          {!isSearching && (usersData?.data || []).filter((u: User) => (u._id || u.id) !== currentUserId).length === 0 && (
            <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
              {isSearching ? '' : userQuery.trim() ? 'No users found' : 'No users available'}
            </Typography>
          )}
          <List dense disablePadding>
            {(usersData?.data || []).filter((u: User) => (u._id || u.id) !== currentUserId).map((u: User) => {
              const uName =
                `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
                u.email?.split('@')[0]?.replace(/[._]/g, ' ') ||
                'User';
              return (
                <ListItemButton
                  key={u._id || u.id}
                  onClick={() => handleStartDirect(u)}
                  sx={{
                    borderRadius: '10px',
                    mb: 0.5,
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: 'rgba(16,185,129,0.07)' },
                  }}
                  disabled={isCreatingChat}
                >
                  <ListItemAvatar>
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <Avatar
                        src={u.avatar}
                        sx={{
                          width: 38,
                          height: 38,
                          fontSize: '0.875rem',
                          background: getAvatarGradient(uName),
                          fontWeight: 700,
                        }}
                      >
                        {(u.firstName?.[0] || u.email?.[0] || 'U').toUpperCase()}
                        {u.lastName?.[0]?.toUpperCase()}
                      </Avatar>
                      {/* Online indicator dot */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 1,
                          right: 1,
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          bgcolor: '#10b981',
                          border: '2px solid white',
                          boxShadow: '0 0 4px rgba(16,185,129,0.5)',
                        }}
                      />
                    </Box>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600}>{uName}</Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {u.role}{u.email ? ` · ${u.email}` : ''}
                      </Typography>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
          <Button
            onClick={() => { setNewChatOpen(false); setUserQuery(''); }}
            size="small"
            sx={{ borderRadius: '20px', color: 'text.secondary' }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Group Dialog */}
      <Dialog
        open={newGroupOpen}
        onClose={() => { setNewGroupOpen(false); setUserQuery(''); setGroupName(''); setSelectedGroupUsers([]); }}
        maxWidth="xs"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : '20px',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            pb: 1,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(20,184,166,0.04))',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          New Group Chat
        </DialogTitle>
        <DialogContent
          sx={{
            pt: '16px !important',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <TextField
            fullWidth
            size="small"
            label="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&.Mui-focused fieldset': { borderColor: '#10b981' },
              },
              '& label.Mui-focused': { color: '#10b981' },
            }}
          />
          <TextField
            fullWidth
            size="small"
            placeholder="Search members…"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&.Mui-focused fieldset': { borderColor: '#10b981' },
              },
            }}
          />
          {selectedGroupUsers.length > 0 && (
            <Typography
              variant="caption"
              sx={{
                color: '#059669',
                fontWeight: 600,
                bgcolor: 'rgba(16,185,129,0.08)',
                px: 1.5,
                py: 0.5,
                borderRadius: '8px',
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              {selectedGroupUsers.length} member{selectedGroupUsers.length > 1 ? 's' : ''} selected
            </Typography>
          )}
          <List dense disablePadding sx={{ maxHeight: 200, overflowY: 'auto' }}>
            {(usersData?.data || []).filter((u: User) => (u._id || u.id) !== currentUserId).map((u: User) => {
              const uid = u._id || u.id || '';
              const checked = selectedGroupUsers.includes(uid);
              const uName =
                `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
                u.email?.split('@')[0]?.replace(/[._]/g, ' ') ||
                'User';
              return (
                <ListItemButton
                  key={uid}
                  dense
                  onClick={() =>
                    setSelectedGroupUsers((prev) =>
                      checked ? prev.filter((id) => id !== uid) : [...prev, uid]
                    )
                  }
                  sx={{
                    borderRadius: '10px',
                    mb: 0.5,
                    bgcolor: checked ? 'rgba(16,185,129,0.08)' : 'transparent',
                    border: '1px solid',
                    borderColor: checked ? 'rgba(16,185,129,0.25)' : 'transparent',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: checked ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.03)' },
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={checked}
                    sx={{
                      p: 0.5,
                      mr: 1,
                      color: 'text.disabled',
                      '&.Mui-checked': { color: '#10b981' },
                    }}
                  />
                  <ListItemAvatar>
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <Avatar
                        src={u.avatar}
                        sx={{
                          width: 30,
                          height: 30,
                          fontSize: '0.75rem',
                          background: getAvatarGradient(uName),
                          fontWeight: 700,
                        }}
                      >
                        {u.firstName?.[0]}
                      </Avatar>
                      {/* Online indicator dot */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#10b981',
                          border: '1.5px solid white',
                          boxShadow: '0 0 4px rgba(16,185,129,0.5)',
                        }}
                      />
                    </Box>
                  </ListItemAvatar>
                  <ListItemText
                    primary={uName}
                    secondary={u.role}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: checked ? 700 : 500 }}
                    secondaryTypographyProps={{ sx: { textTransform: 'capitalize' } }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, borderTop: '1px solid', borderColor: 'divider', pt: 1.5, gap: 1 }}>
          <Button
            size="small"
            onClick={() => { setNewGroupOpen(false); setUserQuery(''); setGroupName(''); setSelectedGroupUsers([]); }}
            sx={{ borderRadius: '20px', color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleCreateGroup}
            disabled={isCreatingChat || !groupName.trim() || selectedGroupUsers.length === 0}
            sx={{
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              fontWeight: 700,
              px: 2.5,
              boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669, #047857)',
                boxShadow: '0 6px 16px rgba(16,185,129,0.45)',
              },
              '&:disabled': { opacity: 0.5 },
            }}
          >
            {isCreatingChat ? 'Creating…' : 'Create Group'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessagesPage;
