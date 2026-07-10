// TEMP MOCK AUTH
// REMOVE WHEN BACKEND IS READY

// TEMP MOCK AUTH
// REMOVE WHEN BACKEND IS READY
import { CustomerStore, MechanicStore } from './store';

// TEMP MOCK AUTH — REMOVE WHEN BACKEND IS READY
const demoUsers = [
  {
    role: 'user' as const,
    email: 'user@roadrescue.in',
    password: 'user123',
    name: 'Demo User',
  },
  {
    role: 'mechanic' as const,
    email: 'mechanic@roadrescue.in',
    password: 'mechanic123',
    name: 'Rajesh Mechanic',
  },
  {
    role: 'admin' as const,
    email: 'admin@roadrescue.in',
    password: 'admin123',
    name: 'Administrator',
  },
];

const STORAGE_KEY = 'roadrescue_user';

export const demoAuthService = {
  // TEMP MOCK AUTH — REMOVE WHEN BACKEND IS READY
  authenticate: async (
    email: string,
    password: string,
    role: 'user' | 'mechanic' | 'admin',
    rememberMe = false,
  ) => {
    const match = demoUsers.find(
      (u) =>
        u.role === role &&
        u.email.trim().toLowerCase() === email.trim().toLowerCase() &&
        u.password === password,
    );

    if (match) {
      const user = { name: match.name, email: match.email, role: match.role };

      // TEMP MOCK AUTH — REMOVE WHEN BACKEND IS READY
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('role', match.role);
      localStorage.setItem('loggedIn', 'true');

      // Remember Me — persist across sessions
      if (rememberMe) {
        localStorage.setItem('roadrescue_remember', 'true');
      } else {
        localStorage.removeItem('roadrescue_remember');
      }

      return user;
    }

    throw new Error('Incorrect demo credentials.');
  },

  register: async (userData: { name: string; email: string; phone?: string }) => {
    const user = {
      name: userData.name,
      email: userData.email,
      role: 'user' as const,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('role', user.role);
    localStorage.setItem('loggedIn', 'true');

    CustomerStore.createOrUpdate({ name: userData.name, email: userData.email, phone: userData.phone });
    return user;
  },

  registerMechanic: async (userData: { name: string; email: string; phone?: string; password?: string }) => {
    const user = {
      name: userData.name,
      email: userData.email,
      role: 'mechanic' as const,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('role', user.role);
    localStorage.setItem('loggedIn', 'true');

    MechanicStore.create(userData);
    return user;
  },

  logout: () => {
    // TEMP MOCK AUTH — REMOVE WHEN BACKEND IS READY
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('roadrescue_remember');
  },

  // TEMP MOCK AUTH — REMOVE WHEN BACKEND IS READY
  getCurrentUser: () => {
    // Check primary mock auth key first, fall back to legacy keys
    let userJson = localStorage.getItem(STORAGE_KEY);
    if (!userJson) {
      const loggedIn = localStorage.getItem('loggedIn') === 'true';
      if (loggedIn) {
        userJson = localStorage.getItem('user');
      }
    }
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  },
};
