interface HeaderProps {
  title: string;
  user?: {
    name: string;
    role: string;
  };
}

export default function Header({ title, user }: HeaderProps) {
  const initial =
    user?.name && user.name.length > 0
      ? user.name.charAt(0).toUpperCase()
      : "";

  return (
    <header className="dashboard-header">
      <h1 className="header-title">{title}</h1>

      <div className="user-menu">
        <div className="user-avatar">
          {initial || <span className="opacity-50">…</span>}
        </div>

        {user && (
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
        )}
      </div>
    </header>
  );
}
