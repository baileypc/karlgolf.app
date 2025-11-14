// Karl's GIR - Page Tracking Hook
// Automatically tracks page visits for analytics

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Analytics from '@/lib/analytics';

/**
 * Hook to track page visits automatically
 * Call this in App.tsx to track all route changes
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Track page visit whenever route changes
    const page = location.pathname || '/';
    Analytics.trackPageVisit(page);
  }, [location]);
}

