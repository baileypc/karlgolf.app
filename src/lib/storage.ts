// Karl's GIR - LocalStorage Utilities (TypeScript)
// Extracted from storage.js

const PREFIX = 'karlsGIR_';

function getKey(key: string): string {
  return PREFIX + key;
}

export const storage = {
  // Generic get/set/remove
  getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const value = localStorage.getItem(getKey(key));
      return value !== null ? JSON.parse(value) : defaultValue;
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return defaultValue;
    }
  },

  setItem(key: string, value: any): boolean {
    try {
      localStorage.setItem(getKey(key), JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error writing to localStorage:', e);
      return false;
    }
  },

  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(getKey(key));
      return true;
    } catch (e) {
      console.error('Error removing from localStorage:', e);
      return false;
    }
  },

  // Authentication
  getLoginState(): boolean {
    return localStorage.getItem(getKey('isLoggedIn')) === 'true';
  },

  setLoginState(loggedIn: boolean): void {
    if (loggedIn) {
      localStorage.setItem(getKey('isLoggedIn'), 'true');
    } else {
      localStorage.removeItem(getKey('isLoggedIn'));
    }
  },

  // Current round (in progress)
  getCurrentRound(): any | null {
    return this.getItem('currentRound');
  },

  setCurrentRound(roundData: any): void {
    this.setItem('currentRound', roundData);
  },

  clearCurrentRound(): void {
    this.removeItem('currentRound');
  },

  // Live round (non-registered users)
  getLiveRound(): any | null {
    return this.getItem('liveRound');
  },

  setLiveRound(roundData: any): void {
    this.setItem('liveRound', roundData);
  },

  clearLiveRound(): void {
    this.removeItem('liveRound');
  },

  // Tracking mode
  getTrackingMode(): 'live' | 'registered' | null {
    return this.getItem('trackingMode');
  },

  setTrackingMode(mode: 'live' | 'registered' | null): void {
    if (mode) {
      this.setItem('trackingMode', mode);
    } else {
      this.removeItem('trackingMode');
    }
  },
};
