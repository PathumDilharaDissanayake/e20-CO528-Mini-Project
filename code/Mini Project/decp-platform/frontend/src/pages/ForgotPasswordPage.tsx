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
import { Email, ArrowBack } from '@mui/icons-material';
import { AppDispatch } from '@store';
import { useForgotPasswordMutation } from '@services/authApi';
import { addToast } from '@features/uiSlice';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@utils';

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
      dispatch(addToast({
        message: 'Password reset link sent to your email',
        type: 'success',
      }));
    } catch (error: any) {
      dispatch(addToast({
        message: error.data?.message || 'Failed to send reset link',
        type: 'error',
      }));
    }
  };

  if (isSubmitted) {
    return (
      <Box className="text-center">
        <Typography variant="h5" className="font-bold mb-4 text-gray-800 dark:text-gray-100">
          Check Your Email
        </Typography>
        <Typography variant="body1" className="text-gray-600 dark:text-gray-400 mb-6">
          We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
        </Typography>
        <Link
          to="/login"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
        >
          <ArrowBack className="mr-1" fontSize="small" />
          Back to Login
        </Link>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" className="font-bold text-center mb-2 text-gray-800 dark:text-gray-100">
        Forgot Password
      </Typography>
      <Typography variant="body2" className="text-center text-gray-600 dark:text-gray-400 mb-6">
        Enter your email and we'll send you a reset link
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextField
          fullWidth
          label="Email"
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email className="text-gray-400" />
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading}
          className="py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/30"
        >
          {isLoading ? (
            <CircularProgress size={24} className="text-white" />
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </form>

      <Box className="mt-6 text-center">
        <Link
          to="/login"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
        >
          <ArrowBack className="mr-1" fontSize="small" />
          Back to Login
        </Link>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;
