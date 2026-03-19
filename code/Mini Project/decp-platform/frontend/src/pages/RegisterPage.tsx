import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Fade,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  School,
  CheckCircle,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { AppDispatch } from '@store';
import { useRegisterMutation } from '@services/authApi';
import { setCredentials } from '@features/authSlice';
import { registerSchema, RegisterFormData, DEPARTMENTS, ROLES } from '@utils';

const steps = ['Account', 'Personal', 'Academic'];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registerUser, { isLoading }] = useRegisterMutation();

  const {
    register,
    control,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      role: 'student',
      department: '',
      graduationYear: undefined,
    },
  });

  const role = watch('role');
  const password = watch('password');

  // Clear error message after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const validateStep = async (): Promise<boolean> => {
    let fieldsToValidate: (keyof RegisterFormData)[] = [];

    switch (activeStep) {
      case 0:
        fieldsToValidate = ['email', 'password', 'confirmPassword'];
        break;
      case 1:
        fieldsToValidate = ['firstName', 'lastName', 'role'];
        break;
      case 2:
        fieldsToValidate = ['department'];
        if (role === 'student' || role === 'alumni') {
          fieldsToValidate.push('graduationYear');
        }
        break;
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep();
    if (isValid) {
      setActiveStep((prev) => prev + 1);
      setErrorMessage(null);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setErrorMessage(null);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);
    try {
      const { confirmPassword: _confirmPassword, ...registerData } = data;
      const response = await registerUser({
        email: registerData.email || '',
        password: registerData.password || '',
        firstName: registerData.firstName || '',
        lastName: registerData.lastName || '',
        role: registerData.role || 'student',
        department: registerData.department || '',
        graduationYear: registerData.graduationYear,
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
        // After successful registration, redirect to login page
        navigate('/login', { replace: true });
      } else {
        setErrorMessage(response.message || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.data?.message || error.message || 'Registration failed. Please try again.';
      setErrorMessage(message);
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: 'Enter password', color: 'gray' };
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { label: 'Too weak', color: '#f44336' },
      { label: 'Weak', color: '#ff9800' },
      { label: 'Fair', color: '#ffc107' },
      { label: 'Good', color: '#4caf50' },
      { label: 'Strong', color: '#2e7d32' },
    ];

    return { strength, ...levels[Math.min(strength, 4)] };
  };

  const passwordStrength = getPasswordStrength(password || '');

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box className="space-y-4">
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
                    <Email className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                    <Lock className="text-gray-400" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={isLoading}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            {/* Password Strength Indicator */}
            {password && (
              <Box className="mt-2">
                <Box className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Box
                      key={level}
                      className="h-1 flex-1 rounded-full transition-colors"
                      sx={{ backgroundColor: level <= passwordStrength.strength ? passwordStrength.color : '#e0e0e0' }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" sx={{ color: passwordStrength.color }}>
                  Password strength: {passwordStrength.label}
                </Typography>
              </Box>
            )}
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock className="text-gray-400" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" disabled={isLoading}>
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Box>
        );
      case 1:
        return (
          <Box className="space-y-4">
            <TextField
              fullWidth
              label="First Name"
              {...register('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <TextField
              fullWidth
              label="Last Name"
              {...register('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person className="text-gray-400" />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  label="Role"
                  {...field}
                  error={!!errors.role}
                  helperText={errors.role?.message}
                  disabled={isLoading}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                >
                  {ROLES.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Box>
        );
      case 2:
        return (
          <Box className="space-y-4">
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  label="Department"
                  {...field}
                  error={!!errors.department}
                  helperText={errors.department?.message}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <School className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                >
                  {DEPARTMENTS.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            {(role === 'student' || role === 'alumni') && (
              <TextField
                fullWidth
                label="Graduation Year"
                type="number"
                {...register('graduationYear', { valueAsNumber: true })}
                error={!!errors.graduationYear}
                helperText={errors.graduationYear?.message || 'Enter expected or actual graduation year'}
                disabled={isLoading}
                InputProps={{
                  inputProps: { min: 1980, max: 2030 },
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            )}
            <Box className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <Typography variant="caption" className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle fontSize="small" />
                Almost there! Click Sign Up to create your account.
              </Typography>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography
        variant="h4"
        className="font-bold text-center mb-2 text-gray-800 dark:text-gray-100"
      >
        Create Account
      </Typography>
      <Typography
        variant="body2"
        className="text-center mb-6 text-gray-500 dark:text-gray-400"
      >
        Join the Department Engagement & Career Platform
      </Typography>

      {/* Error Alert */}
      <Fade in={!!errorMessage}>
        <Box className={errorMessage ? 'mb-4' : 'hidden'}>
          <Alert
            severity="error"
            onClose={() => setErrorMessage(null)}
            className="rounded-xl"
          >
            {errorMessage}
          </Alert>
        </Box>
      </Fade>

      <Stepper activeStep={activeStep} className="mb-6" alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <form onSubmit={handleSubmit(onSubmit)}>
        {renderStep()}

        <Box className="flex justify-between mt-6">
          <Button
            disabled={activeStep === 0 || isLoading}
            onClick={handleBack}
            startIcon={<ArrowBack />}
            className="text-gray-600 dark:text-gray-400"
            sx={{ textTransform: 'none' }}
          >
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              endIcon={isLoading ? <CircularProgress size={20} className="text-white" /> : null}
              className="px-6 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-green-500/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70"
              sx={{ textTransform: 'none', minWidth: '120px' }}
            >
              {isLoading ? 'Creating...' : 'Sign Up'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForward />}
              className="px-6 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white"
              sx={{ textTransform: 'none' }}
            >
              Next
            </Button>
          )}
        </Box>
      </form>

      <Box className="mt-6 text-center">
        <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold hover:underline transition-colors"
          >
            Sign In
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterPage;
