import { io } from 'socket.io-client';
import apiClient from './api';
import { bookingService } from './bookingService';
import { mechanicService } from './mechanicService';
import { paymentService } from './paymentService';
import { adminService } from './adminService';
import { chatService } from './chatService';
import { notificationService } from './notificationService';
import { authService } from './authService';

type Listener = () => void;

class GlobalEventEmitter {
  private listeners = new Set<Listener>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Error in store listener:', err);
      }
    });
  }
}

// Instantiate emitter
const storeEmitter = new GlobalEventEmitter();

// Instanstiate Socket.io Connection
const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
export const socket = io(socketUrl, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

// Configure Socket Listeners
socket.on('connect', () => {
  console.log('Socket.io connected:', socket.id);
  
  // Re-join proper socket rooms based on user role
  const user = authService.getCurrentUser();
  if (user) {
    if (user.role === 'admin') {
      socket.emit('join_admin');
    } else {
      socket.emit('join_user', user.id);
    }
  }
});

socket.on('messageReceived', (message: any) => {
  // Trigger chat updates
  storeEmitter.notify();
});

socket.on('bookingStatusUpdated', (data: any) => {
  // Sync state and notify listeners
  BookingStore.fetch();
  NotificationStore.fetch();
});

socket.on('notificationReceived', (notif: any) => {
  NotificationStore.fetch();
  playNotificationSound();
});

// Play alert sound for real-time notifications
export function playNotificationSound() {
  try {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (err) {
    console.error('Audio playback failed:', err);
  }
}

// Global triggering helper to refetch all stores on user login/logout
export function syncAllStores() {
  bookingsFetched = false;
  notificationsFetched = false;
  mechanicsFetched = false;
  customersFetched = false;
  dashboardStats = {};
  chartData = {};
  emergenciesFetched = false;

  BookingStore.fetch();
  NotificationStore.fetch();
  MechanicStore.fetch();
  CustomerStore.fetch();
  DashboardStore.fetch();
  AnalyticsStore.fetch();
  EmergencyStore.fetch();
}

// --------------------------------------------------------------------------
// 1. BOOKING STORE
// --------------------------------------------------------------------------
let bookingsCache: any[] = [];
let bookingsFetched = false;

export const BookingStore = {
  subscribe: (listener: Listener) => storeEmitter.subscribe(listener),

  getAll: () => {
    const user = authService.getCurrentUser();
    if (user && !bookingsFetched) {
      bookingsFetched = true;
      BookingStore.fetch();
    }
    return bookingsCache;
  },

  getById: (id: string) => {
    return bookingsCache.find((b: any) => b.id === id) || null;
  },

  fetch: async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      let res: any;
      if (user.role === 'admin' || user.role === 'super_admin') {
        res = await adminService.getBookings();
      } else {
        res = await bookingService.getAll();
      }
      bookingsCache = res.bookings || res || [];
      storeEmitter.notify();
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  },

  create: async (data: any) => {
    const res = await bookingService.create(data);
    await BookingStore.fetch();
    return res;
  },

  updateStatus: async (id: string, status: string, notes?: string) => {
    await bookingService.update(id, { status, notes });
    await BookingStore.fetch();
  },

  assignMechanic: async (bookingId: string, mechanicId: string) => {
    await mechanicService.assign(bookingId, mechanicId);
    await BookingStore.fetch();
    await MechanicStore.fetch();
    await DashboardStore.fetch();
  },

  delete: async (id: string) => {
    await bookingService.delete(id);
    await BookingStore.fetch();
  },
};

// --------------------------------------------------------------------------
// 2. NOTIFICATION STORE
// --------------------------------------------------------------------------
let notificationsCache: any[] = [];
let notificationsFetched = false;

export const NotificationStore = {
  subscribe: (listener: Listener) => storeEmitter.subscribe(listener),

  getAll: () => {
    const user = authService.getCurrentUser();
    if (user && !notificationsFetched) {
      notificationsFetched = true;
      NotificationStore.fetch();
    }
    return notificationsCache;
  },

  fetch: async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      let res: any;
      if (user.role === 'admin' || user.role === 'super_admin') {
        res = await adminService.getNotifications();
      } else {
        res = await notificationService.getAll();
      }
      notificationsCache = res.notifications || res || [];
      storeEmitter.notify();
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  },

  create: async (data: { title: string; message: string; role: 'admin' | 'mechanic' | 'user'; type?: string }) => {
    const res = await notificationService.create({
      title: data.title,
      message: data.message,
      targetRole: data.role,
      type: data.type || 'alert',
    });
    await NotificationStore.fetch();
    playNotificationSound();
    return res;
  },

  markAllRead: async (role?: 'admin' | 'mechanic' | 'user') => {
    const user = authService.getCurrentUser();
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      await adminService.markAllNotificationsRead();
    }
    await NotificationStore.fetch();
  },

  getUnreadCount: (role: 'admin' | 'mechanic' | 'user') => {
    return notificationsCache.filter(
      (n: any) => !n.read && (n.target_role === role || n.role === role)
    ).length;
  },
};

