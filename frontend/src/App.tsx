import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import AdminDashboard from "./pages/dashboard/AdminDashboard";
import OrganiserDashboard from "./pages/dashboard/OrganiserDashboard";
import CustomerDashboard from "./pages/dashboard/CustomerDashboard";
import UsersPage from "./pages/dashboard/UsersPage";
import AppointmentsPage from "./pages/dashboard/AppointmentsPage";
import AppointmentBooking from "./components/AppointmentBooking";
import MyBookings from "./components/MyBookings";
import Landing from "./pages/Landing";

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-6">
    <h2 className="text-xl font-semibold">{title}</h2>
    <p className="text-gray-500">This page is under construction.</p>
  </div>
);

function getRoleFromToken() {
  const token = localStorage.getItem("access_token");
  if (!token) return null;

  try {
    return JSON.parse(atob(token.split(".")[1])).role;
  } catch {
    return null;
  }
}

function ProtectedRoute({ children, role }: any) {
  const userRole = getRoleFromToken();
  if (!userRole) return <Navigate to="/login" replace />;
  if (role && role !== userRole) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/bookAppointment" element={<AppointmentBooking />} />

        {/* Admin */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin" title="Admin Dashboard" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="providers" element={<PlaceholderPage title="Provider Management" />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="reports" element={<PlaceholderPage title="Reports & Analytics" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        </Route>

        {/* Organiser */}
        <Route
          path="/organiser/*"
          element={
            <ProtectedRoute role="organiser">
              <DashboardLayout role="organiser" title="Organiser Dashboard" />
            </ProtectedRoute>
          }
        >
          <Route index element={<OrganiserDashboard />} />
          <Route path="services" element={<PlaceholderPage title="Services" />} />
        </Route>

        {/* Customer */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute role="customer">
              <DashboardLayout role="customer" title="Home" />
            </ProtectedRoute>
          }
        >
          <Route index element={<CustomerDashboard />} />
          <Route path="book-now" element={<AppointmentBooking />} />
          <Route path="my-bookings" element={<MyBookings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
