import { useState, useEffect } from "react";
import { Calendar, Clock, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Badge from "../../components/ui/Badge";

const services = [
  {
    id: 1,
    name: "Hair Styling",
    provider: "Style Studio",
    duration: "1 hour",
    price: "$45",
    rating: 4.8,
    reviews: 124,
    image: "💇",
    available: true,
  },
  {
    id: 2,
    name: "Medical Consultation",
    provider: "Dr. Sarah Wilson",
    duration: "30 min",
    price: "$80",
    rating: 4.9,
    reviews: 89,
    image: "🏥",
    available: true,
  },
  {
    id: 3,
    name: "Massage Therapy",
    provider: "Wellness Center",
    duration: "1.5 hours",
    price: "$95",
    rating: 4.7,
    reviews: 203,
    image: "💆",
    available: true,
  },
  {
    id: 4,
    name: "Dental Checkup",
    provider: "Dr. Mike Chen",
    duration: "45 min",
    price: "$120",
    rating: 4.6,
    reviews: 67,
    image: "🦷",
    available: true,
  },
  {
    id: 5,
    name: "Fitness Training",
    provider: "FitLife Gym",
    duration: "1 hour",
    price: "$35",
    rating: 4.8,
    reviews: 156,
    image: "🏋️",
    available: true,
  },
  {
    id: 6,
    name: "Photography Session",
    provider: "Capture Studios",
    duration: "2 hours",
    price: "$150",
    rating: 4.9,
    reviews: 78,
    image: "📸",
    available: true,
  },
];

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
  const [filteredServices, setFilteredServices] = useState(services);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [showEmailPrompt, setShowEmailPrompt] = useState(true);

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
        s.provider.toLowerCase().includes(query)
    );
    setFilteredServices(filtered);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleBookNow = (service: typeof services[0]) => {
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
          <h3>Available Services {searchQuery && `(${filteredServices.length} results)`}</h3>
          <button className="btn btn-outline" onClick={() => { setSearchQuery(""); setFilteredServices(services); }}>
            <Filter className="w-4 h-4" />
            {searchQuery ? "Clear" : "Filter"}
          </button>
        </div>
        <div className="services-grid">
          {filteredServices.length === 0 ? (
            <div className="p-8 text-center col-span-3">
              <p className="text-gray-500">No services found matching "{searchQuery}"</p>
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service.id}
                className={`service-card ${!service.available ? "unavailable" : ""}`}
              >
                <div className="service-card-image">{service.image}</div>
                <div className="service-card-content">
                  <h4>{service.name}</h4>
                  <p className="provider-name">{service.provider}</p>
                  <div className="service-card-meta">
                    <span className="duration">
                      <Clock className="w-4 h-4" />
                      {service.duration}
                    </span>
                    <span className="rating">⭐ {service.rating}</span>
                    <span className="reviews">({service.reviews})</span>
                  </div>
                  <div className="service-card-footer">
                    <span className="price">{service.price}</span>
                    <button
                      className="btn btn-primary"
                      disabled={!service.available}
                      onClick={() => handleBookNow(service)}
                    >
                      {service.available ? "Book Now" : "Unavailable"}
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
