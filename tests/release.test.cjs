const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(filename) {
  filename = path.resolve(filename);
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, Date, URL, console, require: (name) => {
    if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), name) + '.ts');
    return require(name);
  } }, { filename });
  return module.exports;
}
const currency = load('src/utils/currencyUtils.ts');
const dates = load('src/utils/dateUtils.ts');
const parser = load('src/utils/textParser.ts');
const validate = load('src/utils/validationUtils.ts');
test('decimal comma is preserved, malformed and overflowing prices rejected', () => {
  assert.equal(currency.parseCurrencyAmount('19,99'), 19.99);
  assert.equal(currency.parseCurrencyAmount('19.99'), 19.99);
  for (const raw of ['19oops', '1,2,3', '-1', 'Infinity', '100000000', '19.999', '']) assert.ok(Number.isNaN(currency.parseCurrencyAmount(raw)), raw);
});
test('mixed-currency totals remain separate without invented conversions', () => {
  const result = currency.formatCurrencyTotals([{ charge_amount: 10, currency: 'ZAR' }, { charge_amount: 20, currency: 'RUB' }, { charge_amount: 2, currency: 'ZAR' }]);
  assert.equal(result, 'R12 · ₽20');
});
test('new selectable currencies and default ZAR remain intact', () => {
  assert.equal(currency.CURRENCY_OPTIONS.map((x) => x.value).join(','), 'RUB,KZT,UZS,VND,PHP,ZAR');
  assert.equal(currency.formatCurrency(100), 'R100');
});
test('date-only values survive western and eastern timezones and DST', () => {
  const original = process.env.TZ;
  try {
    for (const zone of ['America/Los_Angeles', 'Europe/Moscow', 'Asia/Ho_Chi_Minh']) {
      process.env.TZ = zone;
      assert.equal(dates.toISODateString(dates.parseLocalDate('2026-10-10')), '2026-10-10');
      assert.equal(dates.getTotalDays('2026-03-07', '2026-03-09'), 2);
    }
  } finally { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; }
});
test('parser extracts explicit currencies and never invents a service price', () => {
  assert.equal(parser.parseTrialConfirmation('Your plan costs 20 USD per month').currency, 'USD');
  assert.equal(parser.parseTrialConfirmation('Your plan costs ZAR 19,99 per month').chargeAmount, 19.99);
  assert.equal(parser.parseTrialConfirmation('Welcome to Spotify Premium!').chargeAmount, undefined);
});
test('invalid dates and truncated numeric input fail validation', () => {
  const base = { service_name: 'Example', trial_start_date: new Date(2026, 9, 1), trial_end_date: new Date(2026, 9, 10), charge_amount: '19,99' };
  assert.equal(Object.keys(validate.validateTrialForm(base)).length, 0);
  assert.ok(validate.validateTrialForm({ ...base, charge_amount: '19oops' }).charge_amount);
  assert.ok(validate.validateTrialForm({ ...base, trial_end_date: new Date('invalid') }).trial_end_date);
});
