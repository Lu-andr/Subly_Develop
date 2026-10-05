# Subly Privacy Policy

Last updated: 5 October 2026

**Release draft: replace [OWNER_NAME] and [SUPPORT_EMAIL] before publishing.**

Subly is operated by [OWNER_NAME]. Contact: [SUPPORT_EMAIL]. This policy covers the Subly mobile application.

## Information processed

When you create an account, Subly processes your email address, account identifier, password through Supabase Authentication, and the display name you provide. If you choose Google sign-in, Supabase processes the profile information returned by Google under your authorization.

Subly stores the trial and subscription details you enter: service name, dates, amount, currency, billing frequency, cancellation link, and notes. It also stores your reminder preferences. Avoid entering bank details or other sensitive information in notes.

An authentication session is stored on your device so you can remain signed in. On mobile devices the app uses Expo Secure Store. A browser version uses browser local storage. If local persistence fails, a temporary in-memory fallback may be used.

Text pasted into the receipt/SMS form is parsed on your device. Subly does not request access to your inbox, SMS messages, contacts, bank accounts, or payment cards. Only the details you choose to save are sent to Supabase.

## Purposes and service providers

Data is used for account access, storing your records, synchronizing them when you load or refresh the app, and scheduling reminders. Supabase provides the database and authentication. Google is involved if you choose Google sign-in. Your device operating system presents local reminders.

The current app does not register a remote push token or include an advertising SDK. Its internal event logger does not send events to an external analytics provider. Hosting providers may maintain operational logs; the operator must review actual provider settings before completing the Google Play Data safety form.

## Security and your records

The app connects to Supabase using HTTPS and authenticated requests. The supplied database schema restricts access to each user's records using Row Level Security. The operator is responsible for applying and verifying those policies in the live project. No system can guarantee absolute security.

## Account deletion and retention

You can request deletion in Profile > Delete Account & Data. The deployed server function verifies your session, deletes your Supabase authentication account, and removes the linked profile, tracked records, and reminder preferences through database cascades. The app then clears scheduled reminders on that device and signs out.

You can also request account deletion outside the app by following the account deletion page or emailing [SUPPORT_EMAIL] from the account's registered email address. Do not send your password. Requests must be verified before deletion.

Records remain in the active database until you delete them or your account. Provider backups and operational logs may remain for the provider's configured retention period; the operator must disclose the applicable period before release. An offline device may retain previously scheduled reminders until it next runs the app or notifications are disabled/uninstalled.

Deleting a Subly record or account does not cancel a subscription with another company. Complete cancellation directly with the provider.

## Choices, children, and changes

You may change notification settings, delete tracked records, sign out, or request account deletion. Subly is not designed for children under 13. Contact [SUPPORT_EMAIL] about privacy, data access/correction, or concerns. Updates to this policy will be dated on this page.
