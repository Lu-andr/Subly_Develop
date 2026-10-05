// TrialGuard — Notification Preferences Hook
import { useState, useEffect, useCallback } from 'react';
import { NotificationPreferences } from '../types';
import { supabase } from '../lib/supabase';

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
      const { data, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (data) {
        setPrefs(data as NotificationPreferences);
      } else {
        const { data: inserted, error: insertError } = await supabase.from('notification_preferences')
          .upsert({ user_id: userId, ...DEFAULT_PREFS }, { onConflict: 'user_id' }).select().single();
        if (insertError) throw insertError;
        setPrefs(inserted as NotificationPreferences);
      }
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
        const { data, error: updateError } = await supabase
          .from('notification_preferences')
          .update(updates)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) throw updateError;
        setPrefs(data as NotificationPreferences);
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
