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

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();

  // Get redirect path from URL query params
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Auto-focus email field on mount
  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    try {
      const response = await login({
        email: data.email || '',
        password: data.password || '',
      }).unwrap();

      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data;
        dispatch(
          setCredentials({
            user: {
              ...user,
              _id: user._id || user.id,
              id: user.id || user._id,
              role: user.role || 'student',
            },
            token: accessToken,
            refreshToken,
          })
        );
        navigate(redirectPath, { replace: true });
      } else {
        setErrorMessage(response.message || 'Login failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.data?.message || error.message || 'Invalid email or password';
      setErrorMessage(message);
    }
  };

  return (
    <Box>
      <Typography
        variant="h4"
        className="font-bold text-center mb-2 text-white"
      >
        Welcome Back
      </Typography>
      <Typography
        variant="body2"
        className="text-center mb-6 text-gray-400"
      >
        Sign in to continue your journey
      </Typography>

      {/* Error Alert */}
      <Fade in={!!errorMessage}>
        <Box className={errorMessage ? 'mb-4' : 'hidden'}>
          <Alert
            severity="error"
            onClose={() => setErrorMessage(null)}
            className="rounded-xl"
            sx={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              '& .MuiAlert-icon': { color: '#f87171' }
            }}
          >
            {errorMessage}
          </Alert>
        </Box>
      </Fade>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                <Email className="text-green-400" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
              '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
              '&.Mui-focused fieldset': { borderColor: '#166534' },
            },
            '& .MuiInputLabel-root': { color: 'gray' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#166534' },
            '& .MuiFormHelperText-root': { color: '#f87171' },
          }}
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
                <Lock className="text-green-400" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  disabled={isLoading}
                  className="text-gray-400 hover:text-white"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
              '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
              '&.Mui-focused fieldset': { borderColor: '#166534' },
            },
            '& .MuiInputLabel-root': { color: 'gray' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#166534' },
            '& .MuiFormHelperText-root': { color: '#f87171' },
          }}
        />

        <Box className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-green-400 hover:text-green-300 transition-colors"
          >
            Forgot Password?
          </Link>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading}
          className="py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
          sx={{
            textTransform: 'none',
            fontSize: '1rem',
            background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #14532d 0%, #15803d 100%)',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.5)',
            },
          }}
        >
          {isLoading ? (
            <CircularProgress size={24} className="text-white" />
          ) : (
            <Box className="flex items-center gap-2">
              <RocketLaunch fontSize="small" />
              Sign In
            </Box>
          )}
        </Button>
      </form>

      <Divider className="my-6" sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <Typography variant="body2" className="text-gray-500 px-2">
          or
        </Typography>
      </Divider>

      <Box className="text-center">
        <Typography variant="body2" className="text-gray-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-green-400 hover:text-green-300 font-semibold transition-colors"
          >
            Sign Up
          </Link>
        </Typography>
      </Box>

      {/* Demo Credentials */}
      <Box className="mt-6 p-4 rounded-xl" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)'
      }}>
        <Typography variant="caption" className="flex items-center gap-1 text-green-300 font-medium">
          <School fontSize="small" />
          Demo Accounts
        </Typography>
        <Typography variant="caption" className="block text-gray-400 mt-1">
          Student: alice.student@decp.edu / Pass1234x<br />
          Faculty: prof.james@decp.edu / Pass1234x<br />
          Alumni: &nbsp;&nbsp;david.alumni@decp.edu / Pass1234x<br />
          Admin: &nbsp;&nbsp;&nbsp;admin@decp.edu / Admin1234x
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;
