import { Users, Calendar, UserCog, TrendingUp } from "lucide-react";
import StatCard from "../../components/ui/StatCard";
import DataTable from "../../components/ui/DataTable";
import Badge from "../../components/ui/Badge";

const stats = [
  {
    title: "Total Users",
    value: "2,847",
    change: "+12.5% from last month",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Service Providers",
    value: "156",
    change: "+3.2% from last month",
    changeType: "positive" as const,
    icon: UserCog,
  },
  {
    title: "Total Appointments",
    value: "12,584",
    change: "+18.7% from last month",
    changeType: "positive" as const,
    icon: Calendar,
  },
  {
    title: "Revenue",
    value: "$45,230",
    change: "+8.1% from last month",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
];

const recentUsers = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "Customer",
    status: "Active",
    joinedAt: "Dec 19, 2025",
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    role: "Organiser",
    status: "Active",
    joinedAt: "Dec 18, 2025",
  },
  {
    id: 3,
    name: "Carol White",
    email: "carol@example.com",
    role: "Customer",
    status: "Pending",
    joinedAt: "Dec 18, 2025",
  },
  {
    id: 4,
    name: "David Brown",
    email: "david@example.com",
    role: "Customer",
    status: "Active",
    joinedAt: "Dec 17, 2025",
  },
  {
    id: 5,
    name: "Emma Davis",
    email: "emma@example.com",
    role: "Organiser",
    status: "Active",
    joinedAt: "Dec 17, 2025",
  },
];

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

const userColumns = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "role", header: "Role" },
  {
    key: "status",
    header: "Status",
    render: (user: (typeof recentUsers)[0]) => (
      <Badge variant={user.status === "Active" ? "success" : "warning"}>
        {user.status}
      </Badge>
    ),
  },
  { key: "joinedAt", header: "Joined" },
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
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h2>Welcome back, Admin</h2>
        <p>Here's what's happening with your platform today.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Users</h3>
            <button className="btn btn-outline">View All</button>
          </div>
          <DataTable columns={userColumns} data={recentUsers} />
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
