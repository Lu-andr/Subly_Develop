// TrialGuard — Notification Preferences Hook
import { useState, useEffect, useCallback } from 'react';
import { NotificationPreferences } from '../types';
import { updateLocalData } from '../services/localStore';

const DEFAULT_PREFS: Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  notifications_enabled: true,
  seven_days: true,
  three_days: true,
  one_day: true,
  final_day: true,
};

export function useNotificationPreferences(userId: string | null) {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrefs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await updateLocalData((store) => {
        if (!store.preferences) {
          const now = new Date().toISOString();
          store.preferences = { id: 'local-preferences', user_id: userId, created_at: now, updated_at: now, ...DEFAULT_PREFS };
        }
        return store.preferences;
      });
      setPrefs(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const updatePrefs = useCallback(
    async (updates: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      if (!userId) return;
      setSaving(true);
      try {
        const data = await updateLocalData((store) => {
          const now = new Date().toISOString();
          const previous = store.preferences ?? { id: 'local-preferences', user_id: userId, created_at: now, updated_at: now, ...DEFAULT_PREFS };
          store.preferences = { ...previous, ...updates, updated_at: now };
          return store.preferences;
        });
        setPrefs(data);
        setError(null);
      } catch (e: any) {
        setError(e.message ?? 'Failed to save preferences.');
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [userId]
  );

  // Return default prefs shape while loading (so callers always have something)
  const effectivePrefs: NotificationPreferences = prefs ?? {
    id: '',
    user_id: userId ?? '',
    created_at: '',
    updated_at: '',
    ...DEFAULT_PREFS,
  };

  return {
    prefs: effectivePrefs,
    loading,
    saving,
    error,
    updatePrefs,
    refresh: fetchPrefs,
  };
}
