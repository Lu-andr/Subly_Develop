// TrialGuard — Date Utilities
import { TrialStatus } from '../types';

export function parseLocalDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(value);
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function calendarDay(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
}

/**
 * Calculate days remaining from today to the trial end date.
 * Returns a negative number if the trial has already expired.
 */
export function getDaysRemaining(trialEndDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = parseLocalDate(trialEndDate);
  endDate.setHours(0, 0, 0, 0);

  return calendarDay(endDate) - calendarDay(today);
}

/**
 * Compute the trial status based on the end date and manual cancellation.
 */
export function computeTrialStatus(
  trialEndDate: string,
  cancelledAt?: string | null
): TrialStatus {
  if (cancelledAt) return 'CANCELLED';

  const daysRemaining = getDaysRemaining(trialEndDate);

  if (daysRemaining < 0) return 'EXPIRED';
  if (daysRemaining <= 3) return 'EXPIRING_SOON';
  return 'ACTIVE';
}

/**
 * Get a human-readable countdown string.
 */
export function getCountdownLabel(daysRemaining: number): string {
  if (daysRemaining < 0) return 'Expired';
  if (daysRemaining === 0) return 'Ends today';
  if (daysRemaining === 1) return '1 day remaining';
  return `${daysRemaining} days remaining`;
}

/**
 * Format a date string like "Sep 15, 2026"
 */
export function formatDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a Date object to YYYY-MM-DD string for the database.
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the total days of a trial.
 */
export function getTotalDays(startDate: string, endDate: string): number {
  const start = parseLocalDate(startDate);
  start.setHours(0, 0, 0, 0);
  const end = parseLocalDate(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.max(1, calendarDay(end) - calendarDay(start));
}

/**
 * Get progress ratio (0 to 1) of how much of the trial period has been consumed.
 */
export function getTrialProgress(startDate: string, endDate: string): number {
  const totalDays = getTotalDays(startDate, endDate);
  const daysRemaining = getDaysRemaining(endDate);
  const daysUsed = totalDays - daysRemaining;
  return Math.min(1, Math.max(0, daysUsed / totalDays));
}

/**
 * Get greeting based on current time.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Calculate the scheduled notification date for X days before trial end.
 * Returns null if the date is in the past.
 */
export function getNotificationDate(
  trialEndDate: string,
  daysBefore: number
): Date | null {
  const endDate = parseLocalDate(trialEndDate);
  endDate.setHours(9, 0, 0, 0); // 9 AM notification

  const notifyDate = new Date(endDate);
  notifyDate.setDate(notifyDate.getDate() - daysBefore);

  const now = new Date();
  if (notifyDate <= now) return null;

  return notifyDate;
}
