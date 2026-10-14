# Subly

React Native / Expo subscription trial tracker with local on-device records and reminders. No account or sign-in is required.

## Release preparation

See [the Google Play release guide](docs/GOOGLE_PLAY_RELEASE.md). Source preparation is not proof of production readiness: live Supabase function deployment, contact/legal pages, upload-key signing and device tests remain required.

## Development

```
npm ci
npm start
```

Use a development build for OAuth testing; Expo Go cannot represent the production callback scheme. `npm run android` requires an Android SDK and JDK. `npm run web` runs the browser target, which is separate from the Google Play Android release.

Configure public variables using `.env.example`; actual .env files must stay outside Git. The public Supabase anon key respects deployed Row Level Security. Server service-role keys must never be put in the app or EXPO_PUBLIC variables.

## Checks

```
npm run typecheck
npm test
npm run check:release
```

The release checker intentionally fails until support/contact/URL prerequisites are completed. The tests cover numeric/date regressions, mixed currencies, caller-authenticated account deletion and notification cleanup with mocked services. They do not replace physical-device or live-database tests.

## Behavior and limits

- Manual entry of service, dates, amount, currency, billing frequency, provider link and notes.
- Currencies offered: RUB, KZT, UZS, VND, PHP, ZAR. Default: ZAR. Old stored codes remain readable.
- Summaries group currencies; there is no exchange-rate conversion.
- Provider templates identify services, not verified current offers or prices.
- Local reminders at 7/3/1/0 days before an entered date. Up to the 15 nearest active records are scheduled.
- One entered end date is tracked; subsequent renewals are not automatically generated.
- Cancellation is performed by the user with the provider. Subly stores the user's cancellation mark.
- Records and reminder settings are stored on this phone using AsyncStorage. They survive normal app restarts; they are not synchronized to Supabase or another device. Clearing app storage or uninstalling can remove them. Previously stored Supabase records are not automatically imported or deleted.

## Layout

`App.tsx` starts the app flow. `src/screens` contains screens, `src/components` UI elements, `src/hooks` state, `src/services` database/notification operations, `src/lib` authentication/storage clients, `src/utils` date/currency/parser helpers. `android` is the native project; `supabase` contains schema and the deletion function; `docs` contains release material and draft public documents.
