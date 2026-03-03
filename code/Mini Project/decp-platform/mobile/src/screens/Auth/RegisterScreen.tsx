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
  Menu,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../store';
import { register, clearError } from '../../features/authSlice';
import { AuthScreenProps } from '../../navigation/types';
import { isValidEmail } from '../../utils/helpers';
import { USER_ROLES, DEPARTMENTS } from '../../utils/constants';

type Props = AuthScreenProps<'Register'>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as 'student' | 'alumni' | 'faculty' | '',
    department: '',
    graduationYear: '',
  });

  const [secureText, setSecureText] = useState(true);
  const [secureConfirmText, setSecureConfirmText] = useState(true);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showDeptMenu, setShowDeptMenu] = useState(false);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.role) {
      errors.role = 'Please select a role';
    }

    if (!formData.department) {
      errors.department = 'Please select a department';
    }

    if (formData.role === 'student' && !formData.graduationYear) {
      errors.graduationYear = 'Graduation year is required for students';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    dispatch(clearError());

    if (!validateForm()) return;

    try {
      await dispatch(
        register({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role as 'student' | 'alumni' | 'faculty',
          department: formData.department,
          graduationYear: formData.graduationYear
            ? parseInt(formData.graduationYear)
            : undefined,
        })
      ).unwrap();
    } catch (err) {
      // Error is handled by the slice
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => ({ ...prev, [field]: '' }));
    dispatch(clearError());
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
            Create Account
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Join the DECP community
          </Text>
        </View>

        <View style={styles.form}>
          {error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}

          <View style={styles.row}>
            <View style={styles.flex1}>
              <TextInput
                label="First Name"
                value={formData.firstName}
                onChangeText={(text) => updateField('firstName', text)}
                mode="outlined"
                error={!!validationErrors.firstName}
                disabled={isLoading}
              />
              {validationErrors.firstName && (
                <HelperText type="error">{validationErrors.firstName}</HelperText>
              )}
            </View>
            <View style={styles.spacer} />
            <View style={styles.flex1}>
              <TextInput
                label="Last Name"
                value={formData.lastName}
                onChangeText={(text) => updateField('lastName', text)}
                mode="outlined"
                error={!!validationErrors.lastName}
                disabled={isLoading}
              />
              {validationErrors.lastName && (
                <HelperText type="error">{validationErrors.lastName}</HelperText>
              )}
            </View>
          </View>

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!validationErrors.email}
            disabled={isLoading}
            left={<TextInput.Icon icon="email" />}
          />
          {validationErrors.email && (
            <HelperText type="error">{validationErrors.email}</HelperText>
          )}

          <TextInput
            label="Password"
            value={formData.password}
            onChangeText={(text) => updateField('password', text)}
            mode="outlined"
            secureTextEntry={secureText}
            error={!!validationErrors.password}
            disabled={isLoading}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={secureText ? 'eye-off' : 'eye'}
                onPress={() => setSecureText(!secureText)}
              />
            }
          />
          {validationErrors.password && (
            <HelperText type="error">{validationErrors.password}</HelperText>
          )}

          <TextInput
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) => updateField('confirmPassword', text)}
            mode="outlined"
            secureTextEntry={secureConfirmText}
            error={!!validationErrors.confirmPassword}
            disabled={isLoading}
            left={<TextInput.Icon icon="lock-check" />}
            right={
              <TextInput.Icon
                icon={secureConfirmText ? 'eye-off' : 'eye'}
                onPress={() => setSecureConfirmText(!secureConfirmText)}
              />
            }
          />
          {validationErrors.confirmPassword && (
            <HelperText type="error">{validationErrors.confirmPassword}</HelperText>
          )}

          <Menu
            visible={showRoleMenu}
            onDismiss={() => setShowRoleMenu(false)}
            anchor={
              <TextInput
                label="Role *"
                value={USER_ROLES.find((r) => r.value === formData.role)?.label || ''}
                mode="outlined"
                error={!!validationErrors.role}
                disabled={isLoading}
                editable={false}
                right={<TextInput.Icon icon="menu-down" onPress={() => setShowRoleMenu(true)} />}
                onPressIn={() => setShowRoleMenu(true)}
              />
            }
          >
            {USER_ROLES.map((role) => (
              <Menu.Item
                key={role.value}
                onPress={() => {
                  updateField('role', role.value);
                  setShowRoleMenu(false);
                }}
                title={role.label}
                leadingIcon={role.icon}
              />
            ))}
          </Menu>
          {validationErrors.role && (
            <HelperText type="error">{validationErrors.role}</HelperText>
          )}

          <Menu
            visible={showDeptMenu}
            onDismiss={() => setShowDeptMenu(false)}
            anchor={
              <TextInput
                label="Department *"
                value={formData.department}
                mode="outlined"
                error={!!validationErrors.department}
                disabled={isLoading}
                editable={false}
                right={<TextInput.Icon icon="menu-down" onPress={() => setShowDeptMenu(true)} />}
                onPressIn={() => setShowDeptMenu(true)}
              />
            }
          >
            <ScrollView style={styles.menuScroll}>
              {DEPARTMENTS.map((dept) => (
                <Menu.Item
                  key={dept}
                  onPress={() => {
                    updateField('department', dept);
                    setShowDeptMenu(false);
                  }}
                  title={dept}
                />
              ))}
            </ScrollView>
          </Menu>
          {validationErrors.department && (
            <HelperText type="error">{validationErrors.department}</HelperText>
          )}

          {formData.role === 'student' && (
            <>
              <TextInput
                label="Graduation Year"
                value={formData.graduationYear}
                onChangeText={(text) => updateField('graduationYear', text)}
                mode="outlined"
                keyboardType="numeric"
                error={!!validationErrors.graduationYear}
                disabled={isLoading}
                left={<TextInput.Icon icon="calendar" />}
              />
              {validationErrors.graduationYear && (
                <HelperText type="error">{validationErrors.graduationYear}</HelperText>
              )}
            </>
          )}

          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.registerButton}
            disabled={isLoading}
            loading={isLoading}
          >
            Create Account
          </Button>

          <View style={styles.loginContainer}>
            <Text variant="bodyMedium">Already have an account?</Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              disabled={isLoading}
            >
              Sign In
            </Button>
          </View>
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
    padding: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
  },
  form: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  spacer: {
    width: 12,
  },
  menuScroll: {
    maxHeight: 300,
  },
  registerButton: {
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
});

export default RegisterScreen;
