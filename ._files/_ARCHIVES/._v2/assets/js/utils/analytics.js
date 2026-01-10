/**
 * Karl's GIR - Analytics Tracking Helper
 * Client-side tracking functions for market research
 */

const Analytics = {
    /**
     * Track a page visit
     */
    trackPageVisit(page) {
        try {
            const data = {
                eventType: 'pageVisit',
                page: page,
                ip: null, // Server will get this
                userAgent: navigator.userAgent || 'unknown',
                referrer: document.referrer || ''
            };
            
            // Fire and forget - don't block page load
            fetch('api/admin/track.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(err => {
                // Silently fail - analytics shouldn't break the app
                console.debug('Analytics tracking failed:', err);
            });
        } catch (error) {
            // Silently fail
            console.debug('Analytics error:', error);
        }
    },
    
    /**
     * Track a signup
     */
    trackSignup(userHash) {
        try {
            const data = {
                eventType: 'signup',
                userHash: userHash
            };
            
            fetch('api/admin/track.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(err => {
                console.debug('Analytics tracking failed:', err);
            });
        } catch (error) {
            console.debug('Analytics error:', error);
        }
    },
    
    /**
     * Track a round event (start, save, abandon)
     */
    trackRoundEvent(eventType, roundType, userHash = null, holesCount = 0, completed = false) {
        try {
            const data = {
                eventType: 'roundEvent',
                roundEventType: eventType, // 'start', 'save', 'abandon'
                roundType: roundType, // 'live' or 'registered'
                userHash: userHash,
                holesCount: holesCount,
                completed: completed
            };
            
            fetch('api/admin/track.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(err => {
                console.debug('Analytics tracking failed:', err);
            });
        } catch (error) {
            console.debug('Analytics error:', error);
        }
    },
    
    /**
     * Track live version visit
     */
    trackLiveVersionVisit() {
        try {
            const data = {
                eventType: 'liveVersionVisit'
            };
            
            fetch('api/admin/track.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(err => {
                console.debug('Analytics tracking failed:', err);
            });
        } catch (error) {
            console.debug('Analytics error:', error);
        }
    }
};

