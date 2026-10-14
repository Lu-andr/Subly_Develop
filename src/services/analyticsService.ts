// TrialGuard — Analytics Service
// Lightweight event tracking, ready for a real analytics provider (e.g. Mixpanel, PostHog)
// In MVP, events are logged to console and can be wired up to a provider later.

import { AnalyticsEvent } from '../types';

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

class AnalyticsService {
  private userId: string | null = null;

  identify(userId: string) {
    this.userId = userId;
    if (__DEV__) console.log('[Analytics] User identified');
  }

  reset() {
    this.userId = null;
  }

  track(event: AnalyticsEvent, properties?: EventProperties) {
    const payload = {
      event,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      properties: properties ?? {},
    };
    // TODO: Replace with real analytics provider
    if (__DEV__) console.log('[Analytics]', JSON.stringify(payload));
  }
}

export const analytics = new AnalyticsService();
