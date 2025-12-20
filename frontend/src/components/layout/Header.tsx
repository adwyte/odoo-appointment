import { ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

interface HeaderProps {
  title: string;
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
}

export default function Header({ title, user }: HeaderProps) {
  const { logout } = useAuth();

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-right">
        {/* Search and Notifications removed per user request */}

        {/* USER MENU */}
        <div className="user-menu">
          <div className="user-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <span>{user?.name?.charAt(0)}</span>
            )}
          </div>

          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role}</span>
          </div>

          <button
            onClick={logout}
            className="ml-3 hover:text-red-600"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <ChevronDown className="w-4 h-4 ml-2" />
        </div>
      </div>
    </header>
  );
}
