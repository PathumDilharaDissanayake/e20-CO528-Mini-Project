import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  HelperText,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { forgotPassword, clearError } from '../../features/authSlice';
import { AuthScreenProps } from '../../navigation/types';
import { isValidEmail } from '../../utils/helpers';

type Props = AuthScreenProps<'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      setValidationError('Email is required');
      return false;
    } else if (!isValidEmail(email)) {
      setValidationError('Please enter a valid email');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async () => {
    dispatch(clearError());

    if (!validateForm()) return;

    try {
      await dispatch(forgotPassword(email.trim())).unwrap();
      setEmailSent(true);
    } catch (err) {
      // Error is handled by the slice
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Reset Password
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {emailSent
              ? 'Check your email for reset instructions'
              : 'Enter your email to receive reset instructions'}
          </Text>
        </View>

        <View style={styles.form}>
          {error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}

          {emailSent ? (
            <View style={styles.successContainer}>
              <Text variant="bodyLarge" style={styles.successText}>
                We've sent password reset instructions to your email address.
              </Text>
              <Text variant="bodyMedium" style={styles.instructionText}>
                Please check your inbox and follow the instructions to reset your password.
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Login')}
                style={styles.backButton}
              >
                Back to Login
              </Button>
            </View>
          ) : (
            <>
              <TextInput
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setValidationError('');
                  dispatch(clearError());
                }}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={!!validationError}
                disabled={isLoading}
                left={<TextInput.Icon icon="email" />}
              />
              {validationError && (
                <HelperText type="error">{validationError}</HelperText>
              )}

              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                disabled={isLoading}
                loading={isLoading}
              >
                Send Reset Link
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                style={styles.backButton}
                disabled={isLoading}
              >
                Back to Login
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  successContainer: {
    alignItems: 'center',
  },
  successText: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  instructionText: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButton: {
    marginTop: 16,
  },
});

export default ForgotPasswordScreen;
