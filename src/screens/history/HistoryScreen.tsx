// Subly — History Screen (Mobbin-inspired Savings & History Tracker)
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Trial } from '../../types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { borderRadius, shadow, spacing } from '../../constants/spacing';
import { EmptyState } from '../../components/ui/EmptyState';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import { PageLoader } from '../../components/ui/LoadingScreen';
import { formatDate } from '../../utils/dateUtils';
import { formatCurrency, formatCurrencyTotals, BILLING_CYCLE_LABELS } from '../../utils/currencyUtils';
import { getHistoryTrials } from '../../hooks/useTrials';

interface HistoryScreenProps {
  trials: Trial[];
  loading: boolean;
  onViewTrial: (trial: Trial) => void;
}

const HistoryCard: React.FC<{ trial: Trial; onPress: () => void }> = ({
  trial,
  onPress,
}) => {
  const isCancelled = trial.status === 'CANCELLED';
  const cycleLabel = BILLING_CYCLE_LABELS[trial.billing_cycle] ?? trial.billing_cycle;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${trial.service_name} - ${isCancelled ? 'Cancelled' : 'Expired'}`}
    >
      <ServiceIcon serviceName={trial.service_name} size={44} />
      <View style={styles.cardInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.cardServiceName} numberOfLines={1}>
            {trial.service_name}
          </Text>
          <View style={[styles.statusPill, isCancelled ? styles.cancelledPill : styles.expiredPill]}>
            <Ionicons
              name={isCancelled ? 'checkmark-circle' : 'close-circle'}
              size={12}
              color={isCancelled ? colors.success : colors.danger}
            />
            <Text style={[styles.statusPillText, isCancelled ? styles.cancelledText : styles.expiredText]}>
              {isCancelled ? 'Cancelled' : 'Expired'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.cardCharge}>
            {formatCurrency(trial.charge_amount, trial.currency)}/{cycleLabel.toLowerCase()}
          </Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.cardDate}>
            {isCancelled && trial.cancelled_at
              ? formatDate(trial.cancelled_at.split('T')[0])
              : formatDate(trial.trial_end_date)}
          </Text>
        </View>

        {isCancelled && (
          <View style={styles.savingsTag}>
            <Text style={styles.savingsTagText}>
              Marked cancelled: {formatCurrency(trial.charge_amount, trial.currency)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  trials,
  loading,
  onViewTrial,
}) => {
  const history = getHistoryTrials(trials);

  const cancelledCount = history.filter((t) => t.status === 'CANCELLED').length;
  const expiredCount = history.filter((t) => t.status === 'EXPIRED').length;

  // Calculate cumulative money saved from cancellations
  const totalSaved = useMemo(() => {
    return formatCurrencyTotals(history.filter((t) => t.status === 'CANCELLED'));
  }, [history]);

  if (loading) return <PageLoader message="Loading history..." />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={
          history.length > 0 ? (
            <View style={styles.headerContainer}>
              {/* Money Saved Hero Card */}
              {cancelledCount > 0 && (
                <View style={styles.savedCard}>
                  <View style={styles.savedIconCircle}>
                    <Ionicons name="sparkles" size={24} color={colors.success} />
                  </View>
                  <View style={styles.savedContent}>
                    <Text style={styles.savedLabel}>MARKED CANCELLED</Text>
                    <Text style={styles.savedAmount}>
                      {totalSaved}
                    </Text>
                    <Text style={styles.savedSubtitle}>
                      Amounts recorded by you; cancellation is not verified
                    </Text>
                  </View>
                </View>
              )}

              {/* Stats Bar */}
              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{cancelledCount}</Text>
                  <Text style={styles.statLabel}>Marked cancelled</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.gray700 }]}>
                    {expiredCount}
                  </Text>
                  <Text style={styles.statLabel}>Expired</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Completed Subscriptions</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <HistoryCard trial={item} onPress={() => onViewTrial(item)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="📂"
            title="No history yet"
            description="When you cancel trials or when they expire, they will be archived here along with your calculated savings."
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerContainer: {
    marginBottom: spacing.md,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: borderRadius['2xl'],
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    marginBottom: spacing.md,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    gap: spacing.md,
  },
  savedIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedContent: {
    flex: 1,
  },
  savedLabel: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
    letterSpacing: 0.8,
  },
  savedAmount: {
    fontSize: 28,
    fontFamily: typography.fontFamily.bold,
    color: '#15803D',
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  savedSubtitle: {
    fontSize: 11,
    fontFamily: typography.fontFamily.regular,
    color: '#166534',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.base,
    ...shadow.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.success,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing['4xl'],
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardServiceName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardCharge: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.gray700,
  },
  dotSeparator: {
    marginHorizontal: 6,
    color: colors.gray400,
    fontSize: 10,
  },
  cardDate: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
  savingsTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  savingsTagText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: '#15803D',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  cancelledPill: {
    backgroundColor: colors.successBg,
  },
  expiredPill: {
    backgroundColor: colors.dangerBg,
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.semiBold,
  },
  cancelledText: { color: colors.success },
  expiredText: { color: colors.danger },
});
