// Karl's GIR - PHP API Wrapper
// Centralized API calls with error handling

const API = {
    // Base URL for API endpoints (relative paths)
    baseURL: 'api',
    
    // Helper method for making requests
    async _request(endpoint, options = {}) {
        const url = `${this.baseURL}/${endpoint}`;
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        };
        
        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `API error: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API request failed (${endpoint}):`, error);
            throw error;
        }
    },
    
    // Authentication endpoints
    async checkLogin() {
        return this._request('auth/login.php?action=check');
    },
    
    async login(email, password) {
        return this._request('auth/login.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'login',
                email,
                password
            })
        });
    },
    
    async register(email, password) {
        return this._request('auth/login.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'register',
                email,
                password
            })
        });
    },
    
    async logout() {
        return this._request('auth/login.php?action=logout', {
            method: 'POST'
        });
    },
    
    async forgotPassword(email) {
        return this._request('auth/password-reset.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'forgot-password',
                email
            })
        });
    },
    
    async validateToken(email, token) {
        return this._request('auth/password-reset.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'validate-token',
                email,
                token
            })
        });
    },
    
    async resetPassword(email, token, newPassword) {
        return this._request('auth/password-reset.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'reset-password',
                email,
                token,
                password: newPassword
            })
        });
    },
    
    // Round management endpoints
    async syncCurrentRound(roundData, action = 'save') {
        if (action === 'delete') {
            return this._request('rounds/sync.php?action=delete', {
                method: 'DELETE'
            });
        }
        
        if (action === 'get') {
            return this._request(`rounds/sync.php?action=get&_=${Date.now()}`, {
                method: 'GET',
                cache: 'no-store'
            });
        }
        
        return this._request('rounds/sync.php', {
            method: 'POST',
            body: JSON.stringify(roundData)
        });
    },
    
    async saveRound(roundData) {
        return this._request('rounds/save.php', {
            method: 'POST',
            body: JSON.stringify(roundData)
        });
    },
    
    async getIncompleteRounds(courseName = null) {
        const url = courseName 
            ? `rounds/incomplete.php?courseName=${encodeURIComponent(courseName)}&_=${Date.now()}`
            : `rounds/incomplete.php?_=${Date.now()}`;
        
        return this._request(url, {
            method: 'GET',
            cache: 'no-store'
        });
    },
    
    async getCourseNames() {
        return this._request(`rounds/courses.php?_=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store'
        });
    },
    
    // Statistics endpoints
    async loadStats() {
        return this._request(`stats/load.php?_=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store'
        });
    },
    
    async resetDashboard() {
        return this._request('auth/login.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'reset-dashboard'
            })
        });
    },
    
    // Email endpoints
    async sendEmail(emailData) {
        return this._request('email/send.php', {
            method: 'POST',
            body: JSON.stringify(emailData)
        });
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}

