import { parseCurrencyAmount } from './currencyUtils';
// TrialGuard — Validation Utilities

/**
 * Validate trial form fields.
 * Returns an object with field-level error messages.
 */
export interface TrialFormErrors {
  service_name?: string;
  trial_start_date?: string;
  trial_end_date?: string;
  charge_amount?: string;
  cancellation_url?: string;
}

export function validateTrialForm(data: {
  service_name: string;
  trial_start_date: Date | null;
  trial_end_date: Date | null;
  charge_amount: string;
  cancellation_url?: string;
}): TrialFormErrors {
  const errors: TrialFormErrors = {};

  // Service name
  if (!data.service_name || data.service_name.trim().length === 0) {
    errors.service_name = 'Service name is required.';
  } else if (data.service_name.trim().length > 100) {
    errors.service_name = 'Service name must be under 100 characters.';
  }

  // Dates
  if (!data.trial_start_date || !Number.isFinite(data.trial_start_date.getTime())) {
    errors.trial_start_date = 'Start date is required.';
  }

  if (!data.trial_end_date || !Number.isFinite(data.trial_end_date.getTime())) {
    errors.trial_end_date = 'End date is required.';
  } else if (
    data.trial_start_date &&
    data.trial_end_date <= data.trial_start_date
  ) {
    errors.trial_end_date = 'Trial end date must be after the start date.';
  }

  // Charge amount
  const amount = parseCurrencyAmount(data.charge_amount);
  if (!data.charge_amount || data.charge_amount.trim() === '') {
    errors.charge_amount = 'Charge amount is required.';
  } else if (isNaN(amount) || amount < 0) {
    errors.charge_amount = 'Please enter a valid charge amount (0 or more).';
  }

  // Cancellation URL (optional but must be valid if provided)
  if (data.cancellation_url && data.cancellation_url.trim().length > 0) {
    try {
      const url = new URL(data.cancellation_url.trim());
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        errors.cancellation_url = 'Please enter a valid URL (http or https).';
      }
    } catch {
      errors.cancellation_url = 'Please enter a valid cancellation URL.';
    }
  }

  return errors;
}

export function hasErrors(errors: TrialFormErrors): boolean {
  return Object.values(errors).some((v) => v !== undefined);
}
