import { useEffect, useState } from "react";
import {
  Calendar,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Trash2,
  X,
  ChevronDown,
} from "lucide-react";
import DataTable from "../../components/ui/DataTable";
import Badge from "../../components/ui/Badge";
import { API_BASE_URL } from "../../config";

interface Appointment {
  id: number;
  customer_name: string;
  customer_email: string;
  service_name: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string | null;
}

interface AppointmentStats {
  total: number;
  pending_count: number;
  confirmed_count: number;
  cancelled_count: number;
  completed_count: number;
}

type StatusFilter = "all" | "pending" | "confirmed" | "cancelled" | "completed";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (dateFrom) params.append("date_from", dateFrom);
      if (dateTo) params.append("date_to", dateTo);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`${API_BASE_URL}/api/admin/appointments?${params}`);
      if (!response.ok) throw new Error("Failed to fetch appointments");

      const data = await response.json();
      setAppointments(data.appointments);
      setStats({
        total: data.total,
        pending_count: data.pending_count,
        confirmed_count: data.confirmed_count,
        cancelled_count: data.cancelled_count,
        completed_count: data.completed_count,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter, dateFrom, dateTo]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAppointments();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "warning" | "error" | "default"> = {
      confirmed: "success",
      pending: "warning",
      cancelled: "error",
      completed: "default",
    };
    return variants[status] || "default";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedAppointment) return;
    setSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/appointments/${selectedAppointment.id}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!response.ok) throw new Error("Failed to update status");
      setShowStatusModal(false);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAppointment) return;
    setSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/appointments/${selectedAppointment.id}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete appointment");
      setShowDeleteModal(false);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const columns = [
    {
      key: "customer",
      header: "Customer",
      render: (apt: Appointment) => (
        <div className="customer-cell">
          <div className="customer-avatar">
            {apt.customer_name.charAt(0).toUpperCase()}
          </div>
          <div className="customer-info">
            <span className="customer-name">{apt.customer_name}</span>
            <span className="customer-email">{apt.customer_email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "service_name",
      header: "Service",
      render: (apt: Appointment) => (
        <span className="service-name">{apt.service_name}</span>
      ),
    },
    {
      key: "datetime",
      header: "Date & Time",
      render: (apt: Appointment) => {
        const { date, time } = formatDateTime(apt.start_time);
        return (
          <div className="datetime-cell">
            <span className="date">{date}</span>
            <span className="time">{time}</span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (apt: Appointment) => (
        <Badge variant={getStatusBadge(apt.status)}>
          <span className="flex items-center gap-1">
            {getStatusIcon(apt.status)}
            {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
          </span>
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (apt: Appointment) => (
        <div className="action-buttons">
          <button
            className="btn-icon"
            onClick={() => {
              setSelectedAppointment(apt);
              setShowDetailModal(true);
            }}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="btn-icon btn-icon-edit"
            onClick={() => {
              setSelectedAppointment(apt);
              setShowStatusModal(true);
            }}
            title="Change Status"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            className="btn-icon btn-icon-delete"
            onClick={() => {
              setSelectedAppointment(apt);
              setShowDeleteModal(true);
            }}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const statusTabs = [
    { key: "all", label: "All", count: stats?.total || 0 },
    { key: "pending", label: "Pending", count: stats?.pending_count || 0, color: "#f59e0b" },
    { key: "confirmed", label: "Confirmed", count: stats?.confirmed_count || 0, color: "#10b981" },
    { key: "completed", label: "Completed", count: stats?.completed_count || 0, color: "#6b7280" },
    { key: "cancelled", label: "Cancelled", count: stats?.cancelled_count || 0, color: "#ef4444" },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2>Appointments</h2>
          <p>Manage and track all appointments on your platform</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={fetchAppointments}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <p>Error: {error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Status Tabs */}
      <div className="status-tabs">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            className={`status-tab ${statusFilter === tab.key ? "active" : ""}`}
            onClick={() => setStatusFilter(tab.key as StatusFilter)}
          >
            {tab.color && (
              <span
                className="status-dot"
                style={{ backgroundColor: tab.color }}
              />
            )}
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="appointments-toolbar">
        <div className="search-box">
          <Search className="w-4 h-4 search-icon" />
          <input
            type="text"
            placeholder="Search by customer name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className={`btn btn-outline filter-btn ${showFilters ? "active" : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4" />
          Filters
          {(dateFrom || dateTo) && <span className="filter-badge">●</span>}
        </button>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Appointments Table */}
      <div className="dashboard-card">
        {loading ? (
          <div className="loading-state">
            <RefreshCw className="w-6 h-6 animate-spin" />
            Loading appointments...
          </div>
        ) : appointments.length > 0 ? (
          <DataTable columns={columns} data={appointments} />
        ) : (
          <div className="empty-state">
            <Calendar className="w-12 h-12" />
            <h3>No appointments found</h3>
            <p>
              {statusFilter !== "all"
                ? `No ${statusFilter} appointments to display.`
                : "There are no appointments yet."}
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Appointment Details</h3>
              <button className="btn-icon" onClick={() => setShowDetailModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Customer</label>
                  <p>{selectedAppointment.customer_name}</p>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <p>{selectedAppointment.customer_email}</p>
                </div>
                <div className="detail-item">
                  <label>Service</label>
                  <p>{selectedAppointment.service_name}</p>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <Badge variant={getStatusBadge(selectedAppointment.status)}>
                    {selectedAppointment.status.charAt(0).toUpperCase() +
                      selectedAppointment.status.slice(1)}
                  </Badge>
                </div>
                <div className="detail-item">
                  <label>Date</label>
                  <p>{formatDateTime(selectedAppointment.start_time).date}</p>
                </div>
                <div className="detail-item">
                  <label>Time</label>
                  <p>
                    {formatDateTime(selectedAppointment.start_time).time} -{" "}
                    {formatDateTime(selectedAppointment.end_time).time}
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowDetailModal(false);
                  setShowStatusModal(true);
                }}
              >
                Change Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Status</h3>
              <button className="btn-icon" onClick={() => setShowStatusModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <p className="mb-4">
                Update status for appointment with{" "}
                <strong>{selectedAppointment.customer_name}</strong>
              </p>
              <div className="status-options">
                {["pending", "confirmed", "completed", "cancelled"].map((status) => (
                  <button
                    key={status}
                    className={`status-option ${selectedAppointment.status === status ? "current" : ""
                      }`}
                    onClick={() => handleStatusChange(status)}
                    disabled={submitting || selectedAppointment.status === status}
                  >
                    {getStatusIcon(status)}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    {selectedAppointment.status === status && (
                      <span className="current-label">Current</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Appointment</h3>
              <button className="btn-icon" onClick={() => setShowDeleteModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <Trash2 className="w-12 h-12 text-red-500" />
                <p>
                  Are you sure you want to delete the appointment for{" "}
                  <strong>{selectedAppointment.customer_name}</strong>?
                </p>
                <p className="text-sm text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Delete Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
