import { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Badge from "../../components/ui/Badge";

interface Booking {
  id: number;
  service_name: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface Service {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: string | null;
  is_published: boolean;
  provider_name: string;
  booking_count: number;
}

// ---- Category logic ----
type Category =
  | "All"
  | "Medical"
  | "Massage"
  | "Fitness"
  | "Hair"
  | "Dental"
  | "Photography"
  | "Other";

const CATEGORIES: Category[] = [
  "All",
  "Medical",
  "Massage",
  "Fitness",
  "Hair",
  "Dental",
  "Photography",
  "Other",
];

const detectCategory = (serviceName: string): Category => {
  const s = serviceName.toLowerCase();

  if (s.includes("medical") || s.includes("consult")) return "Medical";
  if (s.includes("massage")) return "Massage";
  if (s.includes("fitness") || s.includes("gym") || s.includes("training")) return "Fitness";
  if (s.includes("hair") || s.includes("styling")) return "Hair";
  if (s.includes("dental") || s.includes("tooth")) return "Dental";
  if (s.includes("photo") || s.includes("photography")) return "Photography";

  return "Other";
};

const detectEmoji = (serviceName: string): string => {
  const s = serviceName.toLowerCase();
  if (s.includes("hair")) return "💇";
  if (s.includes("medical") || s.includes("consult")) return "🏥";
  if (s.includes("massage")) return "💆";
  if (s.includes("dental") || s.includes("tooth")) return "🦷";
  if (s.includes("fitness") || s.includes("gym") || s.includes("training")) return "🏋️";
  if (s.includes("photo") || s.includes("photography")) return "📸";
  if (s.includes("pedicure") || s.includes("manicure") || s.includes("spa")) return "💅";
  return "🏷️";
};

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");

  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [showEmailPrompt, setShowEmailPrompt] = useState(true);

  // Load email from localStorage and fetch services
  useEffect(() => {
    const savedEmail = localStorage.getItem("userEmail");
    if (savedEmail) {
      setUserEmail(savedEmail);
      setShowEmailPrompt(false);
      fetchUpcomingBookings(savedEmail);
    }
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const response = await axios.get<Service[]>("http://localhost:8000/api/services?published_only=true");
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchUpcomingBookings = async (email: string) => {
    try {
      const response = await axios.get<Booking[]>(`http://localhost:8000/api/bookings`, {
        params: { customer_email: email },
      });
      const now = new Date();
      const upcoming = response.data.filter((b) => new Date(b.start_time) > now);
      setUpcomingBookings(upcoming.slice(0, 3));
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

  // ✅ ONE source of truth: filtered list derived from services + search + category
  const filteredServices = useMemo(() => {
    let list = services;

    // category filter
    if (selectedCategory !== "All") {
      list = list.filter((svc) => detectCategory(svc.name) === selectedCategory);
    }

    // search filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (svc) =>
          svc.name.toLowerCase().includes(q) ||
          svc.provider_name.toLowerCase().includes(q)
      );
    }

    return list;
  }, [services, searchQuery, selectedCategory]);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // no-op: filtering happens automatically via useMemo
    }
  };

  const handleBookNow = (service: Service) => {
    navigate(
      `/dashboard/book-now?serviceId=${service.id}&serviceName=${encodeURIComponent(service.name)}`
    );
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? "s" : ""}`;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
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
          <button className="btn btn-primary" onClick={() => { /* filtering auto */ }}>
            Search
          </button>
        </div>
      </div>

      {/* Email Prompt for Upcoming Appointments */}
      {showEmailPrompt && (
        <div className="upcoming-section">
          <div className="upcoming-card" style={{ padding: "20px" }}>
            <form onSubmit={handleEmailSubmit} className="flex gap-4 items-center">
              <span className="text-sm text-gray-600">
                Enter your email to see upcoming appointments:
              </span>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="your@email.com"
                className="input"
                style={{ maxWidth: "250px", marginBottom: 0 }}
                required
              />
              <button type="submit" className="btn btn-outline">
                Load
              </button>
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
                  <Badge variant={booking.status === "confirmed" ? "success" : "warning"}>
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
            Available Services{" "}
            {(searchQuery.trim() || selectedCategory !== "All") && `(${filteredServices.length} results)`}
          </h3>

          <button className="btn btn-outline" onClick={clearFilters}>
            <Filter className="w-4 h-4" />
            Clear
          </button>
        </div>

        {/* ✅ Category chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => {
            const active = cat === selectedCategory;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full border text-sm font-medium transition
                  ${active ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-300 hover:border-black"}`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="services-grid">
          {loadingServices ? (
            <div className="p-8 text-center col-span-3 text-gray-500">
              Loading available services...
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="p-8 text-center col-span-3">
              <p className="text-gray-500">
                No services found for your filters.
              </p>
              <button className="btn btn-outline mt-4" onClick={clearFilters}>
                Reset Filters
              </button>
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service.id}
                className={`service-card ${!service.is_published ? "unavailable" : ""}`}
              >
                <div className="service-card-image">{detectEmoji(service.name)}</div>

                <div className="service-card-content">
                  <h4>{service.name}</h4>
                  <p className="provider-name">{service.provider_name}</p>

                  <div className="service-card-meta">
                    <span className="duration">
                      <Clock className="w-4 h-4" />
                      {formatDuration(service.duration_minutes)}
                    </span>
                  </div>

                  <div className="service-card-footer">
                    <span className="price">{service.price || "Contact for price"}</span>
                    <button
                      className="btn btn-primary"
                      disabled={!service.is_published}
                      onClick={() => handleBookNow(service)}
                    >
                      {service.is_published ? "Book Now" : "Unavailable"}
                    </button>
                  </div>

                  {/* Optional: show category label */}
                  <div className="mt-2 text-xs text-gray-500">
                    Category: <span className="font-semibold">{detectCategory(service.name)}</span>
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