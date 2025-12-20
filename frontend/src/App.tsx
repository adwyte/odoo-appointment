import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./pages/Login";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import OrganiserDashboard from "./pages/dashboard/OrganiserDashboard";
import CustomerDashboard from "./pages/dashboard/CustomerDashboard";
import AppointmentBooking from './components/AppointmentBooking';

// Placeholder components for other pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="placeholder-page">
    <h2>{title}</h2>
    <p>This page is under construction.</p>
  </div>
);

function App() {
  // For demo purposes, we'll use a hardcoded role
  // In production, this would come from auth context
  const currentRole: "admin" | "organiser" | "customer" = "admin";

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Book Appointment Route */}
        <Route path="/bookAppointment" element={<AppointmentBooking />} />

        {/* Admin Dashboard Routes */}
        <Route
          path="/admin/*"
          element={<DashboardLayout role="admin" title="Admin Dashboard" />}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<PlaceholderPage title="User Management" />} />
          <Route path="providers" element={<PlaceholderPage title="Provider Management" />} />
          <Route path="appointments" element={<PlaceholderPage title="All Appointments" />} />
          <Route path="reports" element={<PlaceholderPage title="Reports & Analytics" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        </Route>

        {/* Organiser Dashboard Routes */}
        <Route
          path="/organiser/*"
          element={<DashboardLayout role="organiser" title="Organiser Dashboard" />}
        >
          <Route index element={<OrganiserDashboard />} />
          <Route path="services" element={<PlaceholderPage title="Service Management" />} />
          <Route path="bookings" element={<PlaceholderPage title="Bookings" />} />
          <Route path="availability" element={<PlaceholderPage title="Availability Settings" />} />
          <Route path="calendar" element={<PlaceholderPage title="Calendar View" />} />
          <Route path="reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        </Route>

        {/* Customer Dashboard Routes */}
        <Route
          path="/dashboard/*"
          element={<DashboardLayout role="customer" title="Home" />}
        >
          <Route index element={<CustomerDashboard />} />
          <Route path="my-bookings" element={<PlaceholderPage title="My Bookings" />} />
          <Route path="profile" element={<PlaceholderPage title="My Profile" />} />
        </Route>

        {/* Default redirect based on role */}
        <Route
          path="/"
          element={
            <Navigate
              to={
                currentRole === "admin"
                  ? "/admin"
                  : currentRole === "organiser"
                    ? "/organiser"
                    : "/dashboard"
              }
              replace
            />
          }
        />

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
