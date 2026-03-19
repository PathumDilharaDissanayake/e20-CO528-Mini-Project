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
  '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.45)' },
};

const stepperSx = {
  '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.45)', fontWeight: 500 },
  '& .MuiStepLabel-label.Mui-active': { color: '#4ade80', fontWeight: 700 },
  '& .MuiStepLabel-label.Mui-completed': { color: '#22c55e', fontWeight: 600 },
  '& .MuiStepIcon-root': { color: 'rgba(255,255,255,0.18)' },
  '& .MuiStepIcon-root.Mui-active': { color: '#22c55e' },
  '& .MuiStepIcon-root.Mui-completed': { color: '#16a34a' },
  '& .MuiStepConnector-line': { borderColor: 'rgba(255,255,255,0.12)' },
};

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

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const validateStep = async (): Promise<boolean> => {
    let fieldsToValidate: (keyof RegisterFormData)[] = [];
    switch (activeStep) {
      case 0: fieldsToValidate = ['email', 'password', 'confirmPassword']; break;
      case 1: fieldsToValidate = ['firstName', 'lastName', 'role']; break;
      case 2:
        fieldsToValidate = ['department'];
        if (role === 'student' || role === 'alumni') fieldsToValidate.push('graduationYear');
        break;
    }
    return await trigger(fieldsToValidate);
  };

  const handleNext = async () => {
    if (await validateStep()) { setActiveStep((p) => p + 1); setErrorMessage(null); }
  };

  const handleBack = () => { setActiveStep((p) => p - 1); setErrorMessage(null); };

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);
    try {
      const { confirmPassword: _c, ...registerData } = data;
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
        dispatch(setCredentials({
          user: { ...user, _id: user._id || user.id, id: user.id || user._id, role: user.role || 'student' },
          token: accessToken,
          refreshToken,
        }));
        navigate('/login', { replace: true });
      } else {
        setErrorMessage(response.message || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      setErrorMessage(error.data?.message || error.message || 'Registration failed. Please try again.');
    }
  };

  const getPasswordStrength = (pw: string) => {
    if (!pw) return { strength: 0, label: 'Enter password', color: 'rgba(255,255,255,0.2)' };
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    const levels = [
      { label: 'Too weak', color: '#f44336' },
      { label: 'Weak', color: '#ff9800' },
      { label: 'Fair', color: '#ffc107' },
      { label: 'Good', color: '#4caf50' },
      { label: 'Strong', color: '#22c55e' },
    ];
    return { strength: s, ...levels[Math.min(s, 4)] };
  };

  const pwStrength = getPasswordStrength(password || '');

  const menuPaperProps = {
    PaperProps: {
      sx: {
        background: '#1e293b',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '12px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        '& .MuiMenuItem-root': { color: 'rgba(255,255,255,0.85)' },
        '& .MuiMenuItem-root:hover': { background: 'rgba(34,197,94,0.1)' },
        '& .MuiMenuItem-root.Mui-selected': { background: 'rgba(34,197,94,0.15)', color: '#4ade80' },
      },
    },
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={isLoading}
              InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: 'rgba(74,222,128,0.7)', fontSize: 20 }} /></InputAdornment> }}
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
                startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'rgba(74,222,128,0.7)', fontSize: 20 }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={isLoading} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'rgba(255,255,255,0.8)' } }}>
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />
            {password && (
              <Box>
                <Box sx={{ display: 'flex', gap: 0.5, mb: 0.75 }}>
                  {[1, 2, 3, 4, 5].map((l) => (
                    <Box key={l} sx={{ height: 3, flex: 1, borderRadius: 2, transition: 'background 0.3s', backgroundColor: l <= pwStrength.strength ? pwStrength.color : 'rgba(255,255,255,0.12)' }} />
                  ))}
                </Box>
                <Typography variant="caption" sx={{ color: pwStrength.color, fontWeight: 500 }}>
                  Password strength: {pwStrength.label}
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
                startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'rgba(74,222,128,0.7)', fontSize: 20 }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" disabled={isLoading} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: 'rgba(255,255,255,0.8)' } }}>
                      {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                {...register('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                disabled={isLoading}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: 'rgba(74,222,128,0.7)', fontSize: 20 }} /></InputAdornment> }}
                sx={fieldSx}
              />
              <TextField
                fullWidth
                label="Last Name"
                {...register('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                disabled={isLoading}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: 'rgba(74,222,128,0.7)', fontSize: 20 }} /></InputAdornment> }}
                sx={fieldSx}
              />
            </Box>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  label="I am a..."
                  {...field}
                  error={!!errors.role}
                  helperText={errors.role?.message}
                  disabled={isLoading}
                  sx={fieldSx}
                  SelectProps={{ MenuProps: menuPaperProps }}
                >
                  {ROLES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  InputProps={{ startAdornment: <InputAdornment position="start"><School sx={{ color: 'rgba(74,222,128,0.7)', fontSize: 20 }} /></InputAdornment> }}
                  sx={fieldSx}
                  SelectProps={{ MenuProps: menuPaperProps }}
                >
                  {DEPARTMENTS.map((dept) => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
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
                helperText={errors.graduationYear?.message || 'Expected or actual graduation year'}
                disabled={isLoading}
                InputProps={{ inputProps: { min: 1980, max: 2035 } }}
                sx={fieldSx}
              />
            )}
            <Box
              sx={{
                p: 2,
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <CheckCircle sx={{ color: '#22c55e', fontSize: 20, flexShrink: 0 }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                Almost there! Review your details then click <strong style={{ color: '#4ade80' }}>Sign Up</strong> to join DECP.
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
      <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', mb: 0.75, color: 'white', letterSpacing: '-0.5px' }}>
        Create Account
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'center', mb: 3, color: 'rgba(255,255,255,0.45)' }}>
        Join the Department Engagement & Career Platform
      </Typography>

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

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3.5, ...stepperSx }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <form onSubmit={handleSubmit(onSubmit)}>
        {renderStep()}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, gap: 1.5 }}>
          <Button
            disabled={activeStep === 0 || isLoading}
            onClick={handleBack}
            startIcon={<ArrowBack fontSize="small" />}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.15)',
              px: 2.5,
              '&:hover': { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.3)' },
              '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.08)' },
            }}
          >
            Back
          </Button>

          {activeStep === steps.length - 1 ? (
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              className="btn-press"
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                px: 3.5,
                background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                boxShadow: '0 6px 20px rgba(22, 101, 52, 0.5)',
                '&:hover': { background: 'linear-gradient(135deg, #14532d 0%, #15803d 100%)', transform: 'translateY(-1px)' },
                '&.Mui-disabled': { background: 'rgba(22,101,52,0.4)', color: 'rgba(255,255,255,0.5)' },
                transition: 'all 0.2s ease',
                minWidth: 120,
              }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={18} sx={{ color: 'rgba(255,255,255,0.8)' }} />
                  Creating...
                </Box>
              ) : 'Sign Up'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForward fontSize="small" />}
              className="btn-press"
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                boxShadow: '0 6px 20px rgba(22, 101, 52, 0.4)',
                '&:hover': { background: 'linear-gradient(135deg, #14532d 0%, #15803d 100%)', transform: 'translateY(-1px)' },
                transition: 'all 0.2s ease',
              }}
            >
              Next
            </Button>
          )}
        </Box>
      </form>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)' }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{ color: '#4ade80', fontWeight: 700, textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#86efac')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#4ade80')}
          >
            Sign In
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterPage;
