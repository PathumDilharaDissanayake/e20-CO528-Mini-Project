import React, { useState, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Switch,
    FormControlLabel,
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
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@store';
import { toggleTheme } from '@features/themeSlice';
import { useUpdateMyProfileMutation, useUploadProfilePictureMutation } from '@services/userApi';
import { addToast } from '@features/uiSlice';
import { updateUser } from '@features/authSlice';

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
        <Box className="page-enter max-w-4xl mx-auto">
            {/* Header */}
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
                <Box
                    className="absolute inset-0 opacity-15"
                    sx={{
                        backgroundImage: `radial-gradient(circle at 18px 18px, rgba(255,255,255,0.4) 1.5px, transparent 0)`,
                        backgroundSize: '30px 30px',
                    }}
                />
                <Box className="relative p-6">
                    <Box className="flex items-center gap-3">
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '14px',
                                background: 'rgba(129,140,248,0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Palette sx={{ color: '#a5b4fc', fontSize: 26 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
                                Settings
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                Manage your account preferences and privacy
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* Profile Picture */}
            <Card elevation={0} sx={{ borderRadius: '16px', mb: 3 }}>
                <CardContent>
                    <Box className="flex items-center gap-2 mb-4">
                        <Person sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight={600}>
                            Profile Picture
                        </Typography>
                    </Box>

                    <Box className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Box sx={{ position: 'relative' }}>
                            <Avatar
                                src={user?.avatar || user?.profilePicture}
                                sx={{ width: 100, height: 100, fontSize: '3rem' }}
                            >
                                {user?.firstName?.[0]}
                            </Avatar>
                            <Box
                                onClick={handleAvatarClick}
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    backgroundColor: 'primary.main',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'primary.dark' }
                                }}
                            >
                                {isUploading ? (
                                    <CircularProgress size={20} color="inherit" />
                                ) : (
                                    <PhotoCamera sx={{ fontSize: 20 }} />
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
                            <Typography variant="body1" fontWeight={500}>
                                {user?.firstName} {user?.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Click the camera icon to upload a new profile picture
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Appearance */}
            <Card elevation={0} sx={{ borderRadius: '16px', mb: 3 }}>
                <CardContent>
                    <Box className="flex items-center gap-2 mb-4">
                        <DarkMode sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight={600}>
                            Appearance
                        </Typography>
                    </Box>

                    <Box className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Box className="flex items-center gap-3">
                            {mode === 'dark' ? <DarkMode /> : <LightMode />}
                            <Box>
                                <Typography variant="body1" fontWeight={500}>
                                    Dark Mode
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {mode === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
                                </Typography>
                            </Box>
                        </Box>
                        <Switch
                            checked={mode === 'dark'}
                            onChange={handleThemeToggle}
                            color="primary"
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card elevation={0} sx={{ borderRadius: '16px', mb: 3 }}>
                <CardContent>
                    <Box className="flex items-center gap-2 mb-4">
                        <Notifications sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight={600}>
                            Notifications
                        </Typography>
                    </Box>

                    <Box className="space-y-3">
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={notifications.email}
                                    onChange={() => handleNotificationChange('email')}
                                    color="primary"
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1">Email Notifications</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Receive notifications via email
                                    </Typography>
                                </Box>
                            }
                            sx={{ alignItems: 'flex-start', ml: 0 }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={notifications.push}
                                    onChange={() => handleNotificationChange('push')}
                                    color="primary"
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1">Push Notifications</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Receive push notifications on your device
                                    </Typography>
                                </Box>
                            }
                            sx={{ alignItems: 'flex-start', ml: 0 }}
                        />

                        <Divider />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={notifications.connections}
                                    onChange={() => handleNotificationChange('connections')}
                                    color="primary"
                                />
                            }
                            label="Connection requests"
                            sx={{ ml: 0 }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={notifications.messages}
                                    onChange={() => handleNotificationChange('messages')}
                                    color="primary"
                                />
                            }
                            label="Messages"
                            sx={{ ml: 0 }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={notifications.jobs}
                                    onChange={() => handleNotificationChange('jobs')}
                                    color="primary"
                                />
                            }
                            label="Job alerts"
                            sx={{ ml: 0 }}
                        />
                    </Box>

                    <Box className="mt-4">
                        <Button
                            variant="contained"
                            startIcon={isLoading ? <CircularProgress size={16} /> : <Save />}
                            onClick={handleSaveNotifications}
                            disabled={isLoading}
                        >
                            Save Notification Settings
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Privacy */}
            <Card elevation={0} sx={{ borderRadius: '16px', mb: 3 }}>
                <CardContent>
                    <Box className="flex items-center gap-2 mb-4">
                        <Lock sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight={600}>
                            Privacy
                        </Typography>
                    </Box>

                    <Box className="space-y-3">
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={privacy.profileVisible}
                                    onChange={() => handlePrivacyChange('profileVisible')}
                                    color="primary"
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1">Profile Visibility</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Allow others to view your profile
                                    </Typography>
                                </Box>
                            }
                            sx={{ alignItems: 'flex-start', ml: 0 }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={privacy.showEmail}
                                    onChange={() => handlePrivacyChange('showEmail')}
                                    color="primary"
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1">Show Email</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Display your email on your profile
                                    </Typography>
                                </Box>
                            }
                            sx={{ alignItems: 'flex-start', ml: 0 }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={privacy.showConnections}
                                    onChange={() => handlePrivacyChange('showConnections')}
                                    color="primary"
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body1">Show Connections</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Allow others to see your connections
                                    </Typography>
                                </Box>
                            }
                            sx={{ alignItems: 'flex-start', ml: 0 }}
                        />
                    </Box>

                    <Box className="mt-4">
                        <Button
                            variant="contained"
                            startIcon={isLoading ? <CircularProgress size={16} /> : <Save />}
                            onClick={handleSavePrivacy}
                            disabled={isLoading}
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
