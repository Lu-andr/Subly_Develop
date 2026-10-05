// TrialGuard — Core TypeScript Types

export type TrialStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'CANCELLED';

export type BillingCycle = 'weekly' | 'monthly' | 'yearly' | 'custom';

// Legacy codes remain valid for existing records; selectable currencies are in currencyUtils.ts.
export type Currency = 'RUB' | 'KZT' | 'UZS' | 'VND' | 'PHP' | 'ZAR'
  | 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD';

export interface Trial {
  id: string;
  user_id: string;
  service_name: string;
  service_logo?: string | null;
  trial_start_date: string; // ISO date string YYYY-MM-DD
  trial_end_date: string;   // ISO date string YYYY-MM-DD
  charge_amount: number;
  currency: Currency;
  billing_cycle: BillingCycle;
  cancellation_url?: string | null;
  notes?: string | null;
  status: TrialStatus;
  cancelled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrialFormData {
  service_name: string;
  service_logo?: string;
  trial_start_date: Date;
  trial_end_date: Date;
  charge_amount: string; // string for input handling
  currency: Currency;
  billing_cycle: BillingCycle;
  cancellation_url?: string;
  notes?: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  seven_days: boolean;
  three_days: boolean;
  one_day: boolean;
  final_day: boolean;
  created_at: string;
  updated_at: string;
}

export interface MoneyAtRiskBreakdown {
  trial: Trial;
  amount: number;
}

export interface DashboardData {
  activeTrials: Trial[];
  expiringSoon: Trial[];
  moneyAtRisk: number;
  moneyAtRiskBreakdown: MoneyAtRiskBreakdown[];
}

// Analytics Events
export type AnalyticsEvent =
  | 'app_opened'
  | 'onboarding_completed'
  | 'trial_created'
  | 'trial_edited'
  | 'trial_deleted'
  | 'trial_viewed'
  | 'cancellation_link_opened'
  | 'trial_marked_cancelled'
  | 'notification_opened'
  | 'account_deleted';

export interface AnalyticsPayload {
  event: AnalyticsEvent;
  properties?: Record<string, string | number | boolean>;
}
