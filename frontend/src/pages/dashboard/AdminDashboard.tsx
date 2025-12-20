import { useEffect, useState } from "react";
import { Users, Calendar, UserCog, TrendingUp, RefreshCw } from "lucide-react";
import StatCard from "../../components/ui/StatCard";
import DataTable from "../../components/ui/DataTable";
import Badge from "../../components/ui/Badge";
import { api, User, UserStats } from "../../services/api";

interface DisplayUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
}

const recentAppointments = [
  {
    id: 1,
    customer: "Alice Johnson",
    service: "Hair Styling",
    provider: "Style Studio",
    date: "Dec 20, 2025",
    time: "10:00 AM",
    status: "Confirmed",
  },
  {
    id: 2,
    customer: "Bob Smith",
    service: "Consultation",
    provider: "Dr. Sarah",
    date: "Dec 20, 2025",
    time: "11:30 AM",
    status: "Pending",
  },
  {
    id: 3,
    customer: "Carol White",
    service: "Massage Therapy",
    provider: "Wellness Center",
    date: "Dec 20, 2025",
    time: "2:00 PM",
    status: "Confirmed",
  },
  {
    id: 4,
    customer: "David Brown",
    service: "Dental Checkup",
    provider: "Dr. Mike",
    date: "Dec 21, 2025",
    time: "9:00 AM",
    status: "Cancelled",
  },
];

const appointmentColumns = [
  { key: "customer", header: "Customer" },
  { key: "service", header: "Service" },
  { key: "provider", header: "Provider" },
  { key: "date", header: "Date" },
  { key: "time", header: "Time" },
  {
    key: "status",
    header: "Status",
    render: (apt: (typeof recentAppointments)[0]) => (
      <Badge
        variant={
          apt.status === "Confirmed"
            ? "success"
            : apt.status === "Pending"
            ? "warning"
            : "error"
        }
      >
        {apt.status}
      </Badge>
    ),
  },
];

export default function AdminDashboard() {
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const transformUser = (user: User): DisplayUser => ({
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
    status: user.is_active ? "Active" : "Inactive",
    joinedAt: formatDate(user.created_at),
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersResponse, statsResponse] = await Promise.all([
        api.getUsers({ limit: 5 }),
        api.getUserStats(),
      ]);
      setUsers(usersResponse.users.map(transformUser));
      setStats(statsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const userColumns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    {
      key: "status",
      header: "Status",
      render: (user: DisplayUser) => (
        <Badge variant={user.status === "Active" ? "success" : "warning"}>
          {user.status}
        </Badge>
      ),
    },
    { key: "joinedAt", header: "Joined" },
  ];

  const statsData = [
    {
      title: "Total Users",
      value: stats?.total_users?.toString() || "0",
      change: `${stats?.active_users || 0} active`,
      changeType: "positive" as const,
      icon: Users,
    },
    {
      title: "Service Providers",
      value: stats?.total_organisers?.toString() || "0",
      change: "Organisers",
      changeType: "positive" as const,
      icon: UserCog,
    },
    {
      title: "Total Appointments",
      value: "0",
      change: "Coming soon",
      changeType: "neutral" as const,
      icon: Calendar,
    },
    {
      title: "Customers",
      value: stats?.total_customers?.toString() || "0",
      change: "Registered customers",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2>Welcome back, Admin</h2>
          <p>Here's what's happening with your platform today.</p>
        </div>
        <button className="btn btn-outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <p>Error: {error}</p>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      <div className="stats-grid">
        {statsData.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Users</h3>
            <button className="btn btn-outline">View All</button>
          </div>
          {loading ? (
            <div className="loading-state">Loading users...</div>
          ) : users.length > 0 ? (
            <DataTable columns={userColumns} data={users} />
          ) : (
            <div className="empty-state">No users found</div>
          )}
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Appointments</h3>
            <button className="btn btn-outline">View All</button>
          </div>
          <DataTable columns={appointmentColumns} data={recentAppointments} />
        </div>
      </div>
    </div>
  );
}
