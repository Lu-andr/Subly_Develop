-- Apply after 001_initial_schema.sql. Does not rewrite existing amounts or currencies.
ALTER TABLE public.trials ALTER COLUMN currency SET DEFAULT 'ZAR';
ALTER TABLE public.trials ADD CONSTRAINT trials_amount_nonnegative CHECK (charge_amount >= 0) NOT VALID;
ALTER TABLE public.trials ADD CONSTRAINT trials_dates_ordered CHECK (trial_end_date > trial_start_date) NOT VALID;
ALTER TABLE public.trials ADD CONSTRAINT trials_billing_cycle_valid CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly', 'custom')) NOT VALID;
ALTER TABLE public.trials ADD CONSTRAINT trials_currency_valid CHECK (currency IN ('RUB', 'KZT', 'UZS', 'VND', 'PHP', 'ZAR', 'INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD')) NOT VALID;
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.handle_updated_at() SET search_path = '';
-- Review existing rows before VALIDATE CONSTRAINT; NOT VALID still protects new writes.
