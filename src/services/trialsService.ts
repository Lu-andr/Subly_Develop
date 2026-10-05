// TrialGuard — Trials Service (Supabase CRUD)
import { parseCurrencyAmount } from '../utils/currencyUtils';
import { supabase } from '../lib/supabase';
import { Trial, TrialFormData, TrialStatus } from '../types';
import { toISODateString, computeTrialStatus } from '../utils/dateUtils';

/**
 * Fetch all trials for the current user.
 */
export async function fetchTrials(userId: string): Promise<Trial[]> {
  const { data, error } = await supabase
    .from('trials')
    .select('*')
    .eq('user_id', userId)
    .order('trial_end_date', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Trial[];
}

/**
 * Fetch a single trial by ID.
 */
export async function fetchTrialById(id: string): Promise<Trial | null> {
  const { data, error } = await supabase
    .from('trials')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(error.message);
  }
  return data as Trial;
}

/**
 * Create a new trial.
 */
export async function createTrial(
  userId: string,
  formData: TrialFormData
): Promise<Trial> {
  const startDateStr = toISODateString(formData.trial_start_date);
  const endDateStr = toISODateString(formData.trial_end_date);
  const status = computeTrialStatus(endDateStr);

  const insertData = {
    user_id: userId,
    service_name: formData.service_name.trim(),
    service_logo: formData.service_logo?.trim() ?? null,
    trial_start_date: startDateStr,
    trial_end_date: endDateStr,
    charge_amount: parseCurrencyAmount(formData.charge_amount),
    currency: formData.currency,
    billing_cycle: formData.billing_cycle,
    cancellation_url: formData.cancellation_url?.trim() || null,
    notes: formData.notes?.trim() || null,
    status,
    cancelled_at: null,
  };

  const { data, error } = await supabase
    .from('trials')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Trial;
}

/**
 * Update an existing trial.
 */
export async function updateTrial(
  id: string,
  formData: TrialFormData
): Promise<Trial> {
  const startDateStr = toISODateString(formData.trial_start_date);
  const endDateStr = toISODateString(formData.trial_end_date);
  const status = computeTrialStatus(endDateStr);

  const updateData = {
    service_name: formData.service_name.trim(),
    service_logo: formData.service_logo?.trim() ?? null,
    trial_start_date: startDateStr,
    trial_end_date: endDateStr,
    charge_amount: parseCurrencyAmount(formData.charge_amount),
    currency: formData.currency,
    billing_cycle: formData.billing_cycle,
    cancellation_url: formData.cancellation_url?.trim() || null,
    notes: formData.notes?.trim() || null,
    status,
    cancelled_at: null,
  };

  const { data, error } = await supabase
    .from('trials')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Trial;
}

/**
 * Mark a trial as cancelled.
 */
export async function markTrialCancelled(id: string): Promise<Trial> {
  const { data, error } = await supabase
    .from('trials')
    .update({
      status: 'CANCELLED' as TrialStatus,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Trial;
}

/**
 * Delete a trial permanently.
 */
export async function deleteTrial(id: string): Promise<void> {
  const { error } = await supabase.from('trials').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * Recompute and update statuses for all active/expiring trials.
 * Call this on app foreground to keep statuses accurate.
 */
export async function refreshTrialStatuses(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('trials')
    .select('id, trial_end_date, cancelled_at, status')
    .eq('user_id', userId)
    .not('status', 'in', '("CANCELLED","EXPIRED")');

  if (error || !data) return;

  const updates = data
    .map((trial) => {
      const newStatus = computeTrialStatus(trial.trial_end_date, trial.cancelled_at);
      if (newStatus !== trial.status) {
        return { id: trial.id, status: newStatus };
      }
      return null;
    })
    .filter(Boolean) as { id: string; status: TrialStatus }[];

  // Batch update in parallel
  await Promise.all(
    updates.map((u) =>
      supabase.from('trials').update({ status: u.status }).eq('id', u.id)
    )
  );
}
