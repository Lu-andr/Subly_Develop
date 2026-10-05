# Data safety: working inventory, not a completed Play Console declaration

Based on source code as prepared on 5 October 2026. Verify live Supabase, Google OAuth, hosting logs and all bundled SDK behavior before submission.

| Data | Source behavior | Purpose / requiredness |
|---|---|---|
| Email address | Sent to Supabase Auth and profile | Account management; required for email account |
| Name | User-entered/Google profile name | Account display; current signup form requires it |
| User ID | Supabase authentication/profile/records | Account association; required |
| Subscription names, amounts, currency, dates and billing cycle | Entered by user, saved in Supabase | App functionality; tracking records |
| Notes / cancellation link | Optional text saved in Supabase | App functionality; optional |
| Notification preferences | Saved in Supabase | App functionality |
| Pasted receipt/SMS text | Parsed locally, no inbox/SMS permission | Only selected extracted fields are saved |
| Password | Sent to Supabase Authentication | Authentication; do not log or store as plain application data |
| Remote push token | No registration code present | Local reminders are used |
| Advertising ID / location / contacts | No access code present | Verify transitive SDK behavior before answering |
| Internal event log | No external analytics endpoint | Review production operational logging separately |

Google Play's categories must be selected in the current form. Entered subscription amounts may require the financial-information category; free-form notes may contain personal information. Do not mark all data as 'not collected' just because Supabase is a service provider. Whether provider transfers count as 'sharing' depends on Google's service-provider exception and actual contracts/settings.

Network requests use HTTPS. Account deletion requires deploying and testing delete-account. External deletion requires a real monitored support flow. Do not declare deletion as working until these are confirmed. Data in backups/logs needs an accurate retention statement.

No ads SDK is present in source, but confirm the final dependency inventory. Subly is a record/reminder utility: it is not the separate microloan offers app discussed in other projects.
