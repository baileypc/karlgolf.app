// Karl's GIR - Analytics Tracking (TypeScript)
// Extracted from analytics.js

interface AnalyticsEvent {
  eventType: string;
  [key: string]: any;
}

class Analytics {
  private static async track(data: AnalyticsEvent): Promise<void> {
    try {
      await fetch('./api/admin/track.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      // Silently fail - analytics shouldn't break the app
      // Error logging removed for production
    }
  }

  static trackPageVisit(page: string): void {
    this.track({
      eventType: 'pageVisit',
      page,
      ip: null, // Server will get this
      userAgent: navigator.userAgent || 'unknown',
      referrer: document.referrer || '',
    });
  }

  static trackSignup(userHash: string): void {
    this.track({
      eventType: 'signup',
      userHash,
    });
  }

  static trackRoundEvent(
    eventType: 'start' | 'save' | 'abandon',
    roundType: 'live' | 'registered',
    userHash: string | null = null,
    holesCount = 0,
    completed = false
  ): void {
    this.track({
      eventType: 'roundEvent',
      roundEventType: eventType,
      roundType,
      userHash,
      holesCount,
      completed,
    });
  }

  static trackLiveVersionVisit(): void {
    this.track({
      eventType: 'liveVersionVisit',
    });
  }
}

export default Analytics;
