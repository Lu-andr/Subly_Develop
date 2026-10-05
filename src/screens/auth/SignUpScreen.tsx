// Subly — Sign Up Screen with Interactive Mascot & Modern UI
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

interface SignUpScreenProps {
  onNavigateLogin: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigateLogin }) => {
  const { signUp, signInWithGoogle, loading, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const validate = (): boolean => {
    const errs: typeof formErrors = {};
    if (!name.trim()) errs.name = 'Full name is required.';
    if (!email.trim()) errs.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 8) errs.password = 'Must be at least 8 characters.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignUp = async () => {
    clearError();
    if (!validate()) return;
    try {
      await signUp(name, email, password);
      Alert.alert(
        'Check your inbox 📩',
        'We sent you a confirmation link. Please verify your email to access Subly.',
        [{ text: 'Sign In Now', onPress: onNavigateLogin }]
      );
    } catch {
      // handled in useAuth
    }
  };

  const handleGoogleSignUp = async () => {
    clearError();
    try {
      await signInWithGoogle();
    } catch {
      Alert.alert('Error', 'Google sign up failed. Please try again.');
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
            mood="guarding"
            bubbleText="Let's protect your wallet! 🛡️"
            interactive={true}
          />
          <Text style={styles.appName}>Create Your Account</Text>
          <Text style={styles.subtitle}>Track your trials and upcoming charges</Text>
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
            label="YOUR NAME"
            value={name}
            onChangeText={(t) => { setName(t); clearError(); }}
            placeholder="Mayank Bohara"
            autoCapitalize="words"
            error={formErrors.name}
            returnKeyType="next"
            accessibilityLabel="Full name"
          />

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
            placeholder="Minimum 8 characters"
            secureTextEntry
            error={formErrors.password}
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
            accessibilityLabel="Password"
          />

          <Button
            title="Create Free Account"
            onPress={handleSignUp}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.signUpBtn}
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
            onPress={handleGoogleSignUp}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sign up with Google"
          >
            <Ionicons name="logo-google" size={18} color="#EA4335" />
            <Text style={styles.googleBtnText}>Sign up with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={onNavigateLogin} accessibilityRole="button">
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
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
    fontSize: typography.fontSize['2xl'],
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
  signUpBtn: {
    marginTop: spacing.xs,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  loginLink: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
});
