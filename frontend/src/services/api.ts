const API_BASE_URL = "http://localhost:8000";

/* =====================
   TYPES
===================== */

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "customer" | "admin" | "organiser";
  is_active: boolean;
  is_verified?: boolean;
  created_at: string | null;
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: "customer" | "admin" | "organiser";
}

export interface UpdateUserData {
  email?: string;
  full_name?: string;
  role?: "customer" | "admin" | "organiser";
  is_active?: boolean;
  is_verified?: boolean;
}

export interface UserStats {
  total_users: number;
  total_admins?: number;
  total_organisers?: number;
  total_customers?: number;
  active_users?: number;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

/* =====================
   HELPERS
===================== */

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/* =====================
   API
===================== */

export const api = {
  /* ---------- AUTH ---------- */

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Not authenticated");
    return res.json();
  },

  async login(email: string, password: string): Promise<{ access_token: string }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Invalid credentials");
    return res.json();
  },

  /* ---------- USERS ---------- */

  async getUsers(params?: { limit?: number }): Promise<UsersResponse> {
    const query = params?.limit ? `?limit=${params.limit}` : "";
    const res = await fetch(`${API_BASE_URL}/api/users${query}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    const users = await res.json();
    return { users, total: users.length };
  },

  async createUser(data: CreateUserData): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Signup failed" }));
      throw new Error(err.detail);
    }
    return res.json();
  },

  async updateUser(id: number, data: UpdateUserData): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Update failed" }));
      throw new Error(err.detail);
    }
    return res.json();
  },

  async deleteUser(id: number, force = false): Promise<void> {
    const url = force
      ? `${API_BASE_URL}/api/users/${id}?force=true`
      : `${API_BASE_URL}/api/users/${id}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Delete failed" }));
      throw new Error(err.detail);
    }
  },

  async getUserAppointmentCount(id: number): Promise<{ appointment_count: number }> {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}/appointments/count`, {
      headers: authHeaders(),
    });
    if (!res.ok) return { appointment_count: 0 };
    return res.json();
  },

  /* ---------- STATS ---------- */

  async getUserStats(): Promise<UserStats> {
    const res = await fetch(`${API_BASE_URL}/api/stats`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
  },

  /* ---------- APPOINTMENTS ---------- */

  async getAppointments(): Promise<{
    total: number;
    pending_count: number;
    confirmed_count: number;
    cancelled_count: number;
    completed_count: number;
    appointments: unknown[];
  }> {
    const res = await fetch(`${API_BASE_URL}/api/admin/appointments`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      // Return default values if endpoint fails
      return {
        total: 0,
        pending_count: 0,
        confirmed_count: 0,
        cancelled_count: 0,
        completed_count: 0,
        appointments: [],
      };
    }
    return res.json();
  },
};
