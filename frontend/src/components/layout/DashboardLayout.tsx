import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
  role: "admin" | "organiser" | "customer";
  title: string;
}

export default function DashboardLayout({ role, title }: DashboardLayoutProps) {
  const user = {
    name: "John Doe",
    role: role.charAt(0).toUpperCase() + role.slice(1),
  };

  return (
    <div className="dashboard-container">
      <Sidebar role={role} />
      <div className="dashboard-main">
        <Header title={title} user={user} />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
