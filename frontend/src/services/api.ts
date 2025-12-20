const API_BASE_URL = "http://localhost:8000";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "customer" | "admin" | "organiser";
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface UserStats {
  total_users: number;
  total_providers: number;
  total_appointments: number;
  total_revenue: number;
}

export const api = {
  // Users
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/api/users`);
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    return response.json();
  },

  async getUserStats(): Promise<UserStats> {
    const response = await fetch(`${API_BASE_URL}/api/stats`);
    if (!response.ok) {
      throw new Error("Failed to fetch stats");
    }
    return response.json();
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error("Failed to create user");
    }
    return response.json();
  },

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error("Failed to update user");
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
