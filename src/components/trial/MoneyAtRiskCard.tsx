// Subly — Money At Risk Card (Mobbin-inspired Fintech Summary)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trial } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { borderRadius, shadow, spacing } from '../../constants/spacing';
import { formatCurrencyTotals } from '../../utils/currencyUtils';
import { getMoneyAtRiskTrials } from '../../hooks/useTrials';
import { getDaysRemaining } from '../../utils/dateUtils';

interface MoneyAtRiskCardProps {
  trials: Trial[];
  onPress?: () => void;
}

export const MoneyAtRiskCard: React.FC<MoneyAtRiskCardProps> = ({ trials, onPress }) => {
  const atRiskTrials = getMoneyAtRiskTrials(trials);
  const total = formatCurrencyTotals(atRiskTrials);
  const activeTrials = trials.filter(
    (t) => t.status === 'ACTIVE' || t.status === 'EXPIRING_SOON'
  );

  const expiringThisWeek = atRiskTrials.filter((t) => {
    const days = getDaysRemaining(t.trial_end_date);
    return days >= 0 && days <= 7;
  });

  // Calculate earliest renewal in days
  const minDaysRemaining = activeTrials.length > 0
    ? Math.min(...activeTrials.map((t) => Math.max(0, getDaysRemaining(t.trial_end_date))))
    : null;

  if (atRiskTrials.length === 0) {
    return (
      <View style={[styles.card, styles.safeCard]}>
        <View style={styles.safeIconContainer}>
          <Ionicons name="shield-checkmark" size={28} color={colors.success} />
        </View>
        <View style={styles.safeText}>
          <View style={styles.safeHeaderRow}>
            <Text style={styles.safeTitle}>No upcoming tracked charges</Text>
            <View style={styles.safeBadge}>
              <Text style={styles.safeBadgeText}>SAFE</Text>
            </View>
          </View>
          <Text style={styles.safeDesc}>
            No tracked trial ends in the next 30 days. Check your provider for actual billing dates.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel={`Money at risk: ${total} from ${atRiskTrials.length} trials`}
    >
      {/* Top Tag & Security Badge */}
      <View style={styles.topRow}>
        <View style={styles.badgeContainer}>
          <Ionicons name="shield" size={14} color={colors.white} />
          <Text style={styles.badgeText}>MONITORING ACTIVE</Text>
        </View>
        <Text style={styles.periodText}>Next 30 Days</Text>
      </View>

      {/* Main Amount */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Total Money at Risk</Text>
        <Text style={styles.amount}>{total}</Text>
        <Text style={styles.subtitle}>
          Scheduled to renew if not cancelled before trial ends
        </Text>
      </View>

      {/* 3-Stat Metric Row */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{activeTrials.length}</Text>
          <Text style={styles.metricLabel}>Active Trials</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>
            {minDaysRemaining !== null
              ? minDaysRemaining === 0
                ? 'Today'
                : `${minDaysRemaining}d`
              : '—'}
          </Text>
          <Text style={styles.metricLabel}>Next Renewal</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{expiringThisWeek.length}</Text>
          <Text style={styles.metricLabel}>Due This Week</Text>
        </View>
      </View>

      {/* Urgency Alert Strip */}
      {expiringThisWeek.length > 0 && (
        <View style={styles.urgentBanner}>
          <View style={styles.urgentLeft}>
            <Ionicons name="flame" size={16} color={colors.white} />
            <Text style={styles.urgentText}>
              {expiringThisWeek.length} trial{expiringThisWeek.length > 1 ? 's' : ''} expiring this week!
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.8)" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.base,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  safeCard: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    padding: spacing.base,
    shadowColor: '#16A34A',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  safeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  safeText: {
    flex: 1,
  },
  safeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  safeTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  safeBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  safeBadgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
    letterSpacing: 0.5,
  },
  safeDesc: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.gray600,
    lineHeight: 16,
    marginTop: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
    letterSpacing: 0.8,
  },
  periodText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  amountContainer: {
    marginBottom: spacing.md,
  },
  amountLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.82)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  amount: {
    fontSize: 38,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
    letterSpacing: -1,
    lineHeight: 44,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  urgentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urgentText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.white,
  },
});
