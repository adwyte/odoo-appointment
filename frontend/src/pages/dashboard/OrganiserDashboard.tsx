import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  Plus,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";

const stats = [
  {
    title: "Today's Bookings",
    value: "24",
    change: "+4 from yesterday",
    changeType: "positive" as const,
    icon: Calendar,
  },
  {
    title: "Pending Confirmations",
    value: "8",
    change: "Needs attention",
    changeType: "warning" as const,
    icon: Clock,
  },
  {
    title: "Total Customers",
    value: "1,247",
    change: "+23 this week",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "This Month Revenue",
    value: "$8,420",
    change: "+12.3% from last month",
    changeType: "positive" as const,
    icon: DollarSign,
  },
];

const services = [
  {
    id: 1,
    name: "Initial Consultation",
    duration: "30 min",
    price: "$50",
    bookings: 145,
    status: "Published",
  },
  {
    id: 2,
    name: "Follow-up Session",
    duration: "45 min",
    price: "$75",
    bookings: 89,
    status: "Published",
  },
  {
    id: 3,
    name: "Extended Consultation",
    duration: "1 hour",
    price: "$120",
    bookings: 56,
    status: "Published",
  },
  {
    id: 4,
    name: "Group Session",
    duration: "2 hours",
    price: "$200",
    bookings: 23,
    status: "Draft",
  },
];

const todayBookings = [
  {
    id: 1,
    time: "09:00 AM",
    customer: "Sarah Miller",
    service: "Initial Consultation",
    status: "Confirmed",
  },
  {
    id: 2,
    time: "10:00 AM",
    customer: "James Wilson",
    service: "Follow-up Session",
    status: "Confirmed",
  },
  {
    id: 3,
    time: "11:30 AM",
    customer: "Emily Chen",
    service: "Extended Consultation",
    status: "Pending",
  },
  {
    id: 4,
    time: "02:00 PM",
    customer: "Michael Lee",
    service: "Initial Consultation",
    status: "Confirmed",
  },
  {
    id: 5,
    time: "03:30 PM",
    customer: "Jessica Brown",
    service: "Follow-up Session",
    status: "Pending",
  },
];

export default function OrganiserDashboard() {
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2>Welcome back, Dr. John</h2>
          <p>Manage your appointments and services efficiently.</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4" />
          New Service
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="dashboard-grid-2">
        {/* Today's Schedule */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Today's Schedule</h3>
            <span className="date-badge">Dec 20, 2025</span>
          </div>
          <div className="schedule-list">
            {todayBookings.map((booking) => (
              <div key={booking.id} className="schedule-item">
                <div className="schedule-time">{booking.time}</div>
                <div className="schedule-details">
                  <span className="schedule-customer">{booking.customer}</span>
                  <span className="schedule-service">{booking.service}</span>
                </div>
                <Badge
                  variant={booking.status === "Confirmed" ? "success" : "warning"}
                >
                  {booking.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Services Overview */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Your Services</h3>
            <button className="btn btn-outline">Manage</button>
          </div>
          <div className="services-list">
            {services.map((service) => (
              <div key={service.id} className="service-item">
                <div className="service-info">
                  <span className="service-name">{service.name}</span>
                  <div className="service-meta">
                    <span>{service.duration}</span>
                    <span>•</span>
                    <span>{service.price}</span>
                    <span>•</span>
                    <span>{service.bookings} bookings</span>
                  </div>
                </div>
                <div className="service-actions">
                  <Badge
                    variant={service.status === "Published" ? "success" : "default"}
                  >
                    {service.status}
                  </Badge>
                  <div className="action-buttons">
                    <button className="icon-btn" title="Preview">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="icon-btn" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="icon-btn danger" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-card">
            <Calendar className="w-6 h-6" />
            <span>View Calendar</span>
          </button>
          <button className="action-card">
            <Clock className="w-6 h-6" />
            <span>Set Availability</span>
          </button>
          <button className="action-card">
            <Users className="w-6 h-6" />
            <span>Manage Resources</span>
          </button>
          <button className="action-card">
            <Plus className="w-6 h-6" />
            <span>Create Service</span>
          </button>
        </div>
      </div>
    </div>
  );
}
