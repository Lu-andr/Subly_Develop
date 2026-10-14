import { parseCurrencyAmount } from '../utils/currencyUtils';
import { Trial, TrialFormData } from '../types';
import { toISODateString, computeTrialStatus } from '../utils/dateUtils';
import { readLocalData, updateLocalData } from './localStore';
function fields(form: TrialFormData) {
  const end = toISODateString(form.trial_end_date);
  return { service_name: form.service_name.trim(), service_logo: form.service_logo?.trim() || null,
    trial_start_date: toISODateString(form.trial_start_date), trial_end_date: end,
    charge_amount: parseCurrencyAmount(form.charge_amount), currency: form.currency,
    billing_cycle: form.billing_cycle, cancellation_url: form.cancellation_url?.trim() || null,
    notes: form.notes?.trim() || null, status: computeTrialStatus(end), cancelled_at: null };
}
export async function fetchTrials(userId: string): Promise<Trial[]> {
  return (await readLocalData()).trials.filter(t => t.user_id === userId).sort((a,b)=>a.trial_end_date.localeCompare(b.trial_end_date));
}
export async function fetchTrialById(id: string): Promise<Trial | null> {
  return (await readLocalData()).trials.find(t => t.id === id) ?? null;
}
export function createTrial(userId: string, form: TrialFormData): Promise<Trial> {
  return updateLocalData(data => {
    const now = new Date().toISOString();
    const trial: Trial = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, user_id: userId,
      ...fields(form), created_at: now, updated_at: now };
    data.trials.push(trial); return trial;
  });
}
export function updateTrial(id: string, form: TrialFormData): Promise<Trial> {
  return updateLocalData(data => {
    const index = data.trials.findIndex(t => t.id === id);
    if (index < 0) throw new Error('Record not found.');
    return data.trials[index] = { ...data.trials[index], ...fields(form), updated_at: new Date().toISOString() };
  });
}
export function markTrialCancelled(id: string): Promise<Trial> {
  return updateLocalData(data => {
    const t = data.trials.find(t => t.id === id);
    if (!t) throw new Error('Record not found.');
    t.status = 'CANCELLED'; t.cancelled_at = new Date().toISOString(); t.updated_at = t.cancelled_at; return t;
  });
}
export function deleteTrial(id: string): Promise<void> {
  return updateLocalData(data => { data.trials = data.trials.filter(t => t.id !== id); });
}
export function refreshTrialStatuses(userId: string): Promise<void> {
  return updateLocalData(data => {
    for (const t of data.trials) if (t.user_id === userId) t.status = computeTrialStatus(t.trial_end_date, t.cancelled_at);
  });
}
