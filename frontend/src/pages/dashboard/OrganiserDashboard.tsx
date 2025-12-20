import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import axios from "axios";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";

interface Service {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  is_published: boolean;
  booking_count: number;
}

interface TodayBooking {
  id: number;
  time: string;
  customer: string;
  service: string;
  status: string;
}

export default function OrganiserDashboard() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch services
      const servicesResponse = await axios.get<Service[]>(
        "http://localhost:8000/api/services?published_only=false"
      );
      setServices(servicesResponse.data);

      // Fetch today's appointments
      const today = new Date().toISOString().split("T")[0];
      const appointmentsResponse = await axios.get(
        `http://localhost:8000/api/admin/appointments?date_from=${today}&date_to=${today}`
      );

      const bookings = (appointmentsResponse.data.appointments || []).map(
        (apt: any) => ({
          id: apt.id,
          time: new Date(apt.start_time).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          customer: apt.customer_name,
          service: apt.service_name,
          status: apt.status.charAt(0).toUpperCase() + apt.status.slice(1),
        })
      );
      setTodayBookings(bookings);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteService = async (id: number) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      await axios.delete(`http://localhost:8000/api/services/${id}`);
      setServices(services.filter(s => s.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to delete service");
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? "s" : ""}`;
  };

  const stats = [
    {
      title: "Today's Bookings",
      value: todayBookings.length.toString(),
      change: "Active schedule",
      changeType: "positive" as const,
      icon: Calendar,
    },
    {
      title: "Pending Confirmations",
      value: todayBookings.filter(b => b.status === "Pending").length.toString(),
      change: "Needs attention",
      changeType: "warning" as const,
      icon: Clock,
    },
    {
      title: "Total Services",
      value: services.length.toString(),
      change: `${services.filter(s => s.is_published).length} published`,
      changeType: "positive" as const,
      icon: Users,
    },
    {
      title: "Total Bookings",
      value: services.reduce((acc, s) => acc + s.booking_count, 0).toString(),
      change: "All time",
      changeType: "positive" as const,
      icon: DollarSign,
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2>Welcome back, Organiser</h2>
          <p>Manage your appointments and services efficiently.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/organiser/services/create")}
        >
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
            <span className="date-badge">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
            <button className="btn btn-outline" onClick={fetchData}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
          <div className="services-list">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading services...</div>
            ) : services.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No services yet.</p>
                <button
                  className="btn btn-primary mt-2"
                  onClick={() => navigate("/organiser/services/create")}
                >
                  Create Your First Service
                </button>
              </div>
            ) : (
              services.map((service) => (
                <div key={service.id} className="service-item">
                  <div className="service-info">
                    <span className="service-name">{service.name}</span>
                    <div className="service-meta">
                      <span>{formatDuration(service.duration_minutes)}</span>
                      <span>•</span>
                      <span>{service.booking_count} bookings</span>
                    </div>
                  </div>
                  <div className="service-actions">
                    <Badge
                      variant={service.is_published ? "success" : "default"}
                    >
                      {service.is_published ? "Published" : "Draft"}
                    </Badge>
                    <div className="action-buttons">
                      <button className="icon-btn" title="Preview">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="icon-btn" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="icon-btn danger"
                        title="Delete"
                        onClick={() => handleDeleteService(service.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-card" onClick={() => navigate("/organiser/calendar")}>
            <Calendar className="w-6 h-6" />
            <span>View Calendar</span>
          </button>
          <button className="action-card" onClick={() => navigate("/organiser/bookings")}>
            <Clock className="w-6 h-6" />
            <span>Manage Bookings</span>
          </button>
          <button className="action-card">
            <Users className="w-6 h-6" />
            <span>Manage Resources</span>
          </button>
          <button
            className="action-card"
            onClick={() => navigate("/organiser/services/create")}
          >
            <Plus className="w-6 h-6" />
            <span>Create Service</span>
          </button>
        </div>
      </div>
    </div>
  );
}
