const fs = require('node:fs');
const path = require('node:path');
// Read public .env configuration without printing values (or loading server secrets).
if (fs.existsSync('.env')) for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^(EXPO_PUBLIC_[A-Z_]+)=(.*)$/);
  if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
}
const failures = [];
console.warn('Manual asset prerequisite: replace the old feature graphic claims and capture real screenshots.');
const check = (ok, message) => { if (!ok) failures.push(message); };
const app = JSON.parse(fs.readFileSync('app.json', 'utf8')).expo;
const gradle = fs.readFileSync('android/app/build.gradle', 'utf8');
const props = fs.readFileSync('android/gradle.properties', 'utf8');
const manifest = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
check(app.android.package === 'com.subly.app' && gradle.includes("applicationId 'com.subly.app'"), 'Android package must match app.json and Gradle.');
check(/android.targetSdkVersion=(3[6-9]|[4-9]\d)/.test(props), 'Google Play target API must be at least 36.');
check(gradle.includes('signingConfig signingConfigs.release'), 'Release must use an upload key, not debug signing.');
check(!manifest.split('\n').some((line) => /READ_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE|SYSTEM_ALERT_WINDOW/.test(line) && !line.includes('tools:node="remove"')), 'Remove unused storage/overlay permissions.');
for (const key of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPPORT_EMAIL', 'EXPO_PUBLIC_PRIVACY_URL', 'EXPO_PUBLIC_TERMS_URL', 'EXPO_PUBLIC_DELETION_URL']) {
  check(Boolean(process.env[key]), `Configure ${key} before building.`);
}
check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? ''), 'Set a verified support email.');
for (const key of ['EXPO_PUBLIC_PRIVACY_URL', 'EXPO_PUBLIC_TERMS_URL', 'EXPO_PUBLIC_DELETION_URL']) {
  check(/^https:\/\//.test(process.env[key] ?? ''), `${key} must be a public HTTPS page.`);
}
for (const doc of ['docs/PRIVACY_POLICY.md', 'docs/TERMS.md', 'docs/ACCOUNT_DELETION.md']) {
  check(!/\[OWNER_NAME\]|\[SUPPORT_EMAIL\]/.test(fs.readFileSync(doc, 'utf8')), `Complete owner/contact details in ${doc}.`);
}
check(fs.existsSync(path.join('supabase', 'functions', 'delete-account', 'index.ts')), 'Account deletion server function missing.');
if (failures.length) {
  console.error('Release prerequisites still missing:\n' + failures.map((s) => '- ' + s).join('\n'));
  process.exitCode = 1;
} else console.log('Source/configuration checks passed. Still verify live backend, public URLs, signing, AAB and device tests.');
