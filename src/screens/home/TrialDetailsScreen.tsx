// Subly — Trial Details Screen (Mobbin-inspired Personal Finance Management)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Trial, BillingCycle } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { borderRadius, spacing, shadow } from '../../constants/spacing';
import { Button } from '../../components/ui/Button';
import { Badge, statusToBadgeProps } from '../../components/ui/Badge';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import {
  getDaysRemaining,
  getCountdownLabel,
  getTrialProgress,
  formatDate,
} from '../../utils/dateUtils';
import { formatCurrency, BILLING_CYCLE_LABELS } from '../../utils/currencyUtils';
import { analytics } from '../../services/analyticsService';

interface TrialDetailsScreenProps {
  trial: Trial;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onMarkCancelled: () => Promise<void>;
  onBack: () => void;
}

export const TrialDetailsScreen: React.FC<TrialDetailsScreenProps> = ({
  trial,
  onEdit,
  onDelete,
  onMarkCancelled,
  onBack,
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const daysRemaining = getDaysRemaining(trial.trial_end_date);
  const countdownLabel = getCountdownLabel(daysRemaining);
  const progress = getTrialProgress(trial.trial_start_date, trial.trial_end_date);
  const badgeProps = statusToBadgeProps(trial.status);
  const cycleLabel = BILLING_CYCLE_LABELS[trial.billing_cycle] ?? trial.billing_cycle;

  const isActive = trial.status === 'ACTIVE' || trial.status === 'EXPIRING_SOON';
  const isCancelled = trial.status === 'CANCELLED';

  const isUrgent = daysRemaining <= 1 && daysRemaining >= 0;
  const isWarning = daysRemaining > 1 && daysRemaining <= 3;

  const countdownColor = isUrgent
    ? colors.danger
    : isWarning
    ? colors.warning
    : daysRemaining <= 7
    ? '#F59E0B'
    : colors.primary;

  const getAnnualizedCost = (amount: number, cycle: BillingCycle): number => {
    switch (cycle) {
      case 'weekly': return amount * 52;
      case 'monthly': return amount * 12;
      case 'yearly': return amount;
      case 'custom': return NaN;
      default: return amount * 12;
    }
  };

  const annualCost = getAnnualizedCost(trial.charge_amount, trial.billing_cycle);

  const handleOpenCancellationUrl = async () => {
    analytics.track('cancellation_link_opened', { trialId: trial.id });
    if (trial.cancellation_url) {
      try {
        await Linking.openURL(trial.cancellation_url);
        setTimeout(() => setShowConfirmModal(true), 1000);
      } catch {
        Alert.alert('Error', 'Unable to open the cancellation link.');
      }
    }
    setShowCancelModal(false);
  };

  const handleCancelTapped = () => {
    if (!trial.cancellation_url) {
      Alert.alert(
        'How to Cancel',
        trial.notes
          ? `No direct link saved.\n\nNotes: ${trial.notes}`
          : 'Go to the account or subscription settings page of the provider and choose "Cancel Subscription".',
        [
          { text: 'Later' },
          { text: 'Mark as Cancelled', onPress: handleMarkCancelled },
        ]
      );
      return;
    }
    setShowCancelModal(true);
  };

  const handleMarkCancelled = async () => {
    setShowConfirmModal(false);
    setCancelling(true);
    try {
      await onMarkCancelled();
      analytics.track('trial_marked_cancelled', { trialId: trial.id });
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to mark as cancelled.');
    } finally {
      setCancelling(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Trial',
      `Are you sure you want to delete "${trial.service_name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await onDelete();
              analytics.track('trial_deleted', { trialId: trial.id });
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to delete trial.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Subscription Details</Text>
        <TouchableOpacity
          onPress={onEdit}
          style={styles.editBtn}
          accessibilityRole="button"
          accessibilityLabel="Edit trial"
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrapper}>
            <ServiceIcon serviceName={trial.service_name} size={64} />
          </View>
          <Text style={styles.serviceName}>{trial.service_name}</Text>
          <Badge label={badgeProps.label} variant={badgeProps.variant} style={styles.badge} />

          {/* Countdown & Progress Section */}
          {isActive && (
            <View style={styles.countdownSection}>
              <View style={styles.countdownNumberRow}>
                <Text style={[styles.countdownNumber, { color: countdownColor }]}>
                  {daysRemaining <= 0 ? '0' : daysRemaining}
                </Text>
                <View style={styles.countdownUnitCol}>
                  <Text style={[styles.countdownUnitTitle, { color: countdownColor }]}>
                    {daysRemaining === 0
                      ? 'Ends today'
                      : daysRemaining === 1
                      ? 'Day Left'
                      : 'Days Remaining'}
                  </Text>
                  <Text style={styles.countdownUnitSub}>
                    Before auto-debit of {formatCurrency(trial.charge_amount, trial.currency)}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, Math.max(5, progress * 100))}%` as any,
                      backgroundColor: countdownColor,
                    },
                  ]}
                />
              </View>

              {/* Timeline markers */}
              <View style={styles.timelineRow}>
                <Text style={styles.timelineLabel}>
                  Started {formatDate(trial.trial_start_date)}
                </Text>
                <Text style={styles.timelineLabelBold}>
                  Renews {formatDate(trial.trial_end_date)}
                </Text>
              </View>
            </View>
          )}

          {isCancelled && (
            <View style={styles.cancelledCard}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <View style={styles.cancelledTextContainer}>
                <Text style={styles.cancelledTitle}>Trial Cancelled</Text>
                <Text style={styles.cancelledSub}>
                  Marked cancelled by you. Verify cancellation with the provider.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* 2x2 Financial Metrics Grid (Mobbin Fintech Standard) */}
        <View style={styles.gridSection}>
          <Text style={styles.sectionHeaderTitle}>Financial Overview</Text>
          <View style={styles.gridRow}>
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>Next Charge</Text>
              <Text style={styles.gridValue}>
                {formatCurrency(trial.charge_amount, trial.currency)}
              </Text>
              <Text style={styles.gridSub}>Per {cycleLabel.toLowerCase()}</Text>
            </View>
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>Billing Cycle</Text>
              <Text style={styles.gridValue}>{cycleLabel}</Text>
              <Text style={styles.gridSub}>Recurring frequency</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>Annual Estimate</Text>
              <Text style={styles.gridValue}>
                {Number.isFinite(annualCost) ? formatCurrency(annualCost, trial.currency) : 'Not available'}
              </Text>
              <Text style={styles.gridSub}>12-month commitment</Text>
            </View>
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>Renewal Date</Text>
              <Text style={styles.gridValueSmall}>
                {formatDate(trial.trial_end_date)}
              </Text>
              <Text style={styles.gridSub}>Next auto-debit</Text>
            </View>
          </View>
        </View>

        {/* Cancellation Roadmap Guide */}
        {isActive && (
          <View style={styles.guideCard}>
            <View style={styles.guideHeader}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
              <Text style={styles.guideTitle}>Cancellation Checklist</Text>
            </View>
            <View style={styles.guideStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Open the official {trial.service_name} cancellation page.
              </Text>
            </View>
            <View style={styles.guideStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Click 'Cancel Subscription' in their billing or plan settings.
              </Text>
            </View>
            <View style={styles.guideStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Return to Subly and tap 'Mark as Cancelled' to update your wallet.
              </Text>
            </View>

            {trial.cancellation_url && (
              <Button
                title={`Cancel on ${trial.service_name} ↗`}
                onPress={handleCancelTapped}
                fullWidth
                size="lg"
                style={styles.guideBtn}
              />
            )}
          </View>
        )}

        {/* Notes & Extra Info */}
        {(trial.notes || trial.cancellation_url) && (
          <View style={styles.notesCard}>
            {trial.notes ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={styles.infoValue}>{trial.notes}</Text>
              </View>
            ) : null}
            {trial.cancellation_url ? (
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Cancellation Portal</Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL(trial.cancellation_url!)}
                  accessibilityRole="link"
                >
                  <Text style={styles.urlLink} numberOfLines={1}>
                    {trial.cancellation_url}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

        {/* Primary Action CTAs */}
        <View style={styles.actionsContainer}>
          {isActive && (
            <Button
              title="✓ Mark as Cancelled"
              onPress={() => setShowConfirmModal(true)}
              variant="secondary"
              fullWidth
              size="lg"
              loading={cancelling}
              style={{ marginBottom: spacing.sm }}
            />
          )}

          <Button
            title="Delete Subscription"
            onPress={handleDelete}
            variant="ghost"
            fullWidth
            size="md"
            loading={deleting}
          />
        </View>
      </ScrollView>

      {/* Cancellation Link Modal */}
      <Modal visible={showCancelModal} onRequestClose={() => setShowCancelModal(false)} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Cancel {trial.service_name}</Text>
            <Text style={styles.modalDesc}>
              Subly will open {trial.service_name}'s official portal. After cancelling
              there, return here to mark it as cancelled.
            </Text>
            <View style={styles.modalWarning}>
              <Ionicons name="information-circle" size={18} color="#92400E" />
              <Text style={styles.modalWarningText}>
                Subly cannot automatically cancel on third-party sites. Complete the step on their page.
              </Text>
            </View>
            <Button
              title="Open Cancellation Page ↗"
              onPress={handleOpenCancellationUrl}
              fullWidth
              size="lg"
              style={{ marginBottom: spacing.sm }}
            />
            <Button
              title="Cancel"
              onPress={() => setShowCancelModal(false)}
              variant="ghost"
              fullWidth
              size="md"
            />
          </View>
        </View>
      </Modal>

      {/* Confirm Cancelled Modal */}
      <Modal visible={showConfirmModal} onRequestClose={() => setShowConfirmModal(false)} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Confirm Cancellation</Text>
            <Text style={styles.modalDesc}>
              Did you complete the cancellation for {trial.service_name}? We will mark
              this trial as cancelled so you don't receive reminders.
            </Text>
            <Button
              title="Yes, I Have Cancelled"
              onPress={handleMarkCancelled}
              fullWidth
              size="lg"
              loading={cancelling}
              style={{ marginBottom: spacing.sm }}
            />
            <Button
              title="Not Yet"
              onPress={() => setShowConfirmModal(false)}
              variant="ghost"
              fullWidth
              size="md"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray100,
  },
  topBarTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  editBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  editText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['5xl'],
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  heroIconWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceName: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  badge: {
    marginBottom: spacing.lg,
  },
  countdownSection: {
    width: '100%',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
  },
  countdownNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  countdownNumber: {
    fontSize: 52,
    fontFamily: typography.fontFamily.bold,
    lineHeight: 56,
    letterSpacing: -1.5,
    marginRight: spacing.md,
  },
  countdownUnitCol: {
    flex: 1,
  },
  countdownUnitTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: -0.2,
  },
  countdownUnitSub: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timelineLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  timelineLabelBold: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.gray800,
  },
  cancelledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    width: '100%',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  cancelledTextContainer: {
    flex: 1,
  },
  cancelledTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
  },
  cancelledSub: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.gray700,
    marginTop: 1,
  },
  gridSection: {
    marginBottom: spacing.base,
  },
  sectionHeaderTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  gridCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  gridLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  gridValueSmall: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  gridSub: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  guideCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  guideTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  stepText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.gray700,
    lineHeight: 20,
  },
  guideBtn: {
    marginTop: spacing.sm,
  },
  notesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  urlLink: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  actionsContainer: {
    marginTop: spacing.sm,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  modalHandle: {
    width: 44,
    height: 5,
    backgroundColor: colors.gray300,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  modalDesc: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  modalWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  modalWarningText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: '#92400E',
    lineHeight: 16,
  },
});
