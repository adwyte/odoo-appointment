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

  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete user");
    }
  },
};
