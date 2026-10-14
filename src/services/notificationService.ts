// Subly — Real On-Device Notification Service (Expo Notifications)
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Trial, NotificationPreferences } from '../types';
import { formatCurrency } from '../utils/currencyUtils';

export interface NotificationScheduleResult {
  scheduled: number;
  failed: number;
}

const NOTIFICATION_CHANNEL_ID = 'subly-trial-reminders';

// Configure foreground notification presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Create high-priority Android notification channel with Subly branding
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'Trial Expiry Reminders',
        description: 'Alerts you before free trials end and renew',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B00',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    } catch (e) {
      console.warn('[Notifications] Failed to create Android notification channel:', e);
    }
  }
}

// Request permissions on Android / iOS
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    await ensureNotificationChannel();
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (e) {
    console.warn('[Notifications] Permission request error:', e);
    return false;
  }
}

export async function getNotificationPermissionStatus(): Promise<string> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch {
    return 'unavailable';
  }
}

// Cancel any previously scheduled notifications for a specific trial
export async function cancelTrialNotifications(trialId: string): Promise<void> {
  try {
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = allScheduled.filter(
      (n) => n.content?.data?.trialId === trialId
    );

    await Promise.all(
      toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch (e) {
    console.warn(`[Notifications] Failed to cancel notifications for trial ${trialId}:`, e);
  }
}

// Schedule real alarms at 7d, 3d, 1d, and day-of expiration
export async function scheduleTrialReminders(
  trial: Trial,
  prefs: NotificationPreferences
): Promise<NotificationScheduleResult> {
  let scheduled = 0;
  let failed = 0;

  try {
    // 1. Cancel previous notifications for this trial so we never double-notify
    await cancelTrialNotifications(trial.id);

    // 2. If notifications disabled globally or trial is cancelled, do nothing
    if (!prefs.notifications_enabled || (trial.status === 'CANCELLED' || trial.status === 'EXPIRED')) {
      return { scheduled: 0, failed: 0 };
    }

    if (await getNotificationPermissionStatus() !== 'granted') return { scheduled: 0, failed: 0 };
    await ensureNotificationChannel();

    // Parse the trial end date (expected format YYYY-MM-DD)
    const [year, month, day] = trial.trial_end_date.split('-').map(Number);
    const trialEndDate = new Date(year, month - 1, day, 9, 0, 0); // 9:00 AM local time
    const now = new Date();

    const amountStr = formatCurrency(trial.charge_amount, trial.currency);

    // Define reminder schedule intervals
    const intervals: { daysBefore: number; enabled: boolean; title: string; body: string }[] = [
      {
        daysBefore: 7,
        enabled: prefs.seven_days,
        title: `🗓️ 7 Days Left: ${trial.service_name} Free Trial`,
        body: `Your free trial ends in 1 week. You will be charged ${amountStr} if not cancelled.`,
      },
      {
        daysBefore: 3,
        enabled: prefs.three_days,
        title: `⏳ 3 Days Left: ${trial.service_name} Free Trial`,
        body: `Your free trial ends in 3 days. Tap to review cancellation steps and avoid the ${amountStr} charge.`,
      },
      {
        daysBefore: 1,
        enabled: prefs.one_day,
        title: `⚠️ ${trial.service_name} Free Trial Ends Tomorrow!`,
        body: `Last chance to cancel before you are billed ${amountStr}. Tap to open cancellation instructions.`,
      },
      {
        daysBefore: 0,
        enabled: prefs.final_day,
        title: `🚨 ${trial.service_name} Free Trial Ends Today!`,
        body: `Final day! Today is your last opportunity to cancel ${trial.service_name} before being charged ${amountStr}.`,
      },
    ];

    for (const item of intervals) {
      if (!item.enabled) continue;

      const triggerDate = new Date(trialEndDate.getTime());
      triggerDate.setDate(triggerDate.getDate() - item.daysBefore);

      // Only schedule notifications that are in the future
      if (triggerDate.getTime() > now.getTime()) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: item.title,
              body: item.body,
              sound: true,
              data: {
                trialId: trial.id,
                serviceName: trial.service_name,
                daysBefore: item.daysBefore,
              },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: triggerDate,
              channelId: NOTIFICATION_CHANNEL_ID,
            },
          });
          scheduled++;
        } catch (err) {
          console.warn(`[Notifications] Failed scheduling ${item.daysBefore}d alert for ${trial.service_name}:`, err);
          failed++;
        }
      }
    }
  } catch (e) {
    console.warn('[Notifications] Error in scheduleTrialReminders:', e);
    failed++;
  }

  return { scheduled, failed };
}

// Listen for user tapping on a notification to deep-link to the trial
export function setupNotificationResponseHandler(
  onTrialNotificationTap: (trialId: string) => void
): () => void {
  try {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const trialId = response.notification?.request?.content?.data?.trialId;
      if (trialId && typeof trialId === 'string') {
        onTrialNotificationTap(trialId);
      }
    });

    return () => subscription.remove();
  } catch {
    return () => {};
  }
}

// Serialize rescheduling so edits and preference changes cannot duplicate alarms.
let scheduleQueue: Promise<void> = Promise.resolve();
let revision = 0;
export function cancelAllTrialNotifications(): Promise<void> {
  revision++;
  const task = scheduleQueue.catch(() => {}).then(async () => {
    if (Platform.OS !== 'web') await Notifications.cancelAllScheduledNotificationsAsync();
  });
  scheduleQueue = task;
  return task;
}
export function syncTrialNotifications(trials: Trial[], prefs: NotificationPreferences): Promise<void> {
  const requestedRevision = ++revision;
  const task = scheduleQueue.catch(() => {}).then(async () => {
    if (Platform.OS === 'web' || requestedRevision !== revision) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!prefs.notifications_enabled) return;
    // At most 60 reminders, within the iOS pending-notification limit.
    const upcoming = trials.filter((t) => t.status === 'ACTIVE' || t.status === 'EXPIRING_SOON')
      .sort((a, b) => a.trial_end_date.localeCompare(b.trial_end_date)).slice(0, 15);
    for (const trial of upcoming) {
      if (requestedRevision !== revision) return;
      const result = await scheduleTrialReminders(trial, prefs);
      if (result.failed) throw new Error('Some reminders could not be scheduled. Check notification permissions in device settings.');
    }
  });
  scheduleQueue = task;
  return task;
}
