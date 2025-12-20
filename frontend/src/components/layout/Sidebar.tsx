import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  BarChart3,
  Clock,
  UserCog,
  LogOut,
  List,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

interface SidebarProps {
  role: "admin" | "organiser" | "customer";
}

const adminLinks = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/appointments", icon: Calendar, label: "Appointments" },
  { to: "/admin/reports", icon: BarChart3, label: "Reports" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

const organiserLinks = [
  { to: "/organiser", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/organiser/bookings", icon: List, label: "Bookings" },
  { to: "/organiser/availability", icon: Clock, label: "Availability" },
  { to: "/organiser/calendar", icon: Calendar, label: "Calendar" },
  { to: "/organiser/reports", icon: BarChart3, label: "Reports" },
  { to: "/organiser/settings", icon: Settings, label: "Settings" },
];

const customerLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/dashboard/my-bookings", icon: Calendar, label: "My Bookings" },
];

export default function Sidebar({ role }: SidebarProps) {
  const { logout } = useAuth();

  const links =
    role === "admin"
      ? adminLinks
      : role === "organiser"
        ? organiserLinks
        : customerLinks;

  const basePath =
    role === "admin" ? "/admin" : role === "organiser" ? "/organiser" : "/dashboard";

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Calendar className="w-8 h-8" />
          <span className="logo-text">UrbanCare</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === basePath}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout} className="nav-link logout-btn">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
