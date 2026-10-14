// Subly — Login Screen with Interactive Mascot & Modern UI
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { borderRadius, shadow, spacing } from '../../constants/spacing';
import { AnimatedMascot } from '../../components/ui/AnimatedMascot';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, loading, error, clearError } = useAuth();

  const handleGoogleSignIn = async () => {
    clearError();
    try {
      await signInWithGoogle();
    } catch {
      Alert.alert('Error', 'Google sign in failed. Please try again.');
    }
  };

  return (
    <View style={styles.flex}>
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

          {/* Google Sign In */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Google"
          >
            <Ionicons name="logo-google" size={18} color="#EA4335" />
            <Text style={styles.googleBtnText}>{loading ? 'Connecting…' : 'Continue with Google'}</Text>
          </TouchableOpacity>
        </View>

        {/* Security Badge */}
        <View style={styles.securityRow}>
          <Ionicons name="lock-closed" size={13} color={colors.gray500} />
          <Text style={styles.securityText}>Version 1.0.1 - Google sign-in</Text>
        </View>
      </ScrollView>
    </View>
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
