const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function evaluate(file, requireMock, extras = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: requireMock, Date, console, ...extras });
  return module.exports;
}
test('account deletion rejects anonymous callers and ignores client-selected user IDs', async () => {
  let handler;
  const deleted = [];
  evaluate('supabase/functions/delete-account/index.ts', () => ({ createClient: (_url, key) => key === 'anon' ? {
    auth: { getUser: async (token) => token === 'valid' ? { data: { user: { id: 'verified-caller' } }, error: null } : { data: { user: null }, error: 'invalid' } }
  } : { auth: { admin: { deleteUser: async (id) => { deleted.push(id); return { error: null }; } } } } }), {
    Deno: { env: { get: (key) => ({ SUPABASE_URL: 'https://example.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'secret' })[key] }, serve: (fn) => { handler = fn; } }, Response, Request
  });
  assert.equal((await handler(new Request('https://example.test', { method: 'POST' }))).status, 401);
  assert.equal((await handler(new Request('https://example.test', { method: 'POST', headers: { Authorization: 'Bearer invalid' } }))).status, 401);
  assert.equal(deleted.length, 0);
  const response = await handler(new Request('https://example.test', { method: 'POST', headers: { Authorization: 'Bearer valid' }, body: JSON.stringify({ user_id: 'someone-else' }) }));
  assert.equal(response.status, 200);
  assert.deepEqual(deleted, ['verified-caller']);
});
test('disabling notifications or signing out clears queued device reminders', async () => {
  let scheduled = [];
  const notifications = {
    setNotificationHandler() {}, setNotificationChannelAsync: async () => {}, AndroidImportance: { HIGH: 4 },
    getPermissionsAsync: async () => ({ status: 'granted' }), SchedulableTriggerInputTypes: { DATE: 'date' },
    getAllScheduledNotificationsAsync: async () => scheduled,
    cancelScheduledNotificationAsync: async (id) => { scheduled = scheduled.filter((n) => n.identifier !== id); },
    cancelAllScheduledNotificationsAsync: async () => { scheduled = []; },
    scheduleNotificationAsync: async (request) => { scheduled.push({ ...request, identifier: String(scheduled.length) }); return String(scheduled.length); }
  };
  const service = evaluate('src/services/notificationService.ts', (name) => {
    if (name === 'react-native') return { Platform: { OS: 'android' } };
    if (name === 'expo-notifications') return notifications;
    if (name.includes('currencyUtils')) return { formatCurrency: (amount, code) => code + amount };
    return {};
  });
  const date = new Date(); date.setDate(date.getDate() + 10);
  const trial = { id: 'one', status: 'ACTIVE', trial_end_date: date.toISOString().slice(0, 10), currency: 'ZAR', charge_amount: 10, service_name: 'Example' };
  const prefs = { notifications_enabled: true, seven_days: true, three_days: true, one_day: true, final_day: true };
  await service.syncTrialNotifications([trial], prefs);
  assert.equal(scheduled.length, 4);
  await service.syncTrialNotifications([trial], { ...prefs, notifications_enabled: false });
  assert.equal(scheduled.length, 0);
  const inflight = service.syncTrialNotifications([trial], prefs);
  const cleanup = service.cancelAllTrialNotifications();
  await Promise.all([inflight, cleanup]);
  assert.equal(scheduled.length, 0);
});
test('PKCE callback is exchanged once and recovery links are identified', async () => {
  let calls = 0;
  const links = evaluate('src/lib/authLinks.ts', () => ({ supabase: { auth: { exchangeCodeForSession: async () => { calls++; return { error: null }; } } } }), { URL });
  const raw = 'subly://auth/callback?code=one-time-code';
  assert.deepEqual(await Promise.all([links.handleAuthLink(raw), links.handleAuthLink(raw)]), [false, false]);
  assert.equal(calls, 1);
  assert.equal(await links.handleAuthLink('subly://reset-password?code=recovery-code'), true);
  assert.equal(await links.handleAuthLink('https://other.test/?code=untrusted'), false);
  assert.equal(await links.handleAuthLink('invalid-url'), false);
});
