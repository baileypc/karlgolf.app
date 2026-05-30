import type { AccountResponse, AuthResponse, Round, RoundSaveResponse } from '@/types';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

// Production API URL for native apps
const PROD_API_URL = 'https://karlgolf.app/api';
const AUTH_TOKEN_KEY = 'karl_golf_auth_token';
const CSRF_TOKEN_KEY = 'karl_golf_csrf_token';

// Bearer tokens are only used by native builds. Browser/PWA auth stays cookie-only.
function getStoredToken(): string | null {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string): void {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (e) {
    console.error('[API] Failed to store token:', e);
  }
}

function clearToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (e) {
    console.error('[API] Failed to clear token:', e);
  }
}

function getStoredCsrfToken(): string | null {
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    return sessionStorage.getItem(CSRF_TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeCsrfToken(token?: string | null): void {
  if (Capacitor.isNativePlatform() || !token) {
    return;
  }

  try {
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  } catch {
    // CSRF will be refetched by the next auth check if sessionStorage is unavailable.
  }
}

function clearCsrfToken(): void {
  try {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
  } catch {
    // Ignore.
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
  options: RequestInit = {},
  retryingAfterCsrfRefresh = false
): Promise<T> {
  const url = `./api/${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const csrfToken = getStoredCsrfToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const config: RequestInit = {
    credentials: 'include',
    ...options,
    headers,
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

    if (
      data.errorCode === 'CSRF_TOKEN_INVALID' &&
      !retryingAfterCsrfRefresh &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    ) {
      const refreshed = await refreshCsrfToken();
      if (refreshed) {
        return browserRequest<T>(endpoint, options, true);
      }
    }

    if (data.csrfToken) {
      storeCsrfToken(data.csrfToken);
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

async function refreshCsrfToken(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const response = await fetch('./api/auth/login.php?action=csrf', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    const data = await response.json();
    if (data?.success && data.csrfToken) {
      storeCsrfToken(data.csrfToken);
      return true;
    }
  } catch {
    // Caller will surface the original API error.
  }

  return false;
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
      // Use native HTTP for app, including the stored bearer token
      try {
        const token = getStoredToken();
        const headers: Record<string, string> = { 'Cache-Control': 'no-cache' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await CapacitorHttp.get({
          url: `${PROD_API_URL}/${endpoint}`,
          headers,
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
    if (data.csrfToken) {
      storeCsrfToken(data.csrfToken);
    } else if (!data.loggedIn) {
      clearCsrfToken();
    }
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

    if (response.token && Capacitor.isNativePlatform()) {
      storeToken(response.token);
    }
    storeCsrfToken(response.csrfToken);

    return response;
  },

  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await request<AuthResponse & { token?: string }>('auth/login.php?action=register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token && Capacitor.isNativePlatform()) {
      storeToken(response.token);
    }
    storeCsrfToken(response.csrfToken);

    return response;
  },

  async logout(): Promise<AuthResponse> {
    try {
      return await request<AuthResponse>('auth/login.php?action=logout', {
        method: 'POST',
      });
    } finally {
      clearToken();
      clearCsrfToken();
    }
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

  async getAccount(): Promise<AccountResponse> {
    const response = await request<AccountResponse>('auth/account.php?action=get');
    storeCsrfToken(response.csrfToken);
    return response;
  },

  async updateUsername(username: string): Promise<AccountResponse> {
    const response = await request<AccountResponse>('auth/account.php?action=update-username', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    storeCsrfToken(response.csrfToken);
    return response;
  },

  async updateEmail(email: string): Promise<AccountResponse> {
    const response = await request<AccountResponse>('auth/account.php?action=update-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    storeCsrfToken(response.csrfToken);
    return response;
  },

  async updatePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string; csrfToken?: string | null }> {
    const response = await request<{ success: boolean; message: string; csrfToken?: string | null }>('auth/account.php?action=update-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    storeCsrfToken(response.csrfToken);
    return response;
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

  async loadStats(): Promise<{
    success: boolean;
    totalRounds: number;
    groups: any[];
    cumulative: any | null;
    trends: any[];
  }> {
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

  async deleteRound(roundNumber?: number, roundId?: string): Promise<{ success: boolean; message: string; totalRounds?: number }> {
    const payload: { roundNumber?: number; roundId?: string } = {};
    if (roundNumber !== undefined) payload.roundNumber = roundNumber;
    if (roundId) payload.roundId = roundId;

    return request('rounds/delete.php', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteIncompleteRound(): Promise<{ success: boolean; message: string }> {
    return request('rounds/sync.php?action=delete', {
      method: 'DELETE',
    });
  },
};

export { APIError };