// --------------------------------------------------------------------------
// 3. MECHANIC STORE
// --------------------------------------------------------------------------
let mechanicsCache: any[] = [];
let mechanicsFetched = false;

export const MechanicStore = {
  subscribe: (listener: Listener) => storeEmitter.subscribe(listener),

  getAll: () => {
    if (!mechanicsFetched) {
      mechanicsFetched = true;
      MechanicStore.fetch();
    }
    return mechanicsCache;
  },

  getById: (id: string) => {
    return mechanicsCache.find((m: any) => m.id === id) || null;
  },

  getByEmail: (email: string) => {
    return mechanicsCache.find((m: any) => m.email?.toLowerCase() === email.toLowerCase()) || null;
  },

  fetch: async () => {
    try {
      const res: any = await mechanicService.getAll();
      mechanicsCache = res.mechanics || res || [];
      storeEmitter.notify();
    } catch (err) {
      console.error('Failed to fetch mechanics:', err);
    }
  },

  updateStatus: async (id: string, status: 'available' | 'busy') => {
    await mechanicService.updateStatus(id, status);
    await MechanicStore.fetch();
  },

  create: async (data: { name: string; email: string; phone?: string; password?: string }) => {
    const res = await authService.registerMechanic(data);
    await MechanicStore.fetch();
    return res.mechanic || res;
  },

  getStats: () => {
    return {
      totalMechanics: mechanicsCache.length,
      onlineMechanics: mechanicsCache.filter((m: any) => m.status !== 'offline').length,
      busyMechanics: mechanicsCache.filter((m: any) => m.status === 'busy').length,
      availableMechanics: mechanicsCache.filter((m: any) => m.status === 'available').length,
    };
  },
};

// --------------------------------------------------------------------------
// 4. CUSTOMER STORE
// --------------------------------------------------------------------------
let customersCache: any[] = [];
let customersFetched = false;

