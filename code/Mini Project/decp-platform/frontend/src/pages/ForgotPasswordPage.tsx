import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Email, ArrowBack, MarkEmailRead } from '@mui/icons-material';
import { AppDispatch } from '@store';
import { useForgotPasswordMutation } from '@services/authApi';
import { addToast } from '@features/uiSlice';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@utils';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
    '&:hover fieldset': { borderColor: 'rgba(74, 222, 128, 0.45)' },
    '&.Mui-focused fieldset': { borderColor: '#22c55e', borderWidth: '1.5px' },
    '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.12)' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.45)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#4ade80' },
  '& .MuiFormHelperText-root': { color: '#f87171' },
  '& .MuiInputBase-input': { color: 'white' },
};

export const ForgotPasswordPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword({ email: data.email || '' }).unwrap();
      setIsSubmitted(true);
      dispatch(addToast({ message: 'Password reset link sent to your email', type: 'success' }));
    } catch (error: any) {
      dispatch(addToast({ message: error.data?.message || 'Failed to send reset link', type: 'error' }));
    }
  };

  if (isSubmitted) {
    return (
      <Box sx={{ textAlign: 'center', py: 1 }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #22c55e, #14b8a6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            boxShadow: '0 12px 32px rgba(34,197,94,0.4)',
          }}
        >
          <MarkEmailRead sx={{ color: '#052e16', fontSize: 36 }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', mb: 1.5, letterSpacing: '-0.3px' }}>
          Check Your Email
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 4, lineHeight: 1.7 }}>
          We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
        </Typography>
        <Link
          to="/login"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#4ade80', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#86efac')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#4ade80')}
        >
          <ArrowBack fontSize="small" />
          Back to Login
        </Link>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center', mb: 0.75, color: 'white', letterSpacing: '-0.3px' }}>
        Forgot Password?
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', mb: 3.5 }}>
        Enter your email and we'll send you a reset link
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: 'rgba(74,222,128,0.7)', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
          />
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
            '&:hover': { background: 'linear-gradient(135deg, #14532d 0%, #15803d 100%)', transform: 'translateY(-1px)' },
            '&.Mui-disabled': { background: 'rgba(22,101,52,0.4)', color: 'rgba(255,255,255,0.5)' },
            transition: 'all 0.2s ease',
          }}
        >
          {isLoading ? <CircularProgress size={22} sx={{ color: 'rgba(255,255,255,0.8)' }} /> : 'Send Reset Link'}
        </Button>
      </form>

      <Box sx={{ mt: 3.5, textAlign: 'center' }}>
        <Link
          to="/login"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.45)', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#4ade80')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
        >
          <ArrowBack fontSize="small" />
          Back to Login
        </Link>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;
