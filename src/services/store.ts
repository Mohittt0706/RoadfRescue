// TODO: Replace demo login with backend API authentication

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
    this.listeners.forEach(l => {
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

// Auto-sync across multiple tabs using storage event
window.addEventListener('storage', (e) => {
  if (e.key && (e.key.startsWith('rr_') || e.key === 'bookings' || e.key.startsWith('sos') || e.key === 'admin_notifications')) {
    storeEmitter.notify();
  }
});

// Helper for localStorage
const getJSON = (key: string, fallback: any) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

const setJSON = (key: string, val: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    localStorage.setItem('rr_sync_trigger', Date.now().toString());
    storeEmitter.notify();
  } catch (err) {
    console.error(err);
  }
};

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

// --------------------------------------------------------------------------
// 1. BOOKING STORE
// --------------------------------------------------------------------------
export const BookingStore = {
  subscribe: (listener: Listener) => storeEmitter.subscribe(listener),

  getAll: () => {
    return getJSON('bookings', []);
  },

  getById: (id: string) => {
    const list = BookingStore.getAll();
    return list.find((b: any) => b.id === id) || null;
  },

  create: (data: any) => {
    const list = BookingStore.getAll();
    const newBooking = {
      id: `RR-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      customer: data.customer || 'Guest User',
      customer_name: data.customer || 'Guest User',
      phone: data.phone || '+91 99999 99999',
      vehicle: data.vehicle || 'Sedan',
      vehicle_type: data.vehicle || 'Sedan',
      vehicle_number: data.vehicle_number || 'GJ 05 AB 1234',
      address: data.address || 'Unknown highway coordinates',
      gps: data.gps || { lat: 23.0225, lng: 72.5714 },
      service: data.service || 'Flat Tire Repair',
      service_name: data.service || 'Flat Tire Repair',
      price: data.price || 999,
      eta: data.eta || '15 mins',
      paymentMethod: data.paymentMethod || 'Cash',
      payment_method: data.paymentMethod || 'Cash',
      created_time: new Date().toISOString(),
      booking_time: new Date().toISOString(),
      status: 'Pending Approval', // Default state
      notes: data.notes || '',
      mechanic: '',
      mechanic_name: '',
    };

    list.unshift(newBooking);
    setJSON('bookings', list);

    CustomerStore.createOrUpdate({
      name: newBooking.customer,
      phone: newBooking.phone,
      vehicle_type: newBooking.vehicle,
      vehicle_number: newBooking.vehicle_number
    });

    // Trigger Admin Notification
    NotificationStore.create({
      title: '🔔 New Booking Received',
      message: `New booking request for ${newBooking.service} from ${newBooking.customer}.`,
      role: 'admin',
      type: 'request'
    });

    playNotificationSound();
    return newBooking;
  },

  updateStatus: (id: string, status: string, notes?: string) => {
    const list = BookingStore.getAll();
    const idx = list.findIndex((b: any) => b.id === id);
    if (idx !== -1) {
      const oldStatus = list[idx].status;
      list[idx].status = status;
      if (notes) {
        list[idx].notes = notes;
      }
      setJSON('bookings', list);

      // Notify customer (User)
      NotificationStore.create({
        title: `Booking Update: ${status}`,
        message: `Your booking for ${list[idx].service} has been updated to "${status}".`,
        role: 'user',
        type: 'alert'
      });

      // Notify mechanic if assigned
      if (list[idx].mechanic_email) {
        NotificationStore.create({
          title: `Job Status Update`,
          message: `The job for ${list[idx].customer} is now "${status}".`,
          role: 'mechanic',
          type: 'alert'
        });
      }
    }
  },

  assignMechanic: (bookingId: string, mechanicId: string) => {
    const list = BookingStore.getAll();
    const idx = list.findIndex((b: any) => b.id === bookingId);
    if (idx !== -1) {
      const mech = MechanicStore.getById(mechanicId);
      if (mech) {
        list[idx].mechanic = mech.name;
        list[idx].mechanic_name = mech.name;
        list[idx].mechanic_email = mech.email;
        list[idx].mechanic_phone = mech.phone;
        list[idx].status = 'Mechanic Assigned';
        setJSON('bookings', list);

        // Update mechanic status to busy
        MechanicStore.updateStatus(mechanicId, 'busy');

        // Notify Mechanic
        NotificationStore.create({
          title: '⚡ New Job Assigned',
          message: `You have been assigned to ${list[idx].service} for ${list[idx].customer}.`,
          role: 'mechanic',
          type: 'request'
        });

        // Notify Customer (User)
        NotificationStore.create({
          title: '👨‍🔧 Mechanic Dispatched',
          message: `${mech.name} has been assigned to your booking. ETA: ${list[idx].eta}.`,
          role: 'user',
          type: 'alert'
        });

        playNotificationSound();
      }
    }
  },

  delete: (id: string) => {
    const list = BookingStore.getAll();
    const filtered = list.filter((b: any) => b.id !== id);
    setJSON('bookings', filtered);
  }
};

// --------------------------------------------------------------------------
// 2. NOTIFICATION STORE
// --------------------------------------------------------------------------
export const NotificationStore = {
  subscribe: (listener: Listener) => storeEmitter.subscribe(listener),

  getAll: () => {
    return getJSON('admin_notifications', []);
  },

  create: (data: { title: string; message: string; role: 'admin' | 'mechanic' | 'user'; type?: string }) => {
    const list = NotificationStore.getAll();
    const newNotif = {
      id: `NT-${Math.floor(10000 + Math.random() * 90000)}`,
      title: data.title,
      message: data.message,
      role: data.role,
      type: data.type || 'alert',
      created_at: new Date().toISOString(),
      read: false
    };
    list.unshift(newNotif);
    setJSON('admin_notifications', list);
    return newNotif;
  },

  markAllRead: (role?: 'admin' | 'mechanic' | 'user') => {
    const list = NotificationStore.getAll();
    const updated = list.map((n: any) => {
      if (!role || n.role === role) {
        return { ...n, read: true };
      }
      return n;
    });
    setJSON('admin_notifications', updated);
  },

  getUnreadCount: (role: 'admin' | 'mechanic' | 'user') => {
    const list = NotificationStore.getAll();
    return list.filter((n: any) => n.role === role && !n.read).length;
  }
};

// --------------------------------------------------------------------------
// 3. MECHANIC STORE
// --------------------------------------------------------------------------
const DEFAULT_MECHANICS = [
  { id: 'mech1', name: 'Rajesh Kumar', email: 'rajesh@roadrescue.in', phone: '+91 98234 56789', specialization: 'EVs & Hybrid Systems', rating: 4.8, experience_years: 6, total_jobs: 142, status: 'available' },
  { id: 'mech2', name: 'Amit Sharma', email: 'amit@roadrescue.in', phone: '+91 91122 33445', specialization: 'Heavy Towing & Tyres', rating: 4.9, experience_years: 8, total_jobs: 289, status: 'available' },
  { id: 'mech3', name: 'Suresh Patil', email: 'suresh@roadrescue.in', phone: '+91 93344 55667', specialization: 'High Performance Engines', rating: 4.7, experience_years: 5, total_jobs: 104, status: 'busy' }
];

export const MechanicStore = {
  subscribe: (listener: Listener) => storeEmitter.subscribe(listener),

  getAll: () => {
    const stored = localStorage.getItem('rr_mechanics');
    if (!stored) {
      localStorage.setItem('rr_mechanics', JSON.stringify(DEFAULT_MECHANICS));
      return DEFAULT_MECHANICS;
    }
    return JSON.parse(stored);
  },

  getById: (id: string) => {
    const list = MechanicStore.getAll();
    return list.find((m: any) => m.id === id) || null;
  },

  getByEmail: (email: string) => {
    const list = MechanicStore.getAll();
    return list.find((m: any) => m.email.toLowerCase() === email.toLowerCase()) || null;
  },

  updateStatus: (id: string, status: 'available' | 'busy') => {
    const list = MechanicStore.getAll();
    const idx = list.findIndex((m: any) => m.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      setJSON('rr_mechanics', list);
    }
  },

  create: (data: { name: string; email: string; phone?: string; password?: string }) => {
    const list = MechanicStore.getAll();

    // Check if already exists
    const existing = list.find((m: any) => m.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      return existing;
    }

    const newMech = {
      id: `mech${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone || '+91 99999 99999',
      workshopName: `${data.name}'s Workshop`,
      specialization: 'General Auto Repair',
      experience_years: 0,
      skills: ['Basic Repairs'],
      rating: 5.0,
      total_jobs: 0,
      jobsCompleted: 0,
      pendingJobs: 0,
      todayJobs: 0,
      status: 'available',
      online: true,
      location: 'Mumbai, MH',
      revenue: 0,
      assignedJob: '',
      password_hash: data.password || ''
    };
    list.push(newMech);
    setJSON('rr_mechanics', list);

    NotificationStore.create({
      title: '🔧 New Mechanic Joined',
      message: `${newMech.name} has registered as a mechanic.`,
      role: 'admin',
      type: 'alert'
    });

    playNotificationSound();
    return newMech;
  },

  update: (id: string, data: any) => {
    const list = MechanicStore.getAll();
    const idx = list.findIndex((m: any) => m.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      setJSON('rr_mechanics', list);
      return list[idx];
    }
    return null;
  },

  delete: (id: string) => {
    const list = MechanicStore.getAll();
    const filtered = list.filter((m: any) => m.id !== id);
    setJSON('rr_mechanics', filtered);
  },

  getStats: () => {
    const list = MechanicStore.getAll();
    const todayStr = new Date().toDateString();
    return {
      totalMechanics: list.length,
      onlineMechanics: list.filter((m: any) => m.online !== false).length,
      busyMechanics: list.filter((m: any) => m.status === 'busy').length,
      availableMechanics: list.filter((m: any) => m.status === 'available').length
    };
  }
};

// --------------------------------------------------------------------------
// 4. CUSTOMER STORE
// --------------------------------------------------------------------------
export const CustomerStore = {
  subscribe: (listener: Listener) => storeEmitter.subscribe(listener),

  getAll: () => {
    return getJSON('customers', []);
  },

  getById: (id: string) => {
    const list = CustomerStore.getAll();
    return list.find((c: any) => c.id === id) || null;
  },

  getByEmail: (email: string) => {
    if (!email) return null;
    const list = CustomerStore.getAll();
    return list.find((c: any) => c.email?.toLowerCase() === email.toLowerCase()) || null;
  },

  getByPhone: (phone: string) => {
    if (!phone) return null;
    const list = CustomerStore.getAll();
    const cleaned = phone.replace(/[\s\-+]/g, '');
    return list.find((c: any) => c.phone?.replace(/[\s\-+]/g, '') === cleaned) || null;
  },

  createOrUpdate: (data: { name: string; phone?: string; email?: string; vehicle_type?: string; vehicle_number?: string }) => {
    const list = CustomerStore.getAll();
    const now = new Date().toISOString();

    // Find existing by email or phone
    let existing: any = null;
    if (data.email) existing = CustomerStore.getByEmail(data.email);
    if (!existing && data.phone) existing = CustomerStore.getByPhone(data.phone);

    if (existing) {
      // Update existing
      const idx = list.findIndex((c: any) => c.id === existing.id);
      if (idx !== -1) {
        list[idx].name = data.name || list[idx].name;
        if (data.phone) list[idx].phone = data.phone;
        if (data.email) list[idx].email = data.email;
        if (data.vehicle_type && !list[idx].vehicles?.includes(data.vehicle_type)) {
          list[idx].vehicles = [...(list[idx].vehicles || []), data.vehicle_type];
        }
        if (data.vehicle_number && !list[idx].vehicleNumbers?.includes(data.vehicle_number)) {
          list[idx].vehicleNumbers = [...(list[idx].vehicleNumbers || []), data.vehicle_number];
        }
        list[idx].vehicleCount = list[idx].vehicleNumbers?.length || 0;
        list[idx].updatedAt = now;
        setJSON('customers', list);
        return list[idx];
      }
    }

    // Create new customer
    const newCustomer = {
      id: `CUST-${Math.floor(10000 + Math.random() * 90000)}`,
      name: data.name || 'Guest',
      phone: data.phone || '',
      email: data.email || '',
      avatar: (data.name || 'G').charAt(0).toUpperCase(),
      vehicles: data.vehicle_type ? [data.vehicle_type] : [],
      vehicleNumbers: data.vehicle_number ? [data.vehicle_number] : [],
      vehicleCount: data.vehicle_number ? 1 : 0,
      city: '',
      totalBookings: 0,
      sosCount: 0,
      completedJobs: 0,
      cancelledJobs: 0,
      totalSpent: 0,
      lastBooking: '',
      registrationDate: now,
      status: 'active',
      updatedAt: now
    };
    list.unshift(newCustomer);
    setJSON('customers', list);

    NotificationStore.create({
      title: '👤 New Customer Registered',
      message: `${newCustomer.name} has joined RoadRescue.`,
      role: 'admin',
      type: 'alert'
    });

    return newCustomer;
  },

  updateFromBooking: (data: { customer_name?: string; phone?: string; email?: string; vehicle_type?: string; vehicle_number?: string; price?: number; status?: string; booking_time?: string }) => {
    const name = data.customer_name || data.phone || 'Guest';
    let customer = null;
    if (data.email) customer = CustomerStore.getByEmail(data.email);
    if (!customer && data.phone) customer = CustomerStore.getByPhone(data.phone);

    const list = CustomerStore.getAll();

    if (customer) {
      const idx = list.findIndex((c: any) => c.id === customer.id);
      if (idx !== -1) {
        list[idx].totalBookings = (list[idx].totalBookings || 0) + 1;
        list[idx].totalSpent = (list[idx].totalSpent || 0) + (data.price || 0);
        if (data.vehicle_number && !list[idx].vehicleNumbers?.includes(data.vehicle_number)) {
          list[idx].vehicleNumbers = [...(list[idx].vehicleNumbers || []), data.vehicle_number];
          list[idx].vehicleCount = list[idx].vehicleNumbers.length;
        }
        if (data.status === 'Completed') list[idx].completedJobs = (list[idx].completedJobs || 0) + 1;
        if (data.status === 'Cancelled') list[idx].cancelledJobs = (list[idx].cancelledJobs || 0) + 1;
        list[idx].lastBooking = data.booking_time || new Date().toISOString();
        list[idx].updatedAt = new Date().toISOString();
        setJSON('customers', list);
        return list[idx];
      }
    }

    // Create new customer from booking data
    const now = new Date().toISOString();
    const newCust = {
      id: `CUST-${Math.floor(10000 + Math.random() * 90000)}`,
      name: name,
      phone: data.phone || '',
      email: data.email || '',
      avatar: name.charAt(0).toUpperCase(),
      vehicles: data.vehicle_type ? [data.vehicle_type] : [],
      vehicleNumbers: data.vehicle_number ? [data.vehicle_number] : [],
      vehicleCount: data.vehicle_number ? 1 : 0,
      city: '',
      totalBookings: 1,
      sosCount: 0,
      completedJobs: data.status === 'Completed' ? 1 : 0,
      cancelledJobs: data.status === 'Cancelled' ? 1 : 0,
      totalSpent: data.price || 0,
      lastBooking: data.booking_time || now,
      registrationDate: now,
      status: 'active',
      updatedAt: now
    };
    list.unshift(newCust);
    setJSON('customers', list);
    return newCust;
  },

  incrementSosCount: (phone?: string, email?: string) => {
    let customer: any = null;
    if (email) customer = CustomerStore.getByEmail(email);
    if (!customer && phone) customer = CustomerStore.getByPhone(phone);
    if (!customer) return;

    const list = CustomerStore.getAll();
    const idx = list.findIndex((c: any) => c.id === customer.id);
    if (idx !== -1) {
      list[idx].sosCount = (list[idx].sosCount || 0) + 1;
      list[idx].updatedAt = new Date().toISOString();
      setJSON('customers', list);
    }
  },

  update: (id: string, data: any) => {
    const list = CustomerStore.getAll();
    const idx = list.findIndex((c: any) => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
      setJSON('customers', list);
      return list[idx];
    }
    return null;
  },

  delete: (id: string) => {
    const list = CustomerStore.getAll();
    const filtered = list.filter((c: any) => c.id !== id);
    setJSON('customers', filtered);
  },

  getStats: () => {
    const list = CustomerStore.getAll();
    const todayStr = new Date().toDateString();
    const total = list.length;
    const active = list.filter((c: any) => c.status === 'active').length;
    const newToday = list.filter((c: any) => new Date(c.registrationDate).toDateString() === todayStr).length;
    return { totalCustomers: total, activeCustomers: active, newCustomersToday: newToday };
  }
};

// --------------------------------------------------------------------------
// 5. DASHBOARD STORE
// --------------------------------------------------------------------------
export const DashboardStore = {
  subscribe: (listener: Listener) => storeEmitter.subscribe(listener),

  getAdminStats: () => {
    const bookings = BookingStore.getAll();
    const sos = EmergencyStore.getAll();
    const customers = CustomerStore.getAll();
    const mechs = MechanicStore.getAll();

    const totalBookings = bookings.length;
    const pendingJobs = bookings.filter((b: any) => b.status === 'Pending Approval').length;
    const acceptedJobs = bookings.filter((b: any) => b.status === 'Accepted' || b.status === 'Mechanic Assigned' || b.status === 'Mechanic Started' || b.status === 'Mechanic Nearby' || b.status === 'Arrived').length;
    const completedJobs = bookings.filter((b: any) => b.status === 'Completed').length;
    const cancelledJobs = bookings.filter((b: any) => b.status === 'Cancelled').length;

    // Today's bookings
    const todayStr = new Date().toDateString();
    const todayBookings = bookings.filter((b: any) => new Date(b.created_time).toDateString() === todayStr).length;

    // Revenue (bookings + SOS)
    const bookingRevenueToday = bookings
      .filter((b: any) => b.status === 'Completed' && new Date(b.created_time).toDateString() === todayStr)
      .reduce((acc: number, b: any) => acc + (b.price || 0), 0);
    const sosRevenueToday = sos
      .filter((s: any) => s.status === 'Completed' && new Date(s.created_time).toDateString() === todayStr)
      .reduce((acc: number, s: any) => acc + (s.price || 0), 0);

    const bookingRevenueMonth = bookings
      .filter((b: any) => b.status === 'Completed' && new Date(b.created_time).getMonth() === new Date().getMonth())
      .reduce((acc: number, b: any) => acc + (b.price || 0), 0);
    const sosRevenueMonth = sos
      .filter((s: any) => s.status === 'Completed' && new Date(s.created_time).getMonth() === new Date().getMonth())
      .reduce((acc: number, s: any) => acc + (s.price || 0), 0);

    // Customer counts
    const customerStats = CustomerStore.getStats();
    const mechanicStats = MechanicStore.getStats();

    // SOS stats
    const sosToday = sos.filter((s: any) => new Date(s.created_time).toDateString() === todayStr).length;
    const pendingSOS = sos.filter((s: any) => s.status === 'Pending').length;
    const completedSOS = sos.filter((s: any) => s.status === 'Completed').length;

    // Notifications
    const unreadNotifications = NotificationStore.getUnreadCount('admin');

    return {
      totalBookings,
      pendingJobs,
      acceptedJobs,
      completedJobs,
      cancelledJobs,
      todayBookings,
      revenueToday: bookingRevenueToday + sosRevenueToday,
      revenueMonth: bookingRevenueMonth + sosRevenueMonth,
      availableMechanics: mechanicStats.availableMechanics,
      busyMechanics: mechanicStats.busyMechanics,
      totalMechanics: mechanicStats.totalMechanics,
      onlineMechanics: mechanicStats.onlineMechanics,
      totalCustomers: customerStats.totalCustomers,
      activeCustomers: customerStats.activeCustomers,
      newCustomersToday: customerStats.newCustomersToday,
      sosToday,
      pendingSOS,
      completedSOS,
      unreadNotifications
    };
  }
};

// --------------------------------------------------------------------------
// 6. ANALYTICS STORE
// --------------------------------------------------------------------------
export const AnalyticsStore = {
  subscribe: (listener: Listener) => storeEmitter.subscribe(listener),

  getChartData: () => {
    const bookings = BookingStore.getAll();

    // Service Distribution
    const serviceMap = new Map();
    bookings.forEach((b: any) => {
      const name = b.service || 'Flat Tire Repair';
      if (!serviceMap.has(name)) {
        serviceMap.set(name, { service: name, count: 1, revenue: b.price || 0 });
      } else {
        const entry = serviceMap.get(name);
        entry.count += 1;
        entry.revenue += b.price || 0;
      }
    });

    const serviceDistribution = Array.from(serviceMap.values());

    // Workload (jobs completed by mechanic)
    const workloadMap = new Map();
    bookings.forEach((b: any) => {
      if (b.status === 'Completed' && b.mechanic) {
        if (!workloadMap.has(b.mechanic)) {
          workloadMap.set(b.mechanic, { name: b.mechanic, completed: 1, revenue: b.price || 0 });
        } else {
          const entry = workloadMap.get(b.mechanic);
          entry.completed += 1;
          entry.revenue += b.price || 0;
        }
      }
    });

    const mechanicWorkload = Array.from(workloadMap.values());

    return {
      serviceDistribution,
      mechanicWorkload
    };
  }
};

// --------------------------------------------------------------------------
// 7. EMERGENCY STORE (SOS)
// --------------------------------------------------------------------------
export const EmergencyStore = {
  subscribe: (listener: Listener) => storeEmitter.subscribe(listener),

  getAll: () => {
    return getJSON('sosBookings', []);
  },

  getById: (id: string) => {
    const list = EmergencyStore.getAll();
    return list.find((e: any) => e.id === id) || null;
  },

  create: (data: any) => {
    const list = EmergencyStore.getAll();
    const now = new Date().toISOString();
    const newEmergency = {
      id: `SOS-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: data.customer_name || 'Guest User',
      phone: data.phone || '+91 99999 99999',
      email: data.email || '',
      vehicle_type: data.vehicle || data.vehicle_type || 'Car',
      vehicle_number: data.vehicle_number || 'MH 12 AB 1234',
      latitude: data.latitude || data.gps?.lat || 23.0225,
      longitude: data.longitude || data.gps?.lng || 72.5714,
      address: data.address || 'Mumbai Highway',
      emergency_type: data.emergency_type || 'Flat Tire',
      priority: data.priority || 'Critical',
      payment_method: data.payment_method || 'UPI',
      price: data.price || 1499,
      estimated_price: data.price || 1499,
      eta: data.eta || '15-25 mins',
      status: 'Pending',
      assigned_mechanic: '',
      assigned_mechanic_email: '',
      notes: data.notes || '',
      created_time: now,
      booking_time: now,
      updated_time: now,
      payment_status: 'Pending'
    };
    list.unshift(newEmergency);
    setJSON('sosBookings', list);

    CustomerStore.createOrUpdate({
      name: newEmergency.customer_name,
      phone: newEmergency.phone,
      email: newEmergency.email,
      vehicle_type: newEmergency.vehicle_type,
      vehicle_number: newEmergency.vehicle_number
    });
    CustomerStore.incrementSosCount(newEmergency.phone, newEmergency.email);

    // Notify Admin
    NotificationStore.create({
      title: '🚨 New SOS Emergency',
      message: `New SOS from ${newEmergency.customer_name}: ${newEmergency.emergency_type} (${newEmergency.priority})`,
      role: 'admin',
      type: 'alert'
    });

    playNotificationSound();
    return newEmergency;
  },

  updateStatus: (id: string, status: string, notes?: string) => {
    const list = EmergencyStore.getAll();
    const idx = list.findIndex((e: any) => e.id === id);
    if (idx !== -1) {
      const oldStatus = list[idx].status;
      list[idx].status = status;
      list[idx].updated_time = new Date().toISOString();
      if (notes) {
        list[idx].notes = notes;
      }
      setJSON('sosBookings', list);

      // Notify User
      NotificationStore.create({
        title: `SOS ${status}`,
        message: `Your SOS request has been updated to "${status}".`,
        role: 'user',
        type: 'alert'
      });

      // Notify Admin on status changes
      if (status !== 'Pending') {
        NotificationStore.create({
          title: `SOS ${status}`,
          message: `SOS ${id} for ${list[idx].customer_name} is now "${status}".`,
          role: 'admin',
          type: 'alert'
        });
      }

      // Notify Mechanic if assigned
      if (list[idx].assigned_mechanic_email) {
        NotificationStore.create({
          title: `SOS Job ${status}`,
          message: `SOS job for ${list[idx].customer_name} is now "${status}".`,
          role: 'mechanic',
          type: 'alert'
        });
      }

      playNotificationSound();
    }
  },

  assign: (id: string, mechanicName: string, eta: string, price?: number) => {
    const list = EmergencyStore.getAll();
    const idx = list.findIndex((e: any) => e.id === id);
    if (idx !== -1) {
      const mechs = MechanicStore.getAll();
      const mech = mechs.find((m: any) => m.name === mechanicName);

      list[idx].assigned_mechanic = mechanicName;
      list[idx].assigned_mechanic_email = mech?.email || '';
      list[idx].status = 'Mechanic Assigned';
      list[idx].eta = eta;
      list[idx].updated_time = new Date().toISOString();
      if (price) {
        list[idx].price = price;
        list[idx].estimated_price = price;
      }
      setJSON('sosBookings', list);

      if (mech) {
        MechanicStore.updateStatus(mech.id, 'busy');

        // Notify Mechanic
        NotificationStore.create({
          title: '🚨 Emergency Job Assigned',
          message: `URGENT: ${list[idx].emergency_type} at ${list[idx].address}. Customer: ${list[idx].customer_name}. ETA: ${eta}.`,
          role: 'mechanic',
          type: 'alert'
        });
      }

      // Notify User
      NotificationStore.create({
        title: '👨‍🔧 Mechanic Assigned',
        message: `${mechanicName} has been assigned to your SOS. ETA: ${eta}.`,
        role: 'user',
        type: 'alert'
      });

      // Notify Admin
      NotificationStore.create({
        title: '🔧 Mechanic Assigned to SOS',
        message: `${mechanicName} assigned to SOS ${id}.`,
        role: 'admin',
        type: 'alert'
      });

      playNotificationSound();
    }
  },

  delete: (id: string) => {
    const list = EmergencyStore.getAll();
    const filtered = list.filter((e: any) => e.id !== id);
    setJSON('sosBookings', filtered);
  },

  getStats: () => {
    const sos = EmergencyStore.getAll();
    const todayStr = new Date().toDateString();

    const sosToday = sos.filter((s: any) => new Date(s.created_time).toDateString() === todayStr).length;
    const pendingSOS = sos.filter((s: any) => s.status === 'Pending').length;
    const criticalSOS = sos.filter((s: any) => s.priority === 'Critical').length;
    const completedSOS = sos.filter((s: any) => s.status === 'Completed').length;

    const completedTimes = sos
      .filter((s: any) => s.status === 'Completed' && s.created_time && s.updated_time)
      .map((s: any) => {
        const created = new Date(s.created_time).getTime();
        const updated = new Date(s.updated_time).getTime();
        return (updated - created) / 60000;
      });

    const avgResponseTime = completedTimes.length > 0
      ? Math.round(completedTimes.reduce((a: number, b: number) => a + b, 0) / completedTimes.length)
      : 0;

    return { sosToday, pendingSOS, criticalSOS, completedSOS, avgResponseTime };
  },

  getAnalytics: () => {
    const sos = EmergencyStore.getAll();

    // SOS by Type
    const typeMap = new Map();
    sos.forEach((s: any) => {
      const t = s.emergency_type || 'Other';
      if (!typeMap.has(t)) typeMap.set(t, { type: t, count: 1 });
      else { const e = typeMap.get(t); e.count += 1; }
    });
    const sosByType = Array.from(typeMap.values());

    // SOS by Priority
    const priorityMap = new Map();
    sos.forEach((s: any) => {
      const p = s.priority || 'Normal';
      if (!priorityMap.has(p)) priorityMap.set(p, { priority: p, count: 1 });
      else { const e = priorityMap.get(p); e.count += 1; }
    });
    const sosByPriority = Array.from(priorityMap.values());

    // Daily SOS (last 7 days)
    const dailyMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toDateString();
      dailyMap.set(key, { date: key, count: 0 });
    }
    sos.forEach((s: any) => {
      const key = new Date(s.created_time).toDateString();
      if (dailyMap.has(key)) dailyMap.get(key).count += 1;
    });
    const dailySOS = Array.from(dailyMap.values());

    // Weekly SOS (last 4 weeks)
    const weeklyMap = new Map();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i * 7);
      const key = `Week ${4 - i}`;
      weeklyMap.set(key, { week: key, count: 0 });
    }
    sos.forEach((s: any) => {
      const created = new Date(s.created_time);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      const weekIdx = Math.min(3, Math.floor(diffDays / 7));
      const key = `Week ${4 - weekIdx}`;
      if (weeklyMap.has(key)) weeklyMap.get(key).count += 1;
    });
    const weeklySOS = Array.from(weeklyMap.values());

    // Completed %
    const total = sos.length || 1;
    const completedCount = sos.filter((s: any) => s.status === 'Completed').length;
    const completedPercent = Math.round((completedCount / total) * 100);

    // Average ETA
    const withETA = sos.filter((s: any) => s.eta);
    const avgEta = withETA.length > 0
      ? Math.round(withETA.reduce((acc: number, s: any) => {
          const match = s.eta.match(/\d+/);
          return acc + (match ? parseInt(match[0]) : 20);
        }, 0) / withETA.length)
      : 0;

    return { sosByType, sosByPriority, dailySOS, weeklySOS, completedPercent, avgEta };
  }
};
