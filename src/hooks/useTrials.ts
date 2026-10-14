// TrialGuard — Trials Hook
import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { Trial, NotificationPreferences } from '../types';
import {
  fetchTrials,
  createTrial,
  updateTrial,
  markTrialCancelled,
  deleteTrial,
  refreshTrialStatuses,
} from '../services/trialsService';
import { TrialFormData } from '../types';
import {
  cancelTrialNotifications,
} from '../services/notificationService';
import { getDaysRemaining, computeTrialStatus } from '../utils/dateUtils';

interface UseTrialsState {
  trials: Trial[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

interface UseTrialsActions {
  refresh: () => Promise<void>;
  addTrial: (formData: TrialFormData, prefs: NotificationPreferences) => Promise<Trial>;
  editTrial: (id: string, formData: TrialFormData, prefs: NotificationPreferences) => Promise<Trial>;
  cancelTrial: (id: string) => Promise<Trial>;
  removeTrial: (id: string) => Promise<void>;
  getTrialById: (id: string) => Trial | undefined;
  clearError: () => void;
}

export function useTrials(userId: string | null): UseTrialsState & UseTrialsActions {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!userId) {
      setTrials([]);
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Direct 1-roundtrip fetch for instant UI load
      const data = await fetchTrials(userId);
      const freshData = data.map((t) => {
        const currentStatus = computeTrialStatus(t.trial_end_date, t.cancelled_at);
        return currentStatus !== t.status ? { ...t, status: currentStatus } : t;
      });
      setTrials(freshData);
      setError(null);

      // Background DB sync without blocking UI responsiveness
      refreshTrialStatuses(userId).catch(() => {});
    } catch (e: any) {
      setError(e.message ?? 'Unable to load trials. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void load(true); });
    return () => subscription.remove();
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  const addTrial = useCallback(async (
    formData: TrialFormData,
    prefs: NotificationPreferences
  ): Promise<Trial> => {
    if (!userId) throw new Error('Not authenticated');
    const trial = await createTrial(userId, formData);
    setTrials((prev) => [...prev, trial].sort(
      (a, b) => new Date(a.trial_end_date).getTime() - new Date(b.trial_end_date).getTime()
    ));
    return trial;
  }, [userId]);

  const editTrial = useCallback(async (
    id: string,
    formData: TrialFormData,
    prefs: NotificationPreferences
  ): Promise<Trial> => {
    const updated = await updateTrial(id, formData);
    // Cancel old notifications and reschedule
    await cancelTrialNotifications(id);
    setTrials((prev) =>
      prev.map((t) => (t.id === id ? updated : t))
        .sort((a, b) => new Date(a.trial_end_date).getTime() - new Date(b.trial_end_date).getTime())
    );
    return updated;
  }, []);

  const cancelTrial = useCallback(async (id: string): Promise<Trial> => {
    const cancelled = await markTrialCancelled(id);
    await cancelTrialNotifications(id);
    setTrials((prev) => prev.map((t) => (t.id === id ? cancelled : t)));
    return cancelled;
  }, []);

  const removeTrial = useCallback(async (id: string): Promise<void> => {
    await deleteTrial(id);
    await cancelTrialNotifications(id);
    setTrials((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTrialById = useCallback(
    (id: string) => trials.find((t) => t.id === id),
    [trials]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    trials,
    loading,
    error,
    refreshing,
    refresh,
    addTrial,
    editTrial,
    cancelTrial,
    removeTrial,
    getTrialById,
    clearError,
  };
}

// Derived selectors
export function getActiveTrials(trials: Trial[]): Trial[] {
  return trials.filter((t) => t.status === 'ACTIVE' || t.status === 'EXPIRING_SOON');
}

export function getExpiringSoon(trials: Trial[], days = 7): Trial[] {
  return trials.filter(
    (t) =>
      (t.status === 'ACTIVE' || t.status === 'EXPIRING_SOON') &&
      getDaysRemaining(t.trial_end_date) <= days
  );
}

export function getHistoryTrials(trials: Trial[]): Trial[] {
  return trials.filter(
    (t) => t.status === 'CANCELLED' || t.status === 'EXPIRED'
  );
}

export function calculateMoneyAtRisk(trials: Trial[]): number {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return trials
    .filter(
      (t) =>
        (t.status === 'ACTIVE' || t.status === 'EXPIRING_SOON') &&
        new Date(t.trial_end_date) <= thirtyDaysFromNow
    )
    .reduce((sum, t) => sum + t.charge_amount, 0);
}

export function getMoneyAtRiskTrials(trials: Trial[]): Trial[] {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return trials.filter(
    (t) =>
      (t.status === 'ACTIVE' || t.status === 'EXPIRING_SOON') &&
      new Date(t.trial_end_date) <= thirtyDaysFromNow
  );
}
