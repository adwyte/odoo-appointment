import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../../hooks/useAuth";

interface DashboardLayoutProps {
  role: "admin" | "organiser" | "customer";
  title: string;
}

export default function DashboardLayout({ role, title }: DashboardLayoutProps) {
  const { user, loading } = useAuth();

  // 🚫 Do not render layout until auth is resolved
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar role={role} />

      <div className="dashboard-main">
        {/* ✅ Header only renders once user is known */}
        <Header
          title={title}
          user={
            user
              ? {
                  name: user.full_name,
                  role:
                    user.role.charAt(0).toUpperCase() +
                    user.role.slice(1),
                }
              : undefined
          }
        />

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
