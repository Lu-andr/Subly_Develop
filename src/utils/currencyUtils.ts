// TrialGuard — Currency Utilities

import { Currency } from '../types';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  RUB: '₽',
  KZT: '₸',
  UZS: 'soʻm',
  VND: '₫',
  PHP: '₱',
  ZAR: 'R',
  // Retain symbols for previously saved records and existing service presets.
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
};

export const CURRENCY_OPTIONS: { label: string; value: Currency }[] = [
  { label: '₽ Российский рубль (RUB)', value: 'RUB' },
  { label: '₸ Казахский тенге (KZT)', value: 'KZT' },
  { label: 'soʻm Узбекский сом (UZS)', value: 'UZS' },
  { label: '₫ Вьетнамский донг (VND)', value: 'VND' },
  { label: '₱ Филиппинское песо (PHP)', value: 'PHP' },
  { label: 'R Южноафриканский рэнд (ZAR)', value: 'ZAR' },
];

const CURRENCY_LOCALES: Partial<Record<Currency, string>> = {
  RUB: 'ru-RU',
  KZT: 'kk-KZ',
  UZS: 'uz-UZ',
  VND: 'vi-VN',
  PHP: 'en-PH',
  ZAR: 'en-ZA',
};

/**
 * Format a charge amount with currency symbol.
 * e.g. formatCurrency(119, 'RUB') → "₽119"
 */
export function formatCurrency(amount: number, currency: Currency = 'ZAR'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const locale = CURRENCY_LOCALES[currency] ?? 'en-IN';
  if (Number.isInteger(amount)) {
    return `${symbol}${amount.toLocaleString(locale)}`;
  }
  return `${symbol}${amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Billing cycle labels
 */
export const BILLING_CYCLE_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  custom: 'Custom',
};

/**
 * Validate that a string is a valid URL.
 */
export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Parse a manually entered amount without silently truncating decimal commas. */
export function parseCurrencyAmount(raw: string): number {
  const normalized = raw.trim().replace(/[\s\u00a0\u202f]/g, '').replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return NaN;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount <= 99999999.99 ? amount : NaN;
}

/** Keep currencies separate. These totals do not perform exchange-rate conversion. */
export function formatCurrencyTotals(records: { charge_amount: number; currency: Currency }[]): string {
  const totals = new Map<Currency, number>();
  for (const record of records) {
    totals.set(record.currency, (totals.get(record.currency) ?? 0) + Math.round(record.charge_amount * 100));
  }
  return [...totals].map(([currency, cents]) => formatCurrency(cents / 100, currency)).join(' · ') || formatCurrency(0);
}
