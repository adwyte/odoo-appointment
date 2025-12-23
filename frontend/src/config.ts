// Centralized API configuration
// In development: defaults to localhost:8000
// In production: set VITE_API_URL environment variable

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const API_BASE = `${API_BASE_URL}/api`;
