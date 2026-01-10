// Karl's GIR - LocalStorage Wrapper
// Centralized localStorage management with prefixed keys

const Storage = {
    // Key prefixes
    PREFIX: 'karlsGIR_',
    
    // Helper methods
    _getKey(key) {
        return this.PREFIX + key;
    },
    
    // Generic get/set/remove
    getItem(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(this._getKey(key));
            return value !== null ? JSON.parse(value) : defaultValue;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return defaultValue;
        }
    },
    
    setItem(key, value) {
        try {
            localStorage.setItem(this._getKey(key), JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error writing to localStorage:', e);
            return false;
        }
    },
    
    removeItem(key) {
        try {
            localStorage.removeItem(this._getKey(key));
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    },
    
    // Authentication
    getLoginState() {
        return localStorage.getItem(this._getKey('isLoggedIn')) === 'true';
    },
    
    setLoginState(loggedIn) {
        if (loggedIn) {
            localStorage.setItem(this._getKey('isLoggedIn'), 'true');
        } else {
            localStorage.removeItem(this._getKey('isLoggedIn'));
        }
    },
    
    // Current Round (Registered Users)
    getCurrentRound() {
        return this.getItem('currentRound', null);
    },
    
    saveCurrentRound(roundData) {
        const dataToSave = {
            ...roundData,
            lastUpdated: new Date().toISOString(),
            trackingMode: 'REGISTERED'
        };
        return this.setItem('currentRound', dataToSave);
    },
    
    clearCurrentRound() {
        return this.removeItem('currentRound');
    },
    
    // Live Round (No Login)
    getLiveRound() {
        return this.getItem('liveRound', null);
    },
    
    saveLiveRound(roundData) {
        const dataToSave = {
            ...roundData,
            lastUpdated: new Date().toISOString(),
            trackingMode: 'LIVE_ROUND'
        };
        return this.setItem('liveRound', dataToSave);
    },
    
    clearLiveRound() {
        return this.removeItem('liveRound');
    },
    
    // Pending Registration/Login Data
    getPendingRegistration() {
        return this.getItem('pendingRegistration', null);
    },
    
    setPendingRegistration(data) {
        return this.setItem('pendingRegistration', data);
    },
    
    clearPendingRegistration() {
        return this.removeItem('pendingRegistration');
    },
    
    getPendingLogin() {
        return this.getItem('pendingLogin', null);
    },
    
    setPendingLogin(data) {
        return this.setItem('pendingLogin', data);
    },
    
    clearPendingLogin() {
        return this.removeItem('pendingLogin');
    },
    
    // Tracking Mode
    getTrackingMode() {
        return localStorage.getItem(this._getKey('trackingMode'));
    },
    
    setTrackingMode(mode) {
        if (mode) {
            localStorage.setItem(this._getKey('trackingMode'), mode);
        } else {
            localStorage.removeItem(this._getKey('trackingMode'));
        }
    },
    
    // Welcome Modal
    hasSeenWelcome() {
        return localStorage.getItem(this._getKey('hasSeenWelcome')) === 'true';
    },
    
    setHasSeenWelcome(seen = true) {
        if (seen) {
            localStorage.setItem(this._getKey('hasSeenWelcome'), 'true');
        } else {
            localStorage.removeItem(this._getKey('hasSeenWelcome'));
        }
    },
    
    // Clear all app data
    clearAll() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}

