import { Calendar, Clock, Search, Filter } from "lucide-react";
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
    available: false,
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

const upcomingBookings = [
  {
    id: 1,
    service: "Hair Styling",
    provider: "Style Studio",
    date: "Dec 22, 2025",
    time: "10:00 AM",
    status: "Confirmed",
  },
  {
    id: 2,
    service: "Medical Consultation",
    provider: "Dr. Sarah Wilson",
    date: "Dec 24, 2025",
    time: "2:30 PM",
    status: "Pending",
  },
];

export default function CustomerDashboard() {
  return (
    <div className="dashboard-page">
      {/* Hero Section */}
      <div className="customer-hero">
        <h2>Book Your Next Appointment</h2>
        <p>Find and book services from trusted providers</p>
        <div className="hero-search">
          <Search className="w-5 h-5" />
          <input type="text" placeholder="Search for services..." />
          <button className="btn btn-primary">Search</button>
        </div>
      </div>

      {/* Upcoming Appointments */}
      {upcomingBookings.length > 0 && (
        <div className="upcoming-section">
          <h3>Upcoming Appointments</h3>
          <div className="upcoming-grid">
            {upcomingBookings.map((booking) => (
              <div key={booking.id} className="upcoming-card">
                <div className="upcoming-info">
                  <span className="upcoming-service">{booking.service}</span>
                  <span className="upcoming-provider">{booking.provider}</span>
                  <div className="upcoming-datetime">
                    <Calendar className="w-4 h-4" />
                    <span>{booking.date}</span>
                    <Clock className="w-4 h-4" />
                    <span>{booking.time}</span>
                  </div>
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
      )}

      {/* Available Services */}
      <div className="services-section">
        <div className="section-header">
          <h3>Available Services</h3>
          <button className="btn btn-outline">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
        <div className="services-grid">
          {services.map((service) => (
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
                  >
                    {service.available ? "Book Now" : "Unavailable"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
