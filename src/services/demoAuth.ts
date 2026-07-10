import { CustomerStore, MechanicStore } from './store';

export const USERS = {
  user: {
    email: "disha@roadrescue.in",
    password: "disha123",
    role: "user" as const,
    name: "Disha"
  },

  mechanic: {
    email: "rajesh@roadrescue.in",
    password: "mechanic123",
    role: "mechanic" as const,
    name: "Rajesh"
  },

  admin: {
    email: "admin@roadrescue.in",
    password: "admin123",
    role: "admin" as const,
    name: "Admin"
  }
};

export const demoAuthService = {
  authenticate: async (email: string, password: string, role: 'user' | 'mechanic' | 'admin') => {
    const account = USERS[role];
    console.log("Selected Role", role);
    console.log("Entered Email", email);
    console.log("Entered Password", password);
    console.log("Expected", account);

    const isMatch = email.trim().toLowerCase() === account.email.toLowerCase() && password === account.password;
    
    console.log("Authentication Result", isMatch);

    if (isMatch) {
      const user = { name: account.name, email: account.email, role: account.role };
      // Store session details in localStorage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", account.role);
      localStorage.setItem("loggedIn", "true");
      return user;
    } else {
      throw new Error("Invalid email or password");
    }
  },

  register: async (userData: { name: string; email: string; phone?: string }) => {
    const user = {
      name: userData.name,
      email: userData.email,
      role: 'user' as const
    };
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("role", user.role);
    localStorage.setItem("loggedIn", "true");

    CustomerStore.createOrUpdate({ name: userData.name, email: userData.email, phone: userData.phone });
    return user;
  },

  registerMechanic: async (userData: { name: string; email: string; phone?: string; password?: string }) => {
    const user = {
      name: userData.name,
      email: userData.email,
      role: 'mechanic' as const
    };
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("role", user.role);
    localStorage.setItem("loggedIn", "true");

    MechanicStore.create(userData);
    return user;
  },

  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("loggedIn");
  },

  getCurrentUser: () => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    const userJson = localStorage.getItem("user");
    if (loggedIn && userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        return null;
      }
    }
    return null;
  }
};
