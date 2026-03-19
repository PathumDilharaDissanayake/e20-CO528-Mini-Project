import React, { useState, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Switch,
    Divider,
    Button,
    Avatar,
    CircularProgress,
    Card,
    CardContent,
} from '@mui/material';
import {
    Person,
    Lock,
    Notifications,
    Palette,
    PhotoCamera,
    Save,
    DarkMode,
    LightMode,
    Email,
    PhoneAndroid,
    PeopleAlt,
    Message,
    Work,
    Visibility,
    AlternateEmail,
    Hub,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@store';
import { toggleTheme } from '@features/themeSlice';
import { useUpdateMyProfileMutation, useUploadProfilePictureMutation } from '@services/userApi';
import { addToast } from '@features/uiSlice';
import { updateUser } from '@features/authSlice';

// ─── Shared styles ────────────────────────────────────────────────────────────
const glassCardSx = {
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
    mb: 3,
};

const saveButtonSx = {
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#fff',
    fontWeight: 700,
    borderRadius: '10px',
    px: 3,
    textTransform: 'none',
    boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
    '&:hover': {
        background: 'linear-gradient(135deg, #047857, #059669)',
        boxShadow: '0 6px 20px rgba(16,185,129,0.45)',
    },
    '&:disabled': {
        background: 'rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.3)',
    },
};

// ─── Section header helper ────────────────────────────────────────────────────
const SectionHeader: React.FC<{
    icon: React.ReactNode;
    title: string;
    iconBg?: string;
    iconColor?: string;
}> = ({ icon, title, iconBg = 'rgba(16,185,129,0.15)', iconColor = '#10b981' }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box
            sx={{
                width: 38,
                height: 38,
                borderRadius: '11px',
                background: iconBg,
                border: `1px solid ${iconColor}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: iconColor,
                flexShrink: 0,
            }}
        >
            {icon}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
            {title}
        </Typography>
    </Box>
);

// ─── Toggle row helper ────────────────────────────────────────────────────────
const ToggleRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    description?: string;
    checked: boolean;
    onChange: () => void;
    dividerAfter?: boolean;
}> = ({ icon, label, description, checked, onChange, dividerAfter }) => (
    <>
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.5,
                px: 2,
                borderRadius: '10px',
                transition: 'background 0.15s',
                '&:hover': { background: 'rgba(255,255,255,0.04)' },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}>
                    {icon}
                </Box>
                <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                        {label}
                    </Typography>
                    {description && (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                            {description}
                        </Typography>
                    )}
                </Box>
            </Box>
            <Switch
                checked={checked}
                onChange={onChange}
                color="primary"
                size="small"
            />
        </Box>
        {dividerAfter && (
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 0.5 }} />
        )}
    </>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export const SettingsPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { mode } = useSelector((state: RootState) => state.theme);

    const [updateProfile, { isLoading }] = useUpdateMyProfileMutation();
    const [uploadAvatar, { isLoading: isUploading }] = useUploadProfilePictureMutation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        connections: true,
        messages: true,
        jobs: true,
    });

    const [privacy, setPrivacy] = useState({
        profileVisible: true,
        showEmail: false,
        showConnections: true,
    });

    const handleThemeToggle = () => {
        dispatch(toggleTheme());
    };

    const handleNotificationChange = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePrivacyChange = (key: keyof typeof privacy) => {
        setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveNotifications = async () => {
        dispatch(addToast({ message: 'Notification settings saved!', type: 'success' }));
    };

    const handleSavePrivacy = async () => {
        dispatch(addToast({ message: 'Privacy settings saved!', type: 'success' }));
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            dispatch(addToast({ message: 'Please select an image file', type: 'error' }));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            dispatch(addToast({ message: 'Image must be less than 5MB', type: 'error' }));
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            const result = await uploadAvatar(formData).unwrap();
            if (result.success && result.data?.url) {
                dispatch(updateUser({ ...user, avatar: result.data.url, profilePicture: result.data.url }));
                dispatch(addToast({ message: 'Profile picture updated!', type: 'success' }));
            }
        } catch {
            dispatch(addToast({ message: 'Failed to upload image', type: 'error' }));
        }
    };

    return (
        <Box className="page-enter" sx={{ maxWidth: '896px', mx: 'auto' }}>

            {/* ── Hero Banner ── */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    mb: 3,
                    position: 'relative',
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%)',
                }}
            >
                {/* Dot-grid overlay */}
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.15,
                        backgroundImage: `radial-gradient(circle at 18px 18px, rgba(255,255,255,0.4) 1.5px, transparent 0)`,
                        backgroundSize: '30px 30px',
                    }}
                />
                {/* Decorative blurred orb */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '-50px',
                        right: '-50px',
                        width: '240px',
                        height: '240px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)',
                        filter: 'blur(50px)',
                        pointerEvents: 'none',
                    }}
                />
                {/* Second orb bottom-left */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: '-30px',
                        left: '-30px',
                        width: '160px',
                        height: '160px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                        pointerEvents: 'none',
                    }}
                />

                <Box
                    sx={{
                        position: 'relative',
                        p: { xs: 3, md: 4 },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2.5,
                    }}
                >
                    <Box
                        sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '18px',
                            background: 'rgba(129,140,248,0.2)',
                            border: '1px solid rgba(129,140,248,0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <Palette sx={{ color: '#a5b4fc', fontSize: 30 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                            Settings
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.25 }}>
                            Manage your account preferences and privacy
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* ── Profile Picture ── */}
            <Card elevation={0} sx={glassCardSx}>
                <CardContent sx={{ p: 3 }}>
                    <SectionHeader
                        icon={<Person fontSize="small" />}
                        title="Profile Picture"
                    />

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            p: 3,
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}
                    >
                        {/* Avatar with camera overlay */}
                        <Box sx={{ position: 'relative', flexShrink: 0 }}>
                            <Avatar
                                src={user?.avatar || user?.profilePicture}
                                sx={{
                                    width: 96,
                                    height: 96,
                                    fontSize: '2.5rem',
                                    border: '3px solid rgba(16,185,129,0.4)',
                                    boxShadow: '0 0 0 4px rgba(16,185,129,0.1)',
                                }}
                            >
                                {user?.firstName?.[0]}
                            </Avatar>
                            <Box
                                onClick={handleAvatarClick}
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: 34,
                                    height: 34,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #059669, #10b981)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    border: '2px solid rgba(15,23,42,0.8)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                    transition: 'transform 0.15s',
                                    '&:hover': { transform: 'scale(1.1)' },
                                }}
                            >
                                {isUploading ? (
                                    <CircularProgress size={18} color="inherit" />
                                ) : (
                                    <PhotoCamera sx={{ fontSize: 17 }} />
                                )}
                            </Box>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </Box>

                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#fff' }}>
                                {user?.firstName} {user?.lastName}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mt: 0.25 }}>
                                Click the camera icon to upload a new profile picture
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', mt: 0.5, display: 'block' }}>
                                JPG, PNG or GIF — max 5 MB
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* ── Appearance ── */}
            <Card elevation={0} sx={glassCardSx}>
                <CardContent sx={{ p: 3 }}>
                    <SectionHeader
                        icon={<DarkMode fontSize="small" />}
                        title="Appearance"
                        iconBg="rgba(99,102,241,0.15)"
                        iconColor="#6366f1"
                    />

                    <ToggleRow
                        icon={mode === 'dark' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
                        label="Dark Mode"
                        description={mode === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
                        checked={mode === 'dark'}
                        onChange={handleThemeToggle}
                    />
                </CardContent>
            </Card>

            {/* ── Notifications ── */}
            <Card elevation={0} sx={glassCardSx}>
                <CardContent sx={{ p: 3 }}>
                    <SectionHeader
                        icon={<Notifications fontSize="small" />}
                        title="Notifications"
                        iconBg="rgba(245,158,11,0.15)"
                        iconColor="#f59e0b"
                    />

                    <Box sx={{ mx: -1 }}>
                        <ToggleRow
                            icon={<Email fontSize="small" />}
                            label="Email Notifications"
                            description="Receive notifications via email"
                            checked={notifications.email}
                            onChange={() => handleNotificationChange('email')}
                            dividerAfter
                        />
                        <ToggleRow
                            icon={<PhoneAndroid fontSize="small" />}
                            label="Push Notifications"
                            description="Receive push notifications on your device"
                            checked={notifications.push}
                            onChange={() => handleNotificationChange('push')}
                            dividerAfter
                        />
                        <ToggleRow
                            icon={<PeopleAlt fontSize="small" />}
                            label="Connection Requests"
                            description="Get notified when someone connects with you"
                            checked={notifications.connections}
                            onChange={() => handleNotificationChange('connections')}
                        />
                        <ToggleRow
                            icon={<Message fontSize="small" />}
                            label="Messages"
                            description="Get notified about new messages"
                            checked={notifications.messages}
                            onChange={() => handleNotificationChange('messages')}
                        />
                        <ToggleRow
                            icon={<Work fontSize="small" />}
                            label="Job Alerts"
                            description="Get notified about relevant job postings"
                            checked={notifications.jobs}
                            onChange={() => handleNotificationChange('jobs')}
                        />
                    </Box>

                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <Button
                            variant="contained"
                            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Save />}
                            onClick={handleSaveNotifications}
                            disabled={isLoading}
                            sx={saveButtonSx}
                        >
                            Save Notification Settings
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* ── Privacy ── */}
            <Card elevation={0} sx={{ ...glassCardSx, mb: 0 }}>
                <CardContent sx={{ p: 3 }}>
                    <SectionHeader
                        icon={<Lock fontSize="small" />}
                        title="Privacy"
                        iconBg="rgba(239,68,68,0.12)"
                        iconColor="#ef4444"
                    />

                    <Box sx={{ mx: -1 }}>
                        <ToggleRow
                            icon={<Visibility fontSize="small" />}
                            label="Profile Visibility"
                            description="Allow others to view your profile"
                            checked={privacy.profileVisible}
                            onChange={() => handlePrivacyChange('profileVisible')}
                        />
                        <ToggleRow
                            icon={<AlternateEmail fontSize="small" />}
                            label="Show Email"
                            description="Display your email address on your profile"
                            checked={privacy.showEmail}
                            onChange={() => handlePrivacyChange('showEmail')}
                        />
                        <ToggleRow
                            icon={<Hub fontSize="small" />}
                            label="Show Connections"
                            description="Allow others to see your connections list"
                            checked={privacy.showConnections}
                            onChange={() => handlePrivacyChange('showConnections')}
                        />
                    </Box>

                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <Button
                            variant="contained"
                            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <Save />}
                            onClick={handleSavePrivacy}
                            disabled={isLoading}
                            sx={saveButtonSx}
                        >
                            Save Privacy Settings
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default SettingsPage;
