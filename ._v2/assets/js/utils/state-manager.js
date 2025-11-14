/**
 * Karl's GIR - State Management Utility
 * Establishes single source of truth pattern:
 * - Server session is the authoritative source for login state
 * - localStorage is only used for optimistic UI updates and offline support
 * - All state changes should sync with server when possible
 */

class StateManager {
    constructor() {
        this.loginState = null; // null = unknown, true/false = known state
        this.listeners = new Set();
    }

    /**
     * Check login state from server (authoritative source)
     * Updates localStorage as cache only
     */
    async checkLoginState() {
        try {
            const response = await fetch('api/auth/login.php?action=check&_=' + Date.now(), {
                credentials: 'include',
                cache: 'no-store'
            });
            
            if (!response.ok) {
                // If server check fails, use localStorage as fallback
                const cached = localStorage.getItem('karlsGIR_isLoggedIn') === 'true';
                this.loginState = cached;
                return cached;
            }
            
            const data = await response.json();
            const isLoggedIn = data.loggedIn === true;
            
            // Update cache
            localStorage.setItem('karlsGIR_isLoggedIn', isLoggedIn ? 'true' : 'false');
            this.loginState = isLoggedIn;
            
            // Notify listeners
            this.notifyListeners('loginState', isLoggedIn);
            
            return isLoggedIn;
        } catch (error) {
            console.error('Error checking login state:', error);
            // On error, use localStorage as fallback
            const cached = localStorage.getItem('karlsGIR_isLoggedIn') === 'true';
            this.loginState = cached;
            return cached;
        }
    }

    /**
     * Get cached login state (from localStorage)
     * Use checkLoginState() for authoritative state
     */
    getCachedLoginState() {
        if (this.loginState !== null) {
            return this.loginState;
        }
        return localStorage.getItem('karlsGIR_isLoggedIn') === 'true';
    }

    /**
     * Set login state (after successful login/logout)
     * Updates both server (via API) and localStorage cache
     */
    async setLoginState(isLoggedIn) {
        this.loginState = isLoggedIn;
        localStorage.setItem('karlsGIR_isLoggedIn', isLoggedIn ? 'true' : 'false');
        this.notifyListeners('loginState', isLoggedIn);
    }

    /**
     * Logout - clears server session and local cache
     */
    async logout() {
        try {
            await fetch('api/auth/login.php?action=logout', {
                credentials: 'include',
                cache: 'no-store'
            });
        } catch (error) {
            console.error('Error during logout:', error);
        }
        
        await this.setLoginState(false);
        localStorage.removeItem('karlsGIR_currentRound');
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners of state change
     */
    notifyListeners(event, data) {
        this.listeners.forEach(listener => {
            try {
                listener(event, data);
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }
}

// Export singleton instance
const stateManager = new StateManager();

// Auto-check login state on page load
if (typeof window !== 'undefined') {
    // Check immediately with cached value
    stateManager.getCachedLoginState();
    
    // Then verify with server in background
    stateManager.checkLoginState().catch(err => {
        console.log('Background login check failed, using cache:', err);
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = stateManager;
} else if (typeof window !== 'undefined') {
    window.StateManager = stateManager;
}

