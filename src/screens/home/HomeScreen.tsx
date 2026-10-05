// Subly — Home Dashboard Screen (Mobbin-inspired Personal Finance Dashboard)
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Trial } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { borderRadius, spacing, shadow } from '../../constants/spacing';
import { TrialCard } from '../../components/trial/TrialCard';
import { MoneyAtRiskCard } from '../../components/trial/MoneyAtRiskCard';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingScreen';
import { formatCurrency, formatCurrencyTotals, BILLING_CYCLE_LABELS } from '../../utils/currencyUtils';
import { getGreeting, getDaysRemaining, formatDate } from '../../utils/dateUtils';
import {
  getActiveTrials,
  getExpiringSoon,
  getMoneyAtRiskTrials,
} from '../../hooks/useTrials';

interface HomeScreenProps {
  trials: Trial[];
  loading: boolean;
  refreshing: boolean;
  userName?: string;
  onRefresh: () => void;
  onAddTrial: () => void;
  onViewTrial: (trial: Trial) => void;
}

type FilterChip = 'all' | 'urgent' | 'week' | 'monthly';

export const HomeScreen: React.FC<HomeScreenProps> = ({
  trials,
  loading,
  refreshing,
  userName,
  onRefresh,
  onAddTrial,
  onViewTrial,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<FilterChip>('all');

  const greeting = getGreeting();
  const activeTrials = useMemo(() => getActiveTrials(trials), [trials]);
  const expiringSoon = useMemo(() => getExpiringSoon(trials, 7), [trials]);
  const atRiskTrials = useMemo(() => getMoneyAtRiskTrials(trials), [trials]);

  const urgentTrials = useMemo(() => {
    return activeTrials.filter((t) => {
      const days = getDaysRemaining(t.trial_end_date);
      return days >= 0 && days <= 3;
    });
  }, [activeTrials]);

  // Filtered trial list based on active chip
  const displayedTrials = useMemo(() => {
    switch (selectedFilter) {
      case 'urgent':
        return urgentTrials;
      case 'week':
        return expiringSoon;
      case 'monthly':
        return activeTrials.filter((t) => t.billing_cycle === 'monthly');
      case 'all':
      default:
        return activeTrials;
    }
  }, [selectedFilter, activeTrials, urgentTrials, expiringSoon]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <PageLoader message="Syncing your trials..." />
      </SafeAreaView>
    );
  }

  const firstName = userName?.trim().split(' ')[0] ?? 'there';
  const initial = (firstName[0] ?? 'S').toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Top App Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View>
            <Text style={styles.greetingText}>{greeting}, {firstName}</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusLabel}>
                {activeTrials.length === 0
                  ? 'No active trials'
                  : `Protecting ${activeTrials.length} subscription${activeTrials.length > 1 ? 's' : ''}`}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={onAddTrial}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add new trial"
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Empty state */}
        {activeTrials.length === 0 && !loading && (
          <EmptyState
            icon="🛡️"
            title="Your wallet is protected"
            description="Add your current free trials. Subly will automatically monitor them and notify you before they charge."
            actionLabel="Add First Trial"
            onAction={onAddTrial}
          />
        )}

        {/* Active Content */}
        {activeTrials.length > 0 && (
          <>
            {/* Money at Risk Hero Summary */}
            <MoneyAtRiskCard trials={trials} />

            {/* Filter Pills */}
            <View style={styles.filterSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContainer}
              >
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedFilter === 'all' && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedFilter('all')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilter === 'all' && styles.filterChipTextActive,
                    ]}
                  >
                    All ({activeTrials.length})
                  </Text>
                </TouchableOpacity>

                {urgentTrials.length > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      styles.urgentChip,
                      selectedFilter === 'urgent' && styles.urgentChipActive,
                    ]}
                    onPress={() => setSelectedFilter('urgent')}
                  >
                    <Ionicons
                      name="flame"
                      size={13}
                      color={selectedFilter === 'urgent' ? colors.white : colors.danger}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        styles.urgentChipText,
                        selectedFilter === 'urgent' && styles.filterChipTextActive,
                      ]}
                    >
                      Urgent ({urgentTrials.length})
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedFilter === 'week' && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedFilter('week')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilter === 'week' && styles.filterChipTextActive,
                    ]}
                  >
                    Next 7 Days ({expiringSoon.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    selectedFilter === 'monthly' && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedFilter('monthly')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilter === 'monthly' && styles.filterChipTextActive,
                    ]}
                  >
                    Monthly
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Active Trials List */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {selectedFilter === 'urgent'
                    ? '🔥 Requires Immediate Action'
                    : selectedFilter === 'week'
                    ? '⏰ Expiring Within 7 Days'
                    : '📋 Active Subscriptions'}
                </Text>
                <Text style={styles.sectionCount}>
                  {displayedTrials.length} item{displayedTrials.length !== 1 ? 's' : ''}
                </Text>
              </View>

              {displayedTrials.map((trial) => (
                <TrialCard
                  key={trial.id}
                  trial={trial}
                  onPress={() => onViewTrial(trial)}
                />
              ))}
            </View>

            {/* Upcoming Charges Invoice Card */}
            {atRiskTrials.length > 0 && selectedFilter === 'all' && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>💳 Upcoming Renewals</Text>
                  <Text style={styles.sectionSubtitle}>Projected auto-debits</Text>
                </View>

                <View style={styles.chargesCard}>
                  {atRiskTrials.map((trial, index) => (
                    <View key={trial.id}>
                      <TouchableOpacity
                        style={styles.chargeRow}
                        onPress={() => onViewTrial(trial)}
                        activeOpacity={0.7}
                      >
                        <ServiceIcon serviceName={trial.service_name} size={36} />
                        <View style={styles.chargeInfo}>
                          <Text style={styles.chargeService} numberOfLines={1}>
                            {trial.service_name}
                          </Text>
                          <Text style={styles.chargeDate}>
                            Renews {formatDate(trial.trial_end_date)}
                          </Text>
                        </View>
                        <View style={styles.chargeAmountContainer}>
                          <Text style={styles.chargeAmount}>
                            {formatCurrency(trial.charge_amount, trial.currency)}
                          </Text>
                          <Text style={styles.chargeCycle}>
                            /{BILLING_CYCLE_LABELS[trial.billing_cycle]?.toLowerCase() ?? trial.billing_cycle}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {index < atRiskTrials.length - 1 && (
                        <View style={styles.chargeDivider} />
                      )}
                    </View>
                  ))}

                  {/* Invoice Total */}
                  <View style={styles.chargeTotalDivider} />
                  <View style={styles.chargeTotalRow}>
                    <View>
                      <Text style={styles.chargeTotalLabel}>Total at Risk</Text>
                      <Text style={styles.chargeTotalSub}>If not cancelled in time</Text>
                    </View>
                    <Text style={styles.chargeTotalAmount}>
                      {formatCurrencyTotals(atRiskTrials)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryBg,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
  greetingText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.gray600,
  },
  addBtn: {
    width: 42,
    height: 42,
    backgroundColor: colors.primary,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scroll: { flex: 1 },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['4xl'],
  },
  filterSection: {
    marginBottom: spacing.base,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingRight: spacing.base,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.gray700,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  urgentChip: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  urgentChipActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  urgentChipText: {
    color: colors.danger,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textMuted,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  chargesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  chargeInfo: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  chargeService: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
  },
  chargeDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginTop: 1,
  },
  chargeAmountContainer: {
    alignItems: 'flex-end',
  },
  chargeAmount: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  chargeCycle: {
    fontSize: 10,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  chargeDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  chargeTotalDivider: {
    height: 1.5,
    backgroundColor: '#E2E8F0',
    marginVertical: spacing.xs,
  },
  chargeTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  chargeTotalLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  chargeTotalSub: {
    fontSize: 10,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  chargeTotalAmount: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
  },
});
