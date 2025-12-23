import { useEffect, useState } from "react";
import {
    Calendar,
    RefreshCw,
    PieChart,
    BarChart3,
    CheckCircle,
    Clock,
    Users,
} from "lucide-react";
import axios from "axios";
import { API_BASE } from "../../config";

interface AppointmentStats {
    total: number;
    pending_count: number;
    confirmed_count: number;
    cancelled_count: number;
    completed_count: number;
}

interface ServiceStats {
    id: number;
    name: string;
    booking_count: number;
}

// Donut Chart Component
const DonutChart = ({
    data,
    size = 180,
    centerLabel,
}: {
    data: { label: string; value: number; color: string }[];
    size?: number;
    centerLabel?: string;
}) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
        return (
            <div style={{ textAlign: "center", padding: "40px" }}>
                <p style={{ color: "#6b7280" }}>No data available</p>
            </div>
        );
    }

    const strokeWidth = 30;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const centerX = size / 2;
    const centerY = size / 2;

    let offset = 0;
    const segments = data.map((item) => {
        const percentage = item.value / total;
        const dashLength = circumference * percentage;
        const dashOffset = circumference - offset;
        offset += dashLength;

        return {
            ...item,
            dashArray: `${dashLength} ${circumference - dashLength}`,
            dashOffset,
            percentage: (percentage * 100).toFixed(1),
        };
    });

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ position: "relative" }}>
                <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                    {segments.map((seg, i) => (
                        <circle
                            key={i}
                            cx={centerX}
                            cy={centerY}
                            r={radius}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={seg.dashArray}
                            strokeDashoffset={seg.dashOffset}
                            style={{ transition: "stroke-dashoffset 0.5s ease", cursor: "pointer" }}
                        />
                    ))}
                </svg>
                {centerLabel && (
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            textAlign: "center",
                        }}
                    >
                        <div style={{ fontSize: "24px", fontWeight: 700 }}>{total}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>{centerLabel}</div>
                    </div>
                )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {segments.map((seg, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                            style={{
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                background: seg.color,
                            }}
                        />
                        <span style={{ fontSize: "14px" }}>
                            {seg.label}: <strong>{seg.value}</strong> ({seg.percentage}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Bar Chart Component
const BarChartComponent = ({
    data,
    height = 200,
}: {
    data: { label: string; value: number; color: string }[];
    height?: number;
}) => {
    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const barWidth = 50;
    const gap = 20;
    const width = data.length * (barWidth + gap) + gap;

    return (
        <div style={{ overflowX: "auto" }}>
            <svg width={width} height={height + 40} style={{ minWidth: "100%" }}>
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((percent, i) => (
                    <g key={i}>
                        <line
                            x1="0"
                            y1={height - (height * percent) / 100}
                            x2={width}
                            y2={height - (height * percent) / 100}
                            stroke="#e5e7eb"
                            strokeDasharray="4"
                        />
                    </g>
                ))}

                {/* Bars */}
                {data.map((item, i) => {
                    const barHeight = (item.value / maxValue) * height;
                    const x = gap + i * (barWidth + gap);
                    const y = height - barHeight;

                    return (
                        <g key={i}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                fill={item.color}
                                rx="4"
                                style={{ transition: "height 0.3s, y 0.3s", cursor: "pointer" }}
                            />
                            <text
                                x={x + barWidth / 2}
                                y={y - 5}
                                textAnchor="middle"
                                fontSize="12"
                                fontWeight="600"
                                fill="#374151"
                            >
                                {item.value}
                            </text>
                            <text
                                x={x + barWidth / 2}
                                y={height + 20}
                                textAnchor="middle"
                                fontSize="11"
                                fill="#6b7280"
                            >
                                {item.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

// Horizontal Bar Chart Component
const HorizontalBarChart = ({
    data,
}: {
    data: { label: string; value: number; color: string }[];
}) => {
    const maxValue = Math.max(...data.map((d) => d.value), 1);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data.map((item, i) => (
                <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "14px" }}>{item.label}</span>
                        <span style={{ fontWeight: 600, fontSize: "14px" }}>{item.value}</span>
                    </div>
                    <div
                        style={{
                            height: "24px",
                            background: "#f3f4f6",
                            borderRadius: "6px",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                height: "100%",
                                width: `${(item.value / maxValue) * 100}%`,
                                background: item.color,
                                borderRadius: "6px",
                                transition: "width 0.5s ease",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                paddingRight: "8px",
                            }}
                        >
                            {item.value > maxValue * 0.2 && (
                                <span style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>
                                    {((item.value / maxValue) * 100).toFixed(0)}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Gauge Chart Component
const GaugeChart = ({
    value,
    max = 100,
    title,
    color,
    size = 140,
}: {
    value: number;
    max?: number;
    title: string;
    color: string;
    size?: number;
}) => {
    const percentage = Math.min((value / max) * 100, 100);
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = Math.PI * radius;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

    return (
        <div style={{ textAlign: "center" }}>
            <h4 style={{ marginBottom: "12px", fontWeight: 600, fontSize: "14px" }}>{title}</h4>
            <div style={{ position: "relative", display: "inline-block" }}>
                <svg width={size} height={size / 2 + 20}>
                    <path
                        d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                    <path
                        d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeDasharray={strokeDasharray}
                        style={{ transition: "stroke-dasharray 0.5s ease" }}
                    />
                </svg>
                <div
                    style={{
                        position: "absolute",
                        bottom: "0",
                        left: "50%",
                        transform: "translateX(-50%)",
                    }}
                >
                    <div style={{ fontSize: "24px", fontWeight: 700, color }}>{value}%</div>
                </div>
            </div>
        </div>
    );
};

export default function OrganiserReports() {
    const [loading, setLoading] = useState(true);
    const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
    const [services, setServices] = useState<ServiceStats[]>([]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const [appointmentData, servicesData] = await Promise.all([
                axios.get(`${API_BASE}/admin/appointments`),
                axios.get(`${API_BASE}/services?published_only=false`),
            ]);

            setAppointmentStats({
                total: appointmentData.data.total,
                pending_count: appointmentData.data.pending_count,
                confirmed_count: appointmentData.data.confirmed_count,
                cancelled_count: appointmentData.data.cancelled_count,
                completed_count: appointmentData.data.completed_count,
            });

            setServices(servicesData.data || []);
        } catch (error) {
            console.error("Failed to fetch report data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, []);

    // Calculate percentages
    const getPercentage = (value: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    };

    const completionRate = appointmentStats
        ? getPercentage(appointmentStats.completed_count, appointmentStats.total)
        : 0;

    const cancellationRate = appointmentStats
        ? getPercentage(appointmentStats.cancelled_count, appointmentStats.total)
        : 0;

    const confirmationRate = appointmentStats
        ? getPercentage(appointmentStats.confirmed_count, appointmentStats.total)
        : 0;

    // Chart data
    const appointmentStatusData = [
        { label: "Pending", value: appointmentStats?.pending_count || 0, color: "#f59e0b" },
        { label: "Confirmed", value: appointmentStats?.confirmed_count || 0, color: "#10b981" },
        { label: "Completed", value: appointmentStats?.completed_count || 0, color: "#6366f1" },
        { label: "Cancelled", value: appointmentStats?.cancelled_count || 0, color: "#ef4444" },
    ];

    const serviceBookingsData = services
        .filter((s) => s.booking_count > 0)
        .map((s, i) => ({
            label: s.name.length > 20 ? s.name.substring(0, 20) + "..." : s.name,
            value: s.booking_count,
            color: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"][i % 6],
        }));

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h2>Reports & Analytics</h2>
                    <p>View insights and statistics about your appointments</p>
                </div>
                <button className="btn btn-outline" onClick={fetchReportData} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="loading-state">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    Loading report data...
                </div>
            ) : (
                <>
                    {/* Overview Cards */}
                    <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "24px" }}>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: "#dbeafe", color: "#2563eb" }}>
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{appointmentStats?.total || 0}</span>
                                <span className="stat-label">Total Appointments</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}>
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{appointmentStats?.confirmed_count || 0}</span>
                                <span className="stat-label">Confirmed</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                                <Clock className="w-6 h-6" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{appointmentStats?.pending_count || 0}</span>
                                <span className="stat-label">Pending</span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}>
                                <Users className="w-6 h-6" />
                            </div>
                            <div className="stat-info">
                                <span className="stat-value">{services.length}</span>
                                <span className="stat-label">Your Services</span>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row 1 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
                        <div className="dashboard-card">
                            <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <PieChart className="w-5 h-5" style={{ color: "#10b981" }} />
                                <h3>Appointment Status</h3>
                            </div>
                            <div className="card-body" style={{ padding: "24px" }}>
                                <DonutChart data={appointmentStatusData} size={180} centerLabel="Total" />
                            </div>
                        </div>

                        <div className="dashboard-card">
                            <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <BarChart3 className="w-5 h-5" style={{ color: "#3b82f6" }} />
                                <h3>Appointments by Status</h3>
                            </div>
                            <div className="card-body" style={{ padding: "24px" }}>
                                <BarChartComponent data={appointmentStatusData} height={180} />
                            </div>
                        </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="dashboard-card" style={{ marginBottom: "24px" }}>
                        <div className="card-header">
                            <h3>Performance Metrics</h3>
                        </div>
                        <div className="card-body" style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                            <GaugeChart value={completionRate} title="Completion" color="#10b981" />
                            <GaugeChart value={confirmationRate} title="Confirmation" color="#3b82f6" />
                            <GaugeChart value={cancellationRate} title="Cancellation" color="#ef4444" />
                        </div>
                    </div>

                    {/* Service Bookings */}
                    {serviceBookingsData.length > 0 && (
                        <div className="dashboard-card" style={{ marginBottom: "24px" }}>
                            <div className="card-header">
                                <h3>Bookings by Service</h3>
                            </div>
                            <div className="card-body" style={{ padding: "24px" }}>
                                <HorizontalBarChart data={serviceBookingsData} />
                            </div>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
                        <div className="dashboard-card">
                            <div className="card-header">
                                <h3>Appointment Summary</h3>
                            </div>
                            <div className="card-body" style={{ padding: "20px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#dcfce7", borderRadius: "8px" }}>
                                        <span>Confirmed</span>
                                        <span style={{ fontWeight: 600, color: "#16a34a" }}>{appointmentStats?.confirmed_count || 0}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#ede9fe", borderRadius: "8px" }}>
                                        <span>Completed</span>
                                        <span style={{ fontWeight: 600, color: "#7c3aed" }}>{appointmentStats?.completed_count || 0}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#fee2e2", borderRadius: "8px" }}>
                                        <span>Cancelled</span>
                                        <span style={{ fontWeight: 600, color: "#dc2626" }}>{appointmentStats?.cancelled_count || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="dashboard-card">
                            <div className="card-header">
                                <h3>Quick Stats</h3>
                            </div>
                            <div className="card-body" style={{ padding: "20px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#f9fafb", borderRadius: "8px" }}>
                                        <span>Total Appointments</span>
                                        <span style={{ fontWeight: 600 }}>{appointmentStats?.total || 0}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#f9fafb", borderRadius: "8px" }}>
                                        <span>Active Services</span>
                                        <span style={{ fontWeight: 600 }}>{services.filter((s) => s.booking_count > 0).length}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#fef3c7", borderRadius: "8px" }}>
                                        <span>Pending Actions</span>
                                        <span style={{ fontWeight: 600, color: "#f59e0b" }}>{appointmentStats?.pending_count || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
