import type { AuthResponse, Round, RoundSaveResponse, UserRounds } from '@/types';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

// Production API URL for native apps
const PROD_API_URL = 'https://karlgolf.app/api';
const AUTH_TOKEN_KEY = 'karl_golf_auth_token';

// Simple token storage using localStorage (works in both PWA and native WebView)
function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    console.log('[API] Token stored');
  } catch (e) {
    console.error('[API] Failed to store token:', e);
  }
}

function clearToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    console.log('[API] Token cleared');
  } catch (e) {
    console.error('[API] Failed to clear token:', e);
  }
}

class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Native HTTP request using Capacitor (bypasses CORS)
async function nativeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${PROD_API_URL}/${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();

  // Get stored auth token
  const token = getStoredToken();

  console.log('[API Native] Request:', method, url, token ? '(with token)' : '(no token)');

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await CapacitorHttp.request({
      url,
      method,
      headers,
      data: options.body ? JSON.parse(options.body as string) : undefined,
    });

    console.log('[API Native] Response status:', response.status);

    const data = response.data;

    if (response.status >= 400 || !data.success) {
      throw new APIError(
        data.message || `API error: ${response.status}`,
        response.status,
        data.errorCode || data.code
      );
    }

    return data as T;
  } catch (error) {
    console.error('[API Native] Error:', error);

    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      error instanceof Error ? error.message : 'Network error',
      undefined,
      'NETWORK_ERROR'
    );
  }
}

// Browser/PWA HTTP request using fetch
async function browserRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `./api/${endpoint}`;

  const config: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new APIError('Invalid response from server', response.status);
    }

    if (!response.ok || !data.success) {
      throw new APIError(
        data.message || `API error: ${response.status}`,
        response.status,
        data.errorCode || data.code
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      error instanceof Error ? error.message : 'Network error',
      undefined,
      'NETWORK_ERROR'
    );
  }
}

// Unified request function - uses native HTTP for apps, fetch for browser
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (Capacitor.isNativePlatform()) {
    return nativeRequest<T>(endpoint, options);
  }
  return browserRequest<T>(endpoint, options);
}

// Authentication API
export const authAPI = {
  async checkLogin(): Promise<{ success: boolean; isLoggedIn: boolean }> {
    const endpoint = 'auth/login.php?action=check';

    if (Capacitor.isNativePlatform()) {
      // Use native HTTP for app
      try {
        const response = await CapacitorHttp.get({
          url: `${PROD_API_URL}/${endpoint}`,
          headers: { 'Cache-Control': 'no-cache' },
        });
        return {
          success: true,
          isLoggedIn: response.data?.loggedIn || false,
        };
      } catch {
        return { success: true, isLoggedIn: false };
      }
    }

    // Use fetch for browser/PWA
    const response = await fetch(`./api/${endpoint}`, {
      credentials: 'include',
    });
    const data = await response.json();
    return {
      success: true,
      isLoggedIn: data.loggedIn || false,
    };
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await request<AuthResponse & { token?: string }>('auth/login.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store token for native app
    if (response.token) {
      storeToken(response.token);
    }

    return response;
  },

  async register(email: string, password: string): Promise<AuthResponse> {
    return request('auth/login.php?action=register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async logout(): Promise<AuthResponse> {
    // Clear stored token first
    clearToken();

    return request('auth/login.php?action=logout', {
      method: 'POST',
    });
  },

  async forgotPassword(email: string): Promise<AuthResponse> {
    return request('auth/login.php?action=forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async validateToken(email: string, token: string): Promise<AuthResponse> {
    return request('auth/login.php?action=validate-token', {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    });
  },

  async resetPassword(
    email: string,
    token: string,
    password: string
  ): Promise<AuthResponse> {
    return request('auth/login.php?action=reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, password }),
    });
  },

  async deleteAccount(): Promise<AuthResponse> {
    return request('auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete-account' }),
    });
  },
};

// Rounds API
export const roundsAPI = {
  async syncCurrentRound(
    roundData: Partial<Round>,
    action: 'save' | 'clear' = 'save'
  ): Promise<RoundSaveResponse> {
    return request('rounds/sync.php', {
      method: 'POST',
      body: JSON.stringify({ roundData, action }),
    });
  },

  async saveRound(roundData: Partial<Round>): Promise<RoundSaveResponse> {
    return request('rounds/save.php', {
      method: 'POST',
      body: JSON.stringify(roundData),
    });
  },

  async getIncompleteRounds(
    courseName?: string
  ): Promise<{ success: boolean; incompleteRounds: any[] }> {
    const params = courseName ? `?courseName=${encodeURIComponent(courseName)}` : '';
    return request(`rounds/incomplete.php${params}`);
  },

  async loadStats(): Promise<{ success: boolean; data: UserRounds }> {
    return request('stats/load.php');
  },

  async getCourses(): Promise<{ success: boolean; courses: string[] }> {
    return request('rounds/courses.php');
  },

  // TEMP: Reset all user data (testing only)
  async resetData(): Promise<{ success: boolean; message: string }> {
    return request('admin/reset.php', {
      method: 'POST',
    });
  },

  async deleteRound(roundNumber: number): Promise<{ success: boolean; message: string; totalRounds?: number }> {
    return request('rounds/delete.php', {
      method: 'POST',
      body: JSON.stringify({ roundNumber }),
    });
  },

  async deleteIncompleteRound(): Promise<{ success: boolean; message: string }> {
    return request('rounds/sync.php?action=delete', {
      method: 'DELETE',
    });
  },
};

// Email API
export const emailAPI = {
  async sendRoundSummary(data: {
    email: string;
    roundType: string;
    holes: any[];
    stats: any;
  }): Promise<AuthResponse> {
    return request('email/send.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export { APIError };
