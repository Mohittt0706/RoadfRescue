import apiClient from './api';

const USER_KEY = 'roadrescue_user';
const TOKEN_KEY = 'roadrescue-token';
const REFRESH_TOKEN_KEY = 'roadrescue-refresh-token';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'mechanic' | 'admin';
  specialization?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  profileImage?: string;
}

export const authService = {
  login: async (email: string, password: string, role: 'user' | 'mechanic' | 'admin'): Promise<UserProfile> => {
    let url = '/auth/login';
    if (role === 'mechanic') {
      url = '/auth/mechanic/login';
    } else if (role === 'admin') {
      url = '/auth/admin/login';
    }

    const response: any = await apiClient.post(url, { email, password });
    
    // Save tokens and session
    const userObj = response.user || response.mechanic || response.admin;
    const finalUser: UserProfile = {
      ...userObj,
      role: userObj.role || role
    };

    localStorage.setItem(TOKEN_KEY, response.token);
    if (response.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(finalUser));
    localStorage.setItem('user', JSON.stringify(finalUser)); // for legacy compatibility
    localStorage.setItem('role', finalUser.role);
    localStorage.setItem('loggedIn', 'true');

    return finalUser;
  },

  register: async (userData: any): Promise<UserProfile> => {
    const response: any = await apiClient.post('/auth/register', userData);
    
    const finalUser: UserProfile = {
      ...response.user,
      role: 'user'
    };

    localStorage.setItem(TOKEN_KEY, response.token);
    if (response.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(finalUser));
    localStorage.setItem('user', JSON.stringify(finalUser));
    localStorage.setItem('role', 'user');
    localStorage.setItem('loggedIn', 'true');

    return finalUser;
  },

  registerMechanic: async (mechanicData: any): Promise<any> => {
    const response: any = await apiClient.post('/auth/mechanic/register', mechanicData);
    return response;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('roadrescue_remember');
  },

  getCurrentUser: (): UserProfile | null => {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return localStorage.getItem('loggedIn') === 'true' && !!localStorage.getItem(TOKEN_KEY);
  }
};
