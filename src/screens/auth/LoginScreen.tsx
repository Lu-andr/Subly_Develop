// Subly — Login Screen with Interactive Mascot & Modern UI
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { borderRadius, shadow, spacing } from '../../constants/spacing';
import { AnimatedMascot } from '../../components/ui/AnimatedMascot';

interface LoginScreenProps {
  onNavigateForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateForgotPassword,
}) => {
  const { signIn, signInWithGoogle, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errs: typeof formErrors = {};
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email.';
    if (!password) errs.password = 'Password is required.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignIn = async () => {
    clearError();
    if (!validate()) return;
    try {
      await signIn(email, password);
    } catch {
      // error handled in useAuth state
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    try {
      await signInWithGoogle();
    } catch {
      Alert.alert('Error', 'Google sign in failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Mascot Header */}
        <View style={styles.mascotSection}>
          <AnimatedMascot
            size={90}
            mood="happy"
            bubbleText="Welcome back! 👋"
            interactive={true}
          />
          <Text style={styles.appName}>Subly</Text>
          <Text style={styles.subtitle}>Sign in to manage your trials</Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Input
            label="EMAIL ADDRESS"
            value={email}
            onChangeText={(t) => { setEmail(t); clearError(); }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={formErrors.email}
            returnKeyType="next"
            accessibilityLabel="Email address"
          />

          <Input
            label="PASSWORD"
            value={password}
            onChangeText={(t) => { setPassword(t); clearError(); }}
            placeholder="••••••••"
            secureTextEntry
            error={formErrors.password}
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
            accessibilityLabel="Password"
          />

          <TouchableOpacity
            onPress={onNavigateForgotPassword}
            style={styles.forgotLink}
            accessibilityRole="button"
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleSignIn}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.signInBtn}
          />

          {/* Social Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Google"
          >
            <Ionicons name="logo-google" size={18} color="#EA4335" />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Security Badge */}
        <View style={styles.securityRow}>
          <Ionicons name="lock-closed" size={13} color={colors.gray500} />
          <Text style={styles.securityText}>Your records are linked to your account</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
    minHeight: '100%',
    justifyContent: 'center',
  },
  mascotSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  appName: {
    fontSize: typography.fontSize['3xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadow.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
    gap: spacing.xs,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.danger,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    marginTop: -spacing.xs,
  },
  forgotText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  signInBtn: {
    marginBottom: spacing.base,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  dividerText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.gray400,
    paddingHorizontal: spacing.md,
    letterSpacing: 0.5,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.lg,
    height: 48,
    gap: spacing.sm,
  },
  googleBtnText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.gray800,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: 4,
  },
  securityText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.gray500,
  },
});
