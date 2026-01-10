// Karl's GIR - Authentication Helpers
// Login state management, session helpers, and redirect helpers

const Auth = {
    // Check if user is logged in (from localStorage)
    isLoggedIn() {
        return Storage.getLoginState();
    },
    
    // Set login state
    setLoggedIn(loggedIn) {
        Storage.setLoginState(loggedIn);
    },
    
    // Get initial login state (for React useState initialization)
    getInitialLoginState() {
        // Check global window variable first (set by pre-script)
        if (window.__karlsGIR_initialLoginState !== undefined) {
            return window.__karlsGIR_initialLoginState;
        }
        // Fallback to localStorage
        return Storage.getLoginState();
    },
    
    // Check login state from server
    async checkLoginFromServer() {
        try {
            const response = await API.checkLogin();
            return response.loggedIn || false;
        } catch (error) {
            console.error('Error checking login from server:', error);
            // Fallback to localStorage
            return Storage.getLoginState();
        }
    },
    
    // Login with email and password
    async login(email, password) {
        try {
            const response = await API.login(email, password);
            if (response.success) {
                Storage.setLoginState(true);
                return { success: true, message: response.message };
            } else {
                return { success: false, message: response.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message || 'Login failed' };
        }
    },
    
    // Register new user
    async register(email, password) {
        try {
            const response = await API.register(email, password);
            if (response.success) {
                Storage.setLoginState(true);
                return { success: true, message: response.message };
            } else {
                return { success: false, message: response.message || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: error.message || 'Registration failed' };
        }
    },
    
    // Logout
    async logout() {
        try {
            await API.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            Storage.setLoginState(false);
            Storage.clearCurrentRound();
            Storage.clearLiveRound();
        }
    },
    
    // Redirect to login page
    redirectToLogin() {
        window.location.href = 'login.html?t=' + Date.now();
    },
    
    // Redirect to track round page
    redirectToTrackRound() {
        // Use replace to avoid back button issues
        // Ensure localStorage is set before redirect
        Storage.setLoginState(true);
        window.location.replace('track-round.html?t=' + Date.now());
    },
    
    // Redirect to dashboard
    redirectToDashboard() {
        window.location.href = 'dashboard.html?t=' + Date.now();
    },
    
    // Redirect to home
    redirectToHome() {
        window.location.href = 'index.html?t=' + Date.now();
    },
    
    // Require login - redirect if not logged in
    requireLogin() {
        if (!this.isLoggedIn()) {
            this.redirectToLogin();
            return false;
        }
        return true;
    },
    
    // Require logout - redirect if logged in
    requireLogout(redirectTo = 'track-round.html') {
        if (this.isLoggedIn()) {
            window.location.href = redirectTo + '?t=' + Date.now();
            return false;
        }
        return true;
    },
    
    // Handle password reset flow
    async forgotPassword(email) {
        try {
            const response = await API.forgotPassword(email);
            return response;
        } catch (error) {
            console.error('Forgot password error:', error);
            return { success: false, message: error.message || 'Failed to send reset email' };
        }
    },
    
    async validateResetToken(email, token) {
        try {
            const response = await API.validateToken(email, token);
            return response;
        } catch (error) {
            console.error('Token validation error:', error);
            return { success: false, message: error.message || 'Invalid token' };
        }
    },
    
    async resetPassword(email, token, newPassword) {
        try {
            const response = await API.resetPassword(email, token, newPassword);
            return response;
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, message: error.message || 'Failed to reset password' };
        }
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}