export const CustomerStore = {
  subscribe: (listener: Listener) => storeEmitter.subscribe(listener),

  getAll: () => {
    const user = authService.getCurrentUser();
    if (user && !customersFetched) {
      customersFetched = true;
      CustomerStore.fetch();
    }
    return customersCache;
  },

  getById: (id: string) => {
    return customersCache.find((c: any) => c.id === id) || null;
  },

  getByEmail: (email: string) => {
    return customersCache.find((c: any) => c.email?.toLowerCase() === email.toLowerCase()) || null;
  },

  getByPhone: (phone: string) => {
    const cleaned = phone.replace(/[\s\-+]/g, '');
    return customersCache.find((c: any) => c.phone?.replace(/[\s\-+]/g, '') === cleaned) || null;
  },

  fetch: async () => {
    try {
      const user = authService.getCurrentUser();
      if (user && (user.role === 'admin' || user.role === 'super_admin')) {
        const res: any = await adminService.getUsers();
        customersCache = res.users || res || [];
        storeEmitter.notify();
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  },

  createOrUpdate: async (data: any) => {
    const res = await adminService.createUser(data);
    await CustomerStore.fetch();
    return res;
  },

  update: async (id: string, data: any) => {
    await adminService.updateUser(id, data);
    await CustomerStore.fetch();
  },

  delete: async (id: string) => {
    await adminService.deleteUser(id);
    await CustomerStore.fetch();
  },

  getStats: () => {
    return {
      totalCustomers: customersCache.length,
      activeCustomers: customersCache.filter((c: any) => c.status === 'active').length,
      newCustomersToday: 0,
    };
  },
};

// --------------------------------------------------------------------------
// 5. DASHBOARD STORE
// --------------------------------------------------------------------------
let dashboardStats: any = {};

export const DashboardStore = {
  subscribe: (listener: Listener) => storeEmitter.subscribe(listener),

  getAdminStats: () => {
    const user = authService.getCurrentUser();
    if (user && Object.keys(dashboardStats).length === 0) {
      DashboardStore.fetch();
    }
    return {
      totalBookings: dashboardStats.totalBookings || 0,
      pendingJobs: dashboardStats.pendingBookings || 0,
      acceptedJobs: dashboardStats.acceptedBookings || 0,
      completedJobs: dashboardStats.completedBookings || 0,
      cancelledJobs: dashboardStats.cancelledBookings || 0,
      todayBookings: dashboardStats.todayBookings || 0,
      revenueToday: dashboardStats.revenueToday || 0,
      revenueMonth: dashboardStats.revenueMonth || 0,
      availableMechanics: dashboardStats.availableMechanics || 0,
      busyMechanics: dashboardStats.busyMechanics || 0,
      totalMechanics: dashboardStats.totalMechanics || 0,
      onlineMechanics: dashboardStats.onlineMechanics || 0,
      totalCustomers: dashboardStats.totalUsers || 0,
      activeCustomers: dashboardStats.activeUsers || 0,
      newCustomersToday: 0,
      sosToday: dashboardStats.sosToday || 0,
      pendingSOS: dashboardStats.pendingSOS || 0,
      completedSOS: dashboardStats.completedSOS || 0,
      unreadNotifications: NotificationStore.getUnreadCount('admin'),
    };
  },

  fetch: async () => {
    try {
      const user = authService.getCurrentUser();
      if (user && (user.role === 'admin' || user.role === 'super_admin')) {
        const res: any = await adminService.getDashboardStats();
        dashboardStats = res.stats || res || {};
        storeEmitter.notify();
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  },
};

// --------------------------------------------------------------------------
// 6. ANALYTICS STORE
// --------------------------------------------------------------------------
let chartData: any = {};

export const AnalyticsStore = {
  subscribe: (listener: Listener) => storeEmitter.subscribe(listener),

  getChartData: () => {
    const user = authService.getCurrentUser();
    if (user && Object.keys(chartData).length === 0) {
      AnalyticsStore.fetch();
    }
    return {
      serviceDistribution: chartData.serviceDistribution || [],
      mechanicWorkload: chartData.mechanicWorkload || [],
      monthlyRevenue: chartData.monthlyRevenue || [],
    };
  },

  fetch: async () => {
    try {
      const res: any = await apiClient.get('/admin/analytics');
      chartData = res.analytics || res || {};
      storeEmitter.notify();
    } catch (err) {
      // Offline fallback mapping calculations
      const bookings = BookingStore.getAll();
      const serviceMap = new Map();
      bookings.forEach((b: any) => {
        const name = b.service_name || b.service || 'Flat Tire Repair';
        if (!serviceMap.has(name)) {
          serviceMap.set(name, { service: name, count: 1, revenue: b.price || 0 });
        } else {
          const entry = serviceMap.get(name);
          entry.count += 1;
          entry.revenue += b.price || 0;
        }
      });
      const workloadMap = new Map();
      bookings.forEach((b: any) => {
        if (b.status === 'Completed' && b.mechanic_name) {
          if (!workloadMap.has(b.mechanic_name)) {
            workloadMap.set(b.mechanic_name, {
              name: b.mechanic_name,
              completed: 1,
              revenue: b.price || 0,
            });
          } else {
            const entry = workloadMap.get(b.mechanic_name);
            entry.completed += 1;
            entry.revenue += b.price || 0;
          }
        }
      });
      chartData = {
        serviceDistribution: Array.from(serviceMap.values()),
        mechanicWorkload: Array.from(workloadMap.values()),
      };
      storeEmitter.notify();
    }
  },
};

// --------------------------------------------------------------------------
// 7. EMERGENCY STORE (SOS)
// --------------------------------------------------------------------------
let emergenciesCache: any[] = [];
let emergenciesFetched = false;

export const EmergencyStore = {
  subscribe: (listener: Listener) => storeEmitter.subscribe(listener),

  getAll: () => {
    const user = authService.getCurrentUser();
    if (user && !emergenciesFetched) {
      emergenciesFetched = true;
      EmergencyStore.fetch();
    }
    return emergenciesCache;
  },

  getById: (id: string) => {
    return emergenciesCache.find((e: any) => e.id === id) || null;
  },

  fetch: async () => {
    try {
      const res: any = await chatService.getEmergencies();
      emergenciesCache = res.emergencies || res || [];
      storeEmitter.notify();
    } catch (err) {
      console.error('Failed to fetch SOS emergencies:', err);
    }
  },

  create: async (data: any) => {
    const res: any = await chatService.createEmergency(data);
    await EmergencyStore.fetch();
    return res.emergency || res;
  },

  updateStatus: async (id: string, status: string, notes?: string) => {
    await chatService.updateEmergencyStatus(id, status);
    await EmergencyStore.fetch();
    await DashboardStore.fetch();
  },

  assign: async (id: string, mechanicName: string, eta: string, price?: number) => {
    await chatService.assignEmergency(id, mechanicName, eta, price);
    await EmergencyStore.fetch();
    await MechanicStore.fetch();
    await DashboardStore.fetch();
  },

  delete: async (id: string) => {
    await chatService.deleteEmergency(id);
    await EmergencyStore.fetch();
  },

  getStats: () => {
    const todayStr = new Date().toDateString();
    const sosToday = emergenciesCache.filter(
      (s: any) => new Date(s.created_time).toDateString() === todayStr
    ).length;
    const pendingSOS = emergenciesCache.filter((s: any) => s.status === 'Pending').length;
    const criticalSOS = emergenciesCache.filter((s: any) => s.priority === 'Critical').length;
    const completedSOS = emergenciesCache.filter((s: any) => s.status === 'Completed').length;
    return { sosToday, pendingSOS, criticalSOS, completedSOS, avgResponseTime: 15 };
  },

  getAnalytics: () => {
    return {
      sosByType: [],
      sosByPriority: [],
      dailySOS: [],
      weeklySOS: [],
      completedPercent: 100,
      avgEta: 15,
    };
  },
};
