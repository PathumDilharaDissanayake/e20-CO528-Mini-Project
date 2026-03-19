import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Fade,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, School, RocketLaunch } from '@mui/icons-material';
import { AppDispatch } from '@store';
import { useLoginMutation } from '@services/authApi';
import { setCredentials } from '@features/authSlice';
import { loginSchema, LoginFormData } from '@utils';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    transition: 'all 0.2s ease',
    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)', transition: 'border-color 0.2s' },
    '&:hover fieldset': { borderColor: 'rgba(74, 222, 128, 0.45)' },
    '&.Mui-focused fieldset': { borderColor: '#22c55e', borderWidth: '1.5px' },
    '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.12)' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.45)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#4ade80' },
  '& .MuiFormHelperText-root': { color: '#f87171' },
  '& .MuiInputBase-input': { color: 'white' },
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();

  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => { setFocus('email'); }, [setFocus]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    try {
      const response = await login({ email: data.email || '', password: data.password || '' }).unwrap();
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        dispatch(setCredentials({
          user: { ...user, _id: user._id || user.id, id: user.id || user._id, role: user.role || 'student' },
          token: accessToken,
          refreshToken,
        }));
        navigate(redirectPath, { replace: true });
      } else {
        setErrorMessage(response.message || 'Login failed. Please try again.');
      }
    } catch (error: any) {
      const message = error.data?.message || error.message || 'Invalid email or password';
      setErrorMessage(message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', mb: 0.75, color: 'white', letterSpacing: '-0.5px' }}>
        Welcome Back
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'center', mb: 3.5, color: 'rgba(255,255,255,0.45)' }}>
        Sign in to continue your journey
      </Typography>

      {/* Error Alert */}
      <Fade in={!!errorMessage}>
        <Box className={errorMessage ? 'mb-4' : 'hidden'}>
          <Alert
            severity="error"
            onClose={() => setErrorMessage(null)}
            sx={{
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              '& .MuiAlert-icon': { color: '#f87171' },
              '& .MuiAlert-action button': { color: '#fca5a5' },
            }}
          >
            {errorMessage}
          </Alert>
        </Box>
      </Fade>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextField
          fullWidth
          label="Email Address"
          type="email"
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
          disabled={isLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email sx={{ color: 'rgba(74,222,128,0.7)', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={fieldSx}
        />

        <TextField
          fullWidth
          label="Password"
          type={showPassword ? 'text' : 'password'}
          {...register('password')}
          error={!!errors.password}
          helperText={errors.password?.message}
          disabled={isLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock sx={{ color: 'rgba(74,222,128,0.7)', fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  disabled={isLoading}
                  sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'rgba(255,255,255,0.8)' } }}
                >
                  {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={fieldSx}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
          <Link
            to="/forgot-password"
            style={{ fontSize: '0.82rem', color: '#4ade80', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#86efac')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#4ade80')}
          >
            Forgot Password?
          </Link>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading}
          className="btn-press"
          sx={{
            py: 1.6,
            borderRadius: '12px',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
            boxShadow: '0 6px 20px rgba(22, 101, 52, 0.5)',
            '&:hover': {
              background: 'linear-gradient(135deg, #14532d 0%, #15803d 100%)',
              boxShadow: '0 8px 28px rgba(22, 101, 52, 0.6)',
              transform: 'translateY(-1px)',
            },
            '&:active': { transform: 'scale(0.98)' },
            '&.Mui-disabled': { background: 'rgba(22,101,52,0.4)', color: 'rgba(255,255,255,0.5)' },
            transition: 'all 0.2s ease',
          }}
        >
          {isLoading ? (
            <CircularProgress size={22} sx={{ color: 'rgba(255,255,255,0.8)' }} />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RocketLaunch fontSize="small" />
              Sign In
            </Box>
          )}
        </Button>
      </form>

      <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', px: 1 }}>or</Typography>
      </Divider>

      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)' }}>
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{ color: '#4ade80', fontWeight: 700, textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#86efac')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#4ade80')}
          >
            Sign Up
          </Link>
        </Typography>
      </Box>

      {/* Demo Credentials */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: '14px',
          background: 'rgba(34, 197, 94, 0.06)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
        }}
      >
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#4ade80', fontWeight: 700, mb: 1, fontSize: '0.75rem' }}>
          <School fontSize="small" />
          Demo Accounts
        </Typography>
        <Box sx={{ display: 'grid', gap: 0.5 }}>
          {[
            { role: 'Student', email: 'alice.student@decp.edu', pass: 'Pass1234x' },
            { role: 'Faculty', email: 'prof.james@decp.edu', pass: 'Pass1234x' },
            { role: 'Alumni', email: 'david.alumni@decp.edu', pass: 'Pass1234x' },
            { role: 'Admin', email: 'admin@decp.edu', pass: 'Admin1234x' },
          ].map(({ role, email, pass }) => (
            <Box key={role} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 46, flexShrink: 0 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {role}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace', fontSize: '0.72rem' }}>
                {email} / {pass}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
