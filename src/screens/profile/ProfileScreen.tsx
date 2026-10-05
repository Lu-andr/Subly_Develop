// Subly — Profile Screen (Mobbin-inspired Settings & Preferences)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Profile, NotificationPreferences } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { borderRadius, shadow, spacing } from '../../constants/spacing';
import { Button } from '../../components/ui/Button';

const APP_VERSION = '1.0.0';

interface ProfileScreenProps {
  profile: Profile | null;
  prefs: NotificationPreferences;
  onUpdatePrefs: (updates: Partial<NotificationPreferences>) => Promise<void>;
  onSignOut: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onNavigateNotifications: () => void;
}

import { PRIVACY_URL, TERMS_URL, DELETION_URL, SUPPORT_EMAIL } from '../../constants/legal';

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  prefs,
  onUpdatePrefs,
  onSignOut,
  onDeleteAccount,
  onNavigateNotifications,
}) => {
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const avatarLetter = (profile?.name || profile?.email || 'S')[0].toUpperCase();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await onSignOut();
          } catch {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account & Data',
      'Are you sure you want to permanently delete your Subly account? All your subscriptions, reminders, and history will be permanently erased. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            try {
              await onDeleteAccount();
            } catch {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Hero */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.white} />
            </View>
          </View>
          <Text style={styles.name}>{profile?.name || 'Subly User'}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        {/* Account Section */}
        <SectionHeader title="Account Details" />
        <View style={styles.section}>
          <SettingsRow
            icon="person-outline"
            label="Name"
            value={profile?.name ?? '—'}
          />
          <SettingsRow
            icon="mail-outline"
            label="Email"
            value={profile?.email ?? '—'}
            last
          />
        </View>

        {/* Notifications Section */}
        <SectionHeader title="Alert Preferences" />
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            onPress={onNavigateNotifications}
            accessibilityRole="button"
            accessibilityLabel="Notification settings"
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="notifications-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.rowLabel}>Reminder Schedules</Text>
                <Text style={styles.rowSub}>
                  {prefs.notifications_enabled ? `${[prefs.seven_days, prefs.three_days, prefs.one_day, prefs.final_day].filter(Boolean).length} reminder intervals enabled` : 'Alerts disabled'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
          </TouchableOpacity>

          <View style={[styles.row, styles.lastRow]}>
            <View style={styles.rowLeft}>
              <View style={styles.iconCircle}>
                <Ionicons name="toggle-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.rowLabel}>Master Notifications</Text>
                <Text style={styles.rowSub}>Enable all trial renewal reminders</Text>
              </View>
            </View>
            <Switch
              value={prefs.notifications_enabled}
              onValueChange={(val) => onUpdatePrefs({ notifications_enabled: val })}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={colors.white}
              accessibilityLabel="Toggle all notifications"
            />
          </View>
        </View>

        {/* About Section */}
        <SectionHeader title="App Info" />
        <View style={styles.section}>
          <SettingsRow
            icon="information-circle-outline"
            label="Version"
            value={`v${APP_VERSION}`}
          />
          <SettingsRow
            icon="lock-closed-outline"
            label="Privacy Policy"
            chevron
            onPress={() => Linking.openURL(PRIVACY_URL)}
          />
          <SettingsRow
            icon="document-text-outline"
            label="Terms of Service"
            chevron
            onPress={() => Linking.openURL(TERMS_URL)}
          />
          <SettingsRow icon="trash-outline" label="Account deletion help" chevron onPress={() => Linking.openURL(DELETION_URL)} />
          <SettingsRow
            icon="help-buoy-outline"
            label="Help & Support"
            chevron
            last
            onPress={() => SUPPORT_EMAIL ? Linking.openURL(`mailto:${SUPPORT_EMAIL}`) : Alert.alert('Support', 'Support contact has not been configured.')}
          />
        </View>

        {/* Account Actions */}
        <View style={styles.actionButtons}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            fullWidth
            size="lg"
            loading={signingOut}
            style={styles.signOutBtn}
          />
          <Button
            title="Delete Account & Data"
            onPress={handleDeleteAccount}
            variant="danger"
            fullWidth
            size="md"
            loading={deletingAccount}
            style={styles.deleteBtn}
          />
        </View>

        <Text style={styles.footer}>
          Subly • Track every trial. Never pay by surprise.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Text style={sectionStyles.header}>{title}</Text>
);

const SettingsRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  chevron?: boolean;
  last?: boolean;
  onPress?: () => void;
}> = ({ icon, label, value, chevron, last, onPress }) => (
  <TouchableOpacity
    style={[styles.row, last && styles.lastRow]}
    onPress={onPress}
    disabled={!onPress && !chevron}
    activeOpacity={onPress || chevron ? 0.7 : 1}
    accessibilityRole={onPress || chevron ? 'button' : 'none'}
    accessibilityLabel={label}
  >
    <View style={styles.rowLeft}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {chevron && <Ionicons name="chevron-forward" size={16} color={colors.gray400} />}
    </View>
  </TouchableOpacity>
);

const sectionStyles = StyleSheet.create({
  header: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['4xl'],
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarLetter: {
    fontSize: 34,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  email: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadow.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    minHeight: 56,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  rowSub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textMuted,
  },
  actionButtons: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  signOutBtn: {
    marginBottom: 0,
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  footer: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
