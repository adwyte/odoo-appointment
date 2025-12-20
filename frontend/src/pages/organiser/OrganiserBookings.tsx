import { useState, useEffect } from "react";
import axios from "axios";
import {
    Calendar,
    Clock,
    User,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertCircle,
    Check,
    X,
} from "lucide-react";

const API_BASE = "http://localhost:8000/api";

interface Appointment {
    id: number;
    customer_name: string;
    customer_email: string;
    service_name: string;
    start_time: string;
    end_time: string;
    status: string;
}

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
    pending: { color: "#f59e0b", bg: "#fef3c7", icon: AlertCircle },
    confirmed: { color: "#10b981", bg: "#dcfce7", icon: CheckCircle },
    completed: { color: "#6366f1", bg: "#ede9fe", icon: Check },
    cancelled: { color: "#ef4444", bg: "#fee2e2", icon: XCircle },
};

export default function OrganiserBookings() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/admin/appointments`);
            const sorted = (response.data.appointments || []).sort(
                (a: Appointment, b: Appointment) =>
                    new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
            );
            setAppointments(sorted);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const updateStatus = async (id: number, newStatus: string) => {
        setUpdatingId(id);
        try {
            await axios.put(`${API_BASE}/admin/appointments/${id}/status`, {
                status: newStatus,
            });
            setAppointments((prev) =>
                prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
            );
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const filteredAppointments =
        filter === "all"
            ? appointments
            : appointments.filter((apt) => apt.status === filter);

    const counts = {
        all: appointments.length,
        pending: appointments.filter((a) => a.status === "pending").length,
        confirmed: appointments.filter((a) => a.status === "confirmed").length,
        completed: appointments.filter((a) => a.status === "completed").length,
        cancelled: appointments.filter((a) => a.status === "cancelled").length,
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h2>Manage Bookings</h2>
                    <p>View and manage appointment statuses</p>
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

            {/* Filter Tabs */}
            <div
                style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "24px",
                    flexWrap: "wrap",
                }}
            >
                {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map(
                    (status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "8px",
                                border: filter === status ? "2px solid #000" : "1px solid #e5e7eb",
                                background: filter === status ? "#f9fafb" : "#fff",
                                cursor: "pointer",
                                fontWeight: filter === status ? 600 : 400,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                            <span
                                style={{
                                    background:
                                        status === "all"
                                            ? "#e5e7eb"
                                            : statusConfig[status]?.bg || "#e5e7eb",
                                    color:
                                        status === "all"
                                            ? "#374151"
                                            : statusConfig[status]?.color || "#374151",
                                    padding: "2px 8px",
                                    borderRadius: "9999px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                }}
                            >
                                {counts[status]}
                            </span>
                        </button>
                    )
                )}
            </div>

            {/* Appointments List */}
            {loading ? (
                <div className="loading-state">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    Loading appointments...
                </div>
            ) : filteredAppointments.length === 0 ? (
                <div className="dashboard-card">
                    <div className="card-body" style={{ padding: "48px", textAlign: "center" }}>
                        <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: "#9ca3af" }} />
                        <p style={{ color: "#6b7280" }}>No appointments found</p>
                    </div>
                </div>
            ) : (
                <div className="dashboard-card">
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>
                                        Customer
                                    </th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>
                                        Service
                                    </th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>
                                        Date & Time
                                    </th>
                                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>
                                        Status
                                    </th>
                                    <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600 }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.map((apt) => {
                                    const config = statusConfig[apt.status] || statusConfig.pending;
                                    const StatusIcon = config.icon;
                                    const isPast = new Date(apt.end_time) < new Date();

                                    return (
                                        <tr
                                            key={apt.id}
                                            style={{
                                                borderBottom: "1px solid #f3f4f6",
                                                background: updatingId === apt.id ? "#f9fafb" : "#fff",
                                            }}
                                        >
                                            <td style={{ padding: "16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <div
                                                        style={{
                                                            width: "40px",
                                                            height: "40px",
                                                            borderRadius: "50%",
                                                            background: "#e5e7eb",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <User className="w-5 h-5" style={{ color: "#6b7280" }} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>{apt.customer_name}</div>
                                                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                                                            {apt.customer_email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "16px" }}>
                                                <span style={{ fontWeight: 500 }}>{apt.service_name}</span>
                                            </td>
                                            <td style={{ padding: "16px" }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <Calendar className="w-4 h-4" style={{ color: "#6b7280" }} />
                                                        <span>{formatDate(apt.start_time)}</span>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <Clock className="w-4 h-4" style={{ color: "#6b7280" }} />
                                                        <span style={{ fontSize: "14px", color: "#6b7280" }}>
                                                            {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: "16px" }}>
                                                <span
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        padding: "6px 12px",
                                                        borderRadius: "9999px",
                                                        background: config.bg,
                                                        color: config.color,
                                                        fontWeight: 500,
                                                        fontSize: "13px",
                                                    }}
                                                >
                                                    <StatusIcon className="w-4 h-4" />
                                                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                                </span>
                                            </td>
                                            <td style={{ padding: "16px" }}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        gap: "8px",
                                                    }}
                                                >
                                                    {updatingId === apt.id ? (
                                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <>
                                                            {apt.status === "pending" && (
                                                                <>
                                                                    <button
                                                                        onClick={() => updateStatus(apt.id, "confirmed")}
                                                                        title="Confirm"
                                                                        style={{
                                                                            padding: "8px",
                                                                            borderRadius: "8px",
                                                                            border: "none",
                                                                            background: "#dcfce7",
                                                                            color: "#16a34a",
                                                                            cursor: "pointer",
                                                                        }}
                                                                    >
                                                                        <CheckCircle className="w-5 h-5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => updateStatus(apt.id, "cancelled")}
                                                                        title="Cancel"
                                                                        style={{
                                                                            padding: "8px",
                                                                            borderRadius: "8px",
                                                                            border: "none",
                                                                            background: "#fee2e2",
                                                                            color: "#dc2626",
                                                                            cursor: "pointer",
                                                                        }}
                                                                    >
                                                                        <XCircle className="w-5 h-5" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {apt.status === "confirmed" && (
                                                                <>
                                                                    <button
                                                                        onClick={() => updateStatus(apt.id, "completed")}
                                                                        title="Mark Complete"
                                                                        style={{
                                                                            padding: "8px",
                                                                            borderRadius: "8px",
                                                                            border: "none",
                                                                            background: "#ede9fe",
                                                                            color: "#7c3aed",
                                                                            cursor: "pointer",
                                                                        }}
                                                                    >
                                                                        <Check className="w-5 h-5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => updateStatus(apt.id, "cancelled")}
                                                                        title="Cancel"
                                                                        style={{
                                                                            padding: "8px",
                                                                            borderRadius: "8px",
                                                                            border: "none",
                                                                            background: "#fee2e2",
                                                                            color: "#dc2626",
                                                                            cursor: "pointer",
                                                                        }}
                                                                    >
                                                                        <X className="w-5 h-5" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {(apt.status === "completed" || apt.status === "cancelled") && (
                                                                <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                                                                    {isPast ? "Past" : "Final"}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Status Flow Info */}
            <div
                className="card"
                style={{
                    marginTop: "24px",
                    padding: "16px",
                    background: "#f0f9ff",
                    border: "1px solid #bae6fd",
                }}
            >
                <h4 style={{ fontWeight: 600, marginBottom: "8px", color: "#0369a1" }}>
                    Status Flow
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <span
                        style={{
                            padding: "4px 12px",
                            borderRadius: "9999px",
                            background: "#fef3c7",
                            color: "#f59e0b",
                            fontSize: "13px",
                        }}
                    >
                        Pending
                    </span>
                    <span style={{ color: "#6b7280" }}>→</span>
                    <span
                        style={{
                            padding: "4px 12px",
                            borderRadius: "9999px",
                            background: "#dcfce7",
                            color: "#10b981",
                            fontSize: "13px",
                        }}
                    >
                        Confirmed
                    </span>
                    <span style={{ color: "#6b7280" }}>→</span>
                    <span
                        style={{
                            padding: "4px 12px",
                            borderRadius: "9999px",
                            background: "#ede9fe",
                            color: "#6366f1",
                            fontSize: "13px",
                        }}
                    >
                        Completed
                    </span>
                    <span style={{ color: "#6b7280", marginLeft: "12px" }}>or</span>
                    <span
                        style={{
                            padding: "4px 12px",
                            borderRadius: "9999px",
                            background: "#fee2e2",
                            color: "#ef4444",
                            fontSize: "13px",
                        }}
                    >
                        Cancelled
                    </span>
                </div>
            </div>
        </div>
    );
}
