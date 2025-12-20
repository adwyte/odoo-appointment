import { useState, useEffect } from "react";
import { Calendar, Clock, Search, Filter, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Badge from "../../components/ui/Badge";

// Helper to get emoji icon based on service name
const getServiceIcon = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("hair")) return "💇";
  if (lowerName.includes("consult") || lowerName.includes("medical")) return "🏥";
  if (lowerName.includes("massage")) return "💆";
  if (lowerName.includes("dental")) return "🦷";
  if (lowerName.includes("fitness") || lowerName.includes("gym")) return "🏋️";
  if (lowerName.includes("photo")) return "📸";
  if (lowerName.includes("travel") || lowerName.includes("cab")) return "🚗";
  if (lowerName.includes("clean")) return "🧹";
  return "📅";
};

// Helper to format duration
const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? "s" : ""}`;
};

interface Service {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  is_published: boolean;
  booking_count: number;
}

interface Booking {
  id: number;
  service_name: string;
  start_time: string;
  end_time: string;
  status: string;
}

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [showEmailPrompt, setShowEmailPrompt] = useState(true);

  // Fetch services from API
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const response = await axios.get<Service[]>(
        "http://localhost:8000/api/services?published_only=true"
      );
      setServices(response.data);
      setFilteredServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
      setFilteredServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  // Load email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem("userEmail");
    if (savedEmail) {
      setUserEmail(savedEmail);
      setShowEmailPrompt(false);
      fetchUpcomingBookings(savedEmail);
    }
  }, []);

  const fetchUpcomingBookings = async (email: string) => {
    try {
      const response = await axios.get<Booking[]>(`http://localhost:8000/api/bookings`, {
        params: { customer_email: email }
      });
      // Filter for future bookings only
      const now = new Date();
      const upcoming = response.data.filter(b => new Date(b.start_time) > now);
      setUpcomingBookings(upcoming.slice(0, 3)); // Show max 3
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userEmail) {
      localStorage.setItem("userEmail", userEmail);
      setShowEmailPrompt(false);
      fetchUpcomingBookings(userEmail);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredServices(services);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = services.filter(
      s => s.name.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query))
    );
    setFilteredServices(filtered);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleBookNow = (service: Service) => {
    navigate(`/dashboard/book-now?serviceId=${service.id}&serviceName=${encodeURIComponent(service.name)}`);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="dashboard-page">
      {/* Hero Section */}
      <div className="customer-hero">
        <h2>Book Your Next Appointment</h2>
        <p>Find and book services from trusted providers</p>
        <div className="hero-search">
          <Search className="w-5 h-5" />
          <input
            type="text"
            placeholder="Search for services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
          />
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
        </div>
      </div>

      {/* Email Prompt for Upcoming Appointments */}
      {showEmailPrompt && (
        <div className="upcoming-section">
          <div className="upcoming-card" style={{ padding: '20px' }}>
            <form onSubmit={handleEmailSubmit} className="flex gap-4 items-center">
              <span className="text-sm text-gray-600">Enter your email to see upcoming appointments:</span>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your@email.com"
                className="input"
                style={{ maxWidth: '250px', marginBottom: 0 }}
                required
              />
              <button type="submit" className="btn btn-outline">Load</button>
            </form>
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      {!showEmailPrompt && upcomingBookings.length > 0 && (
        <div className="upcoming-section">
          <h3>Upcoming Appointments</h3>
          <div className="upcoming-grid">
            {upcomingBookings.map((booking) => {
              const { date, time } = formatDateTime(booking.start_time);
              return (
                <div key={booking.id} className="upcoming-card">
                  <div className="upcoming-info">
                    <span className="upcoming-service">{booking.service_name}</span>
                    <div className="upcoming-datetime">
                      <Calendar className="w-4 h-4" />
                      <span>{date}</span>
                      <Clock className="w-4 h-4" />
                      <span>{time}</span>
                    </div>
                  </div>
                  <Badge
                    variant={booking.status === "confirmed" ? "success" : "warning"}
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Services */}
      <div className="services-section">
        <div className="section-header">
          <h3>
            Available Services
            {searchQuery && ` (${filteredServices.length} results)`}
          </h3>
          <div className="flex gap-2">
            <button
              className="btn btn-outline"
              onClick={() => { setSearchQuery(""); setFilteredServices(services); }}
            >
              <Filter className="w-4 h-4" />
              {searchQuery ? "Clear" : "Filter"}
            </button>
            <button className="btn btn-outline" onClick={fetchServices} title="Refresh services">
              <RefreshCw className={`w-4 h-4 ${loadingServices ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <div className="services-grid">
          {loadingServices ? (
            <div className="p-8 text-center col-span-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading services...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="p-8 text-center col-span-3">
              <p className="text-gray-500">
                {searchQuery
                  ? `No services found matching "${searchQuery}"`
                  : "No services available yet. Check back soon!"}
              </p>
            </div>
          ) : (
            filteredServices.map((service) => (
              <div key={service.id} className="service-card">
                <div className="service-card-image">{getServiceIcon(service.name)}</div>
                <div className="service-card-content">
                  <h4>{service.name}</h4>
                  <p className="provider-name">
                    {service.description || "Professional service"}
                  </p>
                  <div className="service-card-meta">
                    <span className="duration">
                      <Clock className="w-4 h-4" />
                      {formatDuration(service.duration_minutes)}
                    </span>
                    <span className="rating">⭐ 4.8</span>
                    <span className="reviews">({service.booking_count})</span>
                  </div>
                  <div className="service-card-footer">
                    <span className="price">Book Now</span>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleBookNow(service)}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
