// Parse only details present in user-pasted text. Presets identify services, not prices.
import { SERVICE_PRESETS } from '../constants/servicePresets';
import { BillingCycle, Currency } from '../types';
import { parseCurrencyAmount } from './currencyUtils';
import { parseLocalDate } from './dateUtils';

export interface ParsedTrialInfo {
  serviceName?: string;
  chargeAmount?: number;
  currency?: Currency;
  trialDays?: number;
  endDate?: Date;
  billingCycle?: BillingCycle;
  cancellationUrl?: string;
  confidenceNotes: string[];
}

export function parseTrialConfirmation(rawText: string): ParsedTrialInfo {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  const result: ParsedTrialInfo = { confidenceNotes: [] };
  const preset = SERVICE_PRESETS.find((p) => lower.includes(p.name.toLowerCase()) || lower.includes(p.name.toLowerCase().split(' ')[0]));
  if (preset) {
    result.serviceName = preset.name;
    result.cancellationUrl = preset.cancellationUrl;
  } else {
    result.serviceName = text.match(/(?:welcome to|subscribed to|free trial of|membership for)\s+([A-Za-z0-9 &+.'-]+?)(?:!|\.|,| for | free|\n|$)/i)?.[1]?.trim();
  }
  const codes = 'RUB|KZT|UZS|VND|PHP|ZAR|INR|USD|EUR|GBP|AUD|CAD';
  const number = '\\d+(?:[.,]\\d{1,2})?';
  const after = text.match(new RegExp(`\\b(${number})\\s*(${codes})\\b`, 'i'));
  const before = text.match(new RegExp(`\\b(${codes})\\s*(${number})\\b`, 'i'));
  const symbol = text.match(new RegExp(`(₽|₸|₫|₱|₹|\\$|€|£|\\bR\\b|so[ʻ’']m)\\s*(${number})`, 'i'));
  if (after || before) {
    const match = (after ?? before)!;
    result.currency = (after ? match[2] : match[1]).toUpperCase() as Currency;
    result.chargeAmount = parseCurrencyAmount(after ? match[1] : match[2]);
  } else if (symbol) {
    const currencies: Record<string, Currency> = { '₽': 'RUB', '₸': 'KZT', '₫': 'VND', '₱': 'PHP', '₹': 'INR', '$': 'USD', '€': 'EUR', '£': 'GBP', R: 'ZAR' };
    result.currency = currencies[symbol[1]] ?? (symbol[1].toLowerCase().startsWith('so') ? 'UZS' : undefined);
    result.chargeAmount = parseCurrencyAmount(symbol[2]);
  }
  if (result.chargeAmount !== undefined && !Number.isFinite(result.chargeAmount)) delete result.chargeAmount;
  const duration = text.match(/(?:free trial(?:\s+of|\s+for)?\s+|)(\d+)\s*[- ]?(day|week|month)s?\s+(?:free|trial)/i)
    ?? text.match(/free trial\s+(?:lasts|for)\s+(\d+)\s*(day|week|month)s?/i);
  if (duration) {
    result.trialDays = Number(duration[1]) * ({ day: 1, week: 7, month: 30 }[duration[2].toLowerCase()] ?? 1);
    const date = new Date();
    date.setDate(date.getDate() + result.trialDays);
    result.endDate = date;
    result.confidenceNotes.push('Duration estimated from pasted text; verify start and end dates.');
  }
  const date = text.match(/(?:ends? on|renews? on|first charge on|before|until)\s+(\d{4}-\d{2}-\d{2}|[A-Za-z]{3,9}\s+\d{1,2},?\s*\d{4})/i)?.[1];
  if (date) {
    const parsed = parseLocalDate(date);
    if (Number.isFinite(parsed.getTime())) result.endDate = parsed;
  }
  if (/per year|annually|\/yr/i.test(text)) result.billingCycle = 'yearly';
  else if (/per week|weekly|\/wk/i.test(text)) result.billingCycle = 'weekly';
  else if (/per month|monthly|\/mo/i.test(text)) result.billingCycle = 'monthly';
  return result;
}
