// Subly — Trials Screen (Mobbin-inspired Subscription Manager List)
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { borderRadius, spacing, shadow } from '../../constants/spacing';
import { TrialCard } from '../../components/trial/TrialCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingScreen';
import { getActiveTrials, getExpiringSoon } from '../../hooks/useTrials';
import { formatCurrencyTotals } from '../../utils/currencyUtils';

type Tab = 'active' | 'expiring' | 'all';
type SortOption = 'ending_soonest' | 'highest_charge' | 'name_asc' | 'recently_added';

interface TrialsScreenProps {
  trials: Trial[];
  loading: boolean;
  onAddTrial: () => void;
  onViewTrial: (trial: Trial) => void;
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'expiring', label: 'Expiring Soon' },
  { key: 'all', label: 'All' },
];

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'ending_soonest', label: 'Ending Soonest' },
  { key: 'highest_charge', label: 'Highest Amount' },
  { key: 'name_asc', label: 'Name (A-Z)' },
  { key: 'recently_added', label: 'Recently Added' },
];

export const TrialsScreen: React.FC<TrialsScreenProps> = ({
  trials,
  loading,
  onAddTrial,
  onViewTrial,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [sortBy, setSortBy] = useState<SortOption>('ending_soonest');
  const [showSort, setShowSort] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeTrials = getActiveTrials(trials);
  const expiringSoon = getExpiringSoon(trials, 7);

  // Total active monthly burn
  const totalCommitment = useMemo(() => {
    return formatCurrencyTotals(activeTrials);
  }, [activeTrials]);

  const filteredTrials = useMemo(() => {
    let list: Trial[] = [];
    if (activeTab === 'active') {
      list = activeTrials;
    } else if (activeTab === 'expiring') {
      list = expiringSoon;
    } else {
      list = trials;
    }

    // Apply Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => t.service_name.toLowerCase().includes(q));
    }

    // Apply Sorting
    switch (sortBy) {
      case 'ending_soonest':
        return [...list].sort(
          (a, b) =>
            new Date(a.trial_end_date).getTime() -
            new Date(b.trial_end_date).getTime()
        );
      case 'highest_charge':
        return [...list].sort((a, b) => b.charge_amount - a.charge_amount);
      case 'name_asc':
        return [...list].sort((a, b) =>
          a.service_name.localeCompare(b.service_name)
        );
      case 'recently_added':
        return [...list].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      default:
        return list;
    }
  }, [trials, activeTab, sortBy, searchQuery, activeTrials, expiringSoon]);

  if (loading) return <PageLoader message="Loading trials..." />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Subscriptions</Text>
          <Text style={styles.subtitle}>
            {activeTrials.length} active • {totalCommitment} at risk
          </Text>
        </View>
        <TouchableOpacity
          onPress={onAddTrial}
          style={styles.addBtn}
          accessibilityRole="button"
          accessibilityLabel="Add new trial"
        >
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Real-time Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.gray400} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your subscriptions..."
          placeholderTextColor={colors.gray400}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsRow}>
        <View style={styles.tabs}>
          {TABS.map((tab) => {
            const count =
              tab.key === 'active'
                ? activeTrials.length
                : tab.key === 'expiring'
                ? expiringSoon.length
                : trials.length;
            const isSelected = activeTab === tab.key;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isSelected && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                <View style={[styles.tabCountBadge, isSelected && styles.tabCountBadgeActive]}>
                  <Text style={[styles.tabCountText, isSelected && styles.tabCountTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sort Trigger Button */}
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => setShowSort(!showSort)}
          accessibilityRole="button"
          accessibilityLabel="Sort options"
        >
          <Ionicons name="swap-vertical" size={16} color={colors.gray700} />
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown */}
      {showSort && (
        <View style={styles.sortDropdown}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortOption, sortBy === opt.key && styles.sortOptionActive]}
              onPress={() => {
                setSortBy(opt.key);
                setShowSort(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === opt.key && styles.sortOptionTextActive,
                ]}
              >
                {opt.label}
              </Text>
              {sortBy === opt.key && (
                <Ionicons name="checkmark" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* List */}
      <FlatList
        data={filteredTrials}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({ item }) => (
          <TrialCard trial={item} onPress={() => onViewTrial(item)} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={searchQuery ? '🔍' : activeTab === 'expiring' ? '🎉' : '📋'}
            title={
              searchQuery
                ? 'No matching subscriptions'
                : activeTab === 'expiring'
                ? "You're all clear!"
                : 'No active trials'
            }
            description={
              searchQuery
                ? `No trials found matching "${searchQuery}".`
                : activeTab === 'expiring'
                ? 'No subscriptions are expiring in the next 7 days.'
                : "Add a free trial so Subly can remind you before you're charged."
            }
            actionLabel={!searchQuery && activeTab !== 'expiring' ? 'Add Trial' : undefined}
            onAction={!searchQuery && activeTab !== 'expiring' ? onAddTrial : undefined}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.base,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xs,
  },
  tabs: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.gray700,
  },
  tabTextActive: {
    color: colors.white,
    fontFamily: typography.fontFamily.semiBold,
  },
  tabCountBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  tabCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabCountText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.gray700,
  },
  tabCountTextActive: {
    color: colors.white,
  },
  sortBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  sortDropdown: {
    marginHorizontal: spacing.base,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.sm,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sortOptionActive: {
    backgroundColor: colors.primaryBg,
  },
  sortOptionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  sortOptionTextActive: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
  },
  list: {
    padding: spacing.base,
    paddingBottom: spacing['4xl'],
    flexGrow: 1,
  },
});
