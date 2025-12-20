import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Landing from "./pages/Landing";
import LoginCallback from "./pages/LoginCallback";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import OrganiserDashboard from "./pages/dashboard/OrganiserDashboard";
import CustomerDashboard from "./pages/dashboard/CustomerDashboard";
import PaymentPage from "./pages/dashboard/PaymentPage";
import ReceiptPage from "./pages/dashboard/ReceiptPage";
import UsersPage from "./pages/dashboard/UsersPage";
import AppointmentsPage from "./pages/dashboard/AppointmentsPage";
import ReportsPage from "./pages/dashboard/ReportsPage";

import AppointmentBooking from "./components/AppointmentBooking";
import MyBookings from "./components/MyBookings";
import CreateService from "./pages/organiser/CreateService";
import OrganiserCalendar from "./pages/organiser/OrganiserCalendar";
import AvailabilitySettings from "./pages/organiser/AvailabilitySettings";

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
        <Route path="/login/callback" element={<LoginCallback />} />
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
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
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
          <Route path="services" element={<PlaceholderPage title="Service Management" />} />
          <Route path="services/create" element={<CreateService />} />
          <Route path="bookings" element={<PlaceholderPage title="Bookings" />} />
          <Route path="availability" element={<AvailabilitySettings />} />
          <Route path="calendar" element={<OrganiserCalendar />} />
          <Route path="reports" element={<PlaceholderPage title="Reports" />} />
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
          <Route path="payment" element={<PaymentPage />} />
          <Route path="payment/receipt/:paymentId" element={<ReceiptPage />} />
          <Route path="profile" element={<PlaceholderPage title="My Profile" />} />
        </Route>

        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
