import { Bell, Search, ChevronDown } from "lucide-react";

interface HeaderProps {
  title: string;
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
}

export default function Header({ title, user }: HeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-right">
        <div className="search-box">
          <Search className="w-4 h-4 search-icon" />
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
          />
        </div>

        <button className="notification-btn">
          <Bell className="w-5 h-5" />
          <span className="notification-badge">3</span>
        </button>

        <div className="user-menu">
          <div className="user-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <span>{user?.name?.charAt(0) || "U"}</span>
            )}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || "User"}</span>
            <span className="user-role">{user?.role || "Guest"}</span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}
