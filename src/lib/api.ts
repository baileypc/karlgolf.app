// Karl's GIR - API Client (TypeScript)
// Wrapper around existing PHP backend with proper error handling

import type { AuthResponse, Round, RoundSaveResponse, UserRounds } from '@/types';

// Use relative path - works in both local (Laragon serving from /dist) and production (root)
const BASE_URL = './api';

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

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}/${endpoint}`;
  
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

    // Get response text first to debug JSON parse errors
    const text = await response.text();

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', text.substring(0, 500)); // Log first 500 chars
      throw new APIError(
        'Invalid response from server',
        response.status
      );
    }

    if (!response.ok || !data.success) {
      throw new APIError(
        data.message || `API error: ${response.status}`,
        response.status,
        data.errorCode || data.code // Support both errorCode and code
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Network error or JSON parse error
    // Only log network errors, not authentication errors (they're handled by toast)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(`API request failed (${endpoint}): Network error`);
    }
    throw new APIError(
      error instanceof Error ? error.message : 'Network error',
      undefined,
      'NETWORK_ERROR'
    );
  }
}

// Authentication API
export const authAPI = {
  async checkLogin(): Promise<{ success: boolean; isLoggedIn: boolean }> {
    const response = await fetch(`${BASE_URL}/auth/login.php?action=check`, {
      credentials: 'include',
    });
    const data = await response.json();
    // API returns { loggedIn: boolean, email?: string }
    return {
      success: true,
      isLoggedIn: data.loggedIn || false,
    };
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return request('auth/login.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(email: string, password: string): Promise<AuthResponse> {
    return request('auth/login.php?action=register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async logout(): Promise<AuthResponse> {
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
