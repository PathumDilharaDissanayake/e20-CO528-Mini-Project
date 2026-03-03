import React, { useRef } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Button,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Edit,
  CameraAlt,
  LocationOn,
  School,
  LinkedIn,
  GitHub,
  Twitter,
  PersonAdd,
  CheckCircle,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useUploadAvatarMutation } from '@services/authApi';
import { User } from '@types';
import { updateUser } from '@features/authSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@store';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
}

const roleGradients: Record<string, string> = {
  admin: 'linear-gradient(135deg, #ef4444, #dc2626)',
  faculty: 'linear-gradient(135deg, #059669, #10b981)',
  alumni: 'linear-gradient(135deg, #d97706, #f59e0b)',
  student: 'linear-gradient(135deg, #6366f1, #818cf8)',
};

const coverGradients: Record<string, string> = {
  admin: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #450a0a 100%)',
  faculty: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #022c22 100%)',
  alumni: 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #451a03 100%)',
  student: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0c0a1e 100%)',
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, isOwnProfile }) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadAvatar] = useUploadAvatarMutation();

  const safeFirstName = user.firstName || 'User';
  const safeLastName = user.lastName || '';
  const safeRole = user.role || 'student';
  const safeConnections = Array.isArray(user.connections) ? user.connections.length : 0;
  const safeSkills = Array.isArray(user.skills) ? user.skills : [];
  const coverGrad = coverGradients[safeRole] || coverGradients.student;
  const roleGrad = roleGradients[safeRole] || roleGradients.student;

  const handleAvatarClick = () => {
    if (isOwnProfile && fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      if (currentUser) dispatch(updateUser({ avatar: localUrl }));
      const formData = new FormData();
      formData.append('avatar', file);
      try {
        const response = await uploadAvatar(formData).unwrap();
        if (currentUser) dispatch(updateUser({ avatar: response.data.url }));
      } catch {
        // Keep local preview
      }
    }
  };

  return (
    <Box className="relative">
      {/* Cover */}
      <Box
        sx={{
          height: { xs: 140, sm: 180 },
          background: coverGrad,
          borderRadius: '16px 16px 0 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Dot pattern */}
        <Box
          className="absolute inset-0 opacity-20"
          sx={{ backgroundImage: `radial-gradient(circle at 20px 20px, rgba(255,255,255,0.3) 1.5px, transparent 0)`, backgroundSize: '30px 30px' }}
        />
        {/* Gradient orb */}
        <Box
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
          sx={{ background: 'rgba(255,255,255,0.2)', filter: 'blur(20px)' }}
        />
      </Box>

      {/* Avatar + Info */}
      <Box sx={{ px: { xs: 2, sm: 4 }, pb: 3 }}>
        <Box className="flex flex-col sm:flex-row items-start sm:items-end gap-3" sx={{ mt: { xs: -8, sm: -10 } }}>
          {/* Avatar */}
          <Box className="relative flex-shrink-0">
            <Avatar
              src={user.avatar || user.profilePicture}
              sx={{
                width: { xs: 88, sm: 112 },
                height: { xs: 88, sm: 112 },
                border: '4px solid white',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                background: roleGrad,
                fontSize: { xs: '2rem', sm: '2.5rem' },
                fontWeight: 700,
              }}
            >
              {safeFirstName[0]}{safeLastName[0] || ''}
            </Avatar>
            {isOwnProfile && (
              <Tooltip title="Change photo">
                <IconButton
                  onClick={handleAvatarClick}
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    background: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    width: 28,
                    height: 28,
                    '&:hover': { background: '#f3f4f6' },
                  }}
                >
                  <CameraAlt sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </Box>

          {/* Name + meta */}
          <Box className="flex-1 min-w-0">
            <Box className="flex flex-wrap items-center gap-2 mb-1">
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {safeFirstName} {safeLastName}
              </Typography>
              <Box sx={{ px: 1.5, py: 0.3, borderRadius: '20px', background: roleGrad, color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>
                {safeRole.charAt(0).toUpperCase() + safeRole.slice(1)}
              </Box>
              {user.isEmailVerified && (
                <Tooltip title="Verified account">
                  <CheckCircle sx={{ fontSize: 18, color: '#10b981' }} />
                </Tooltip>
              )}
            </Box>

            {(user.headline || user.position) && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                {user.headline || user.position}
              </Typography>
            )}

            <Box className="flex flex-wrap items-center gap-3 mt-1">
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                <strong>{safeConnections}</strong> Connections
              </Typography>
              {user.location && (
                <Box className="flex items-center gap-0.5">
                  <LocationOn sx={{ fontSize: 13, color: 'text.disabled' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{user.location}</Typography>
                </Box>
              )}
              {user.department && (
                <Box className="flex items-center gap-0.5">
                  <School sx={{ fontSize: 13, color: 'text.disabled' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{user.department}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Action buttons */}
          <Box className="flex gap-2 flex-shrink-0 mt-2 sm:mt-0">
            {/* Social links */}
            {user.socialLinks?.linkedin && (
              <Tooltip title="LinkedIn">
                <IconButton size="small" component="a" href={user.socialLinks.linkedin} target="_blank" sx={{ color: '#0077b5', border: '1px solid', borderColor: 'divider', borderRadius: '8px', p: 0.75 }}>
                  <LinkedIn fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {user.socialLinks?.github && (
              <Tooltip title="GitHub">
                <IconButton size="small" component="a" href={user.socialLinks.github} target="_blank" sx={{ color: 'text.primary', border: '1px solid', borderColor: 'divider', borderRadius: '8px', p: 0.75 }}>
                  <GitHub fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {user.socialLinks?.twitter && (
              <Tooltip title="Twitter / X">
                <IconButton size="small" component="a" href={user.socialLinks.twitter} target="_blank" sx={{ color: '#1da1f2', border: '1px solid', borderColor: 'divider', borderRadius: '8px', p: 0.75 }}>
                  <Twitter fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {isOwnProfile ? (
              <Button variant="outlined" startIcon={<Edit />} size="small" sx={{ borderRadius: '10px', fontWeight: 600, borderWidth: '1.5px' }}>
                Edit Profile
              </Button>
            ) : (
              <Button variant="contained" startIcon={<PersonAdd />} size="small" sx={{ borderRadius: '10px', fontWeight: 600 }}>
                Connect
              </Button>
            )}
          </Box>
        </Box>

        {/* Bio */}
        {user.bio && (
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', lineHeight: 1.7, maxWidth: '680px' }}>
            {user.bio}
          </Typography>
        )}

        {/* Meta chips */}
        {(user.department || user.graduationYear) && (
          <Box className="flex flex-wrap gap-2 mt-3">
            {user.department && <Chip icon={<School fontSize="small" />} label={user.department} size="small" variant="outlined" />}
            {user.graduationYear && <Chip label={`Class of ${user.graduationYear}`} size="small" variant="outlined" />}
          </Box>
        )}

        {/* Skills */}
        {safeSkills.length > 0 && (
          <Box sx={{ mt: 2.5 }}>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.disabled', fontSize: '0.65rem', letterSpacing: '0.1em' }}>
              Skills
            </Typography>
            <Box className="flex flex-wrap gap-1.5 mt-1">
              {safeSkills.slice(0, 10).map((skill, i) => (
                <Chip
                  key={i}
                  label={skill}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    background: (t) => t.palette.mode === 'dark' ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
                    color: 'primary.main',
                    border: '1px solid',
                    borderColor: 'primary.light',
                  }}
                />
              ))}
              {safeSkills.length > 10 && (
                <Chip label={`+${safeSkills.length - 10} more`} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ProfileHeader;
