import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./pages/Login";
import LoginCallback from "./pages/LoginCallback";
import Landing from "./pages/Landing";

import AdminDashboard from "./pages/dashboard/AdminDashboard";
import OrganiserDashboard from "./pages/dashboard/OrganiserDashboard";
import CustomerDashboard from "./pages/dashboard/CustomerDashboard";

// Placeholder components
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-6">
    <h2 className="text-xl font-semibold">{title}</h2>
    <p className="text-gray-500 mt-2">This page is under construction.</p>
  </div>
);

// Utility: get role from JWT
function getRoleFromToken(): "admin" | "organiser" | "customer" | null {
  const token = localStorage.getItem("access_token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role;
  } catch {
    return null;
  }
}

// Route guard
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: JSX.Element;
  allowedRoles: Array<"admin" | "organiser" | "customer">;
}) {
  const role = getRoleFromToken();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ---------- Public Routes ---------- */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/callback" element={<LoginCallback />} />

        {/* ---------- Admin Routes ---------- */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout role="admin" title="Admin Dashboard" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<PlaceholderPage title="User Management" />} />
          <Route path="providers" element={<PlaceholderPage title="Provider Management" />} />
          <Route path="appointments" element={<PlaceholderPage title="All Appointments" />} />
          <Route path="reports" element={<PlaceholderPage title="Reports & Analytics" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        </Route>

        {/* ---------- Organiser Routes ---------- */}
        <Route
          path="/organiser/*"
          element={
            <ProtectedRoute allowedRoles={["organiser"]}>
              <DashboardLayout role="organiser" title="Organiser Dashboard" />
            </ProtectedRoute>
          }
        >
          <Route index element={<OrganiserDashboard />} />
          <Route path="services" element={<PlaceholderPage title="Service Management" />} />
          <Route path="bookings" element={<PlaceholderPage title="Bookings" />} />
          <Route path="availability" element={<PlaceholderPage title="Availability Settings" />} />
          <Route path="calendar" element={<PlaceholderPage title="Calendar View" />} />
          <Route path="reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        </Route>

        {/* ---------- Customer Routes ---------- */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <DashboardLayout role="customer" title="Home" />
            </ProtectedRoute>
          }
        >
          <Route index element={<CustomerDashboard />} />
          <Route path="my-bookings" element={<PlaceholderPage title="My Bookings" />} />
          <Route path="profile" element={<PlaceholderPage title="My Profile" />} />
        </Route>

        {/* ---------- Catch All ---------- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
