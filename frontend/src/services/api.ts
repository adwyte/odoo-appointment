const API_BASE_URL = "http://localhost:8000";

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
}

export interface UserStats {
  total_users: number;
  total_providers?: number;
  total_appointments?: number;
  total_revenue?: number;
  active_users?: number;
  total_organisers?: number;
  total_customers?: number;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

export interface Appointment {
  id: number;
  customer_name: string;
  customer_email: string;
  service_name: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string | null;
}

export interface AppointmentsResponse {
  appointments: Appointment[];
  total: number;
  pending_count: number;
  confirmed_count: number;
  cancelled_count: number;
  completed_count: number;
}

export const api = {
  // Users
  async getUsers(params?: { limit?: number }): Promise<UsersResponse> {
    try {
      const queryParams = params?.limit ? `?limit=${params.limit}` : "";
      const response = await fetch(`${API_BASE_URL}/api/users${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const users = await response.json();
      return { users, total: users.length };
    } catch {
      // Return empty if API not available
      return { users: [], total: 0 };
    }
  },

  async getUserStats(): Promise<UserStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats`);
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      return response.json();
    } catch {
      // Return empty stats if API not available
      return {
        total_users: 0,
        active_users: 0,
        total_organisers: 0,
        total_customers: 0
      };
    }
  },

  async createUser(userData: CreateUserData): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to create user" }));
      throw new Error(error.detail || "Failed to create user");
    }
    return response.json();
  },

  async updateUser(id: number, userData: UpdateUserData): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to update user" }));
      throw new Error(error.detail || "Failed to update user");
    }
    return response.json();
  },

  async getUserAppointmentCount(id: number): Promise<{ appointment_count: number }> {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}/appointments/count`);
    if (!response.ok) {
      return { appointment_count: 0 };
    }
    return response.json();
  },

  async deleteUser(id: number, force: boolean = false): Promise<void> {
    const url = force 
      ? `${API_BASE_URL}/api/users/${id}?force=true`
      : `${API_BASE_URL}/api/users/${id}`;
    const response = await fetch(url, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to delete user" }));
      throw new Error(error.detail || "Failed to delete user");
    }
  },

  // Appointments
  async getAppointments(params?: { limit?: number; status?: string }): Promise<AppointmentsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.status) queryParams.append("status", params.status);
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const response = await fetch(`${API_BASE_URL}/api/admin/appointments${queryString}`);
      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }
      return response.json();
    } catch {
      return {
        appointments: [],
        total: 0,
        pending_count: 0,
        confirmed_count: 0,
        cancelled_count: 0,
        completed_count: 0,
      };
    }
  },
};
