import { useState, useEffect } from "react";
import axios from "axios";
import {
    Calendar,
    Clock,
    ChevronLeft,
    ChevronRight,
    User,
    RefreshCw,
} from "lucide-react";
import { API_BASE } from "../../config";

interface Appointment {
    id: number;
    customer_name: string;
    customer_email: string;
    service_name: string;
    start_time: string;
    end_time: string;
    status: string;
}

export default function OrganiserCalendar() {
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/admin/appointments`, {
                params: {
                    date_from: selectedDate,
                    date_to: selectedDate,
                },
            });
            // Sort by start time
            const sorted = (response.data.appointments || []).sort(
                (a: Appointment, b: Appointment) =>
                    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
            );
            setAppointments(sorted);
        } catch (error) {
            console.error("Error fetching appointments:", error);
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [selectedDate]);

    const formatTime = (timeStr: string) => {
        return new Date(timeStr).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDisplayDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const changeDate = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split("T")[0]);
    };

    const goToToday = () => {
        setSelectedDate(new Date().toISOString().split("T")[0]);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "confirmed":
                return "bg-green-100 text-green-700 border-green-200";
            case "pending":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "cancelled":
                return "bg-red-100 text-red-700 border-red-200";
            case "completed":
                return "bg-blue-100 text-blue-700 border-blue-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const isToday = selectedDate === new Date().toISOString().split("T")[0];

    // Generate time slots for the day (9 AM to 5 PM)
    const timeSlots = [];
    for (let hour = 9; hour < 17; hour++) {
        timeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
        timeSlots.push(`${hour.toString().padStart(2, "0")}:30`);
    }

    const getAppointmentsForSlot = (slotTime: string) => {
        const slotHour = parseInt(slotTime.split(":")[0]);
        const slotMinute = parseInt(slotTime.split(":")[1]);

        return appointments.filter((apt) => {
            const aptDate = new Date(apt.start_time);
            return aptDate.getHours() === slotHour && aptDate.getMinutes() === slotMinute;
        });
    };

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h2>Calendar</h2>
                    <p>View your daily schedule and appointments</p>
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

            {/* Date Navigation */}
            <div className="card mb-6">
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={() => changeDate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900">
                                {formatDisplayDate(selectedDate)}
                            </h3>
                            {isToday && (
                                <span className="text-sm text-green-600 font-medium">Today</span>
                            )}
                        </div>
                        {!isToday && (
                            <button
                                onClick={goToToday}
                                className="px-3 py-1 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
                            >
                                Go to Today
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => changeDate(1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Date Picker */}
                <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                    />
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                    <p className="text-sm text-gray-500">Total Appointments</p>
                </div>
                <div className="card p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                        {appointments.filter((a) => a.status.toLowerCase() === "confirmed").length}
                    </p>
                    <p className="text-sm text-gray-500">Confirmed</p>
                </div>
                <div className="card p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                        {appointments.filter((a) => a.status.toLowerCase() === "pending").length}
                    </p>
                    <p className="text-sm text-gray-500">Pending</p>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="dashboard-card">
                <div className="card-header">
                    <h3 className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Day Schedule
                    </h3>
                    <span className="text-sm text-gray-500">
                        {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading schedule...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {timeSlots.map((slot) => {
                            const slotAppointments = getAppointmentsForSlot(slot);
                            const hasAppointments = slotAppointments.length > 0;

                            return (
                                <div
                                    key={slot}
                                    className={`flex ${hasAppointments ? "bg-gray-50" : ""}`}
                                >
                                    {/* Time Column */}
                                    <div className="w-20 py-4 px-3 border-r border-gray-100 flex-shrink-0">
                                        <span className="text-sm font-medium text-gray-500">
                                            {slot}
                                        </span>
                                    </div>

                                    {/* Appointments Column */}
                                    <div className="flex-1 p-2 min-h-[60px]">
                                        {slotAppointments.map((apt) => (
                                            <div
                                                key={apt.id}
                                                className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900">
                                                            {apt.service_name}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                                            <User className="w-4 h-4" />
                                                            <span>{apt.customer_name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                            <Clock className="w-3 h-3" />
                                                            <span>
                                                                {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                                                            apt.status
                                                        )}`}
                                                    >
                                                        {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!loading && appointments.length === 0 && (
                    <div className="p-8 text-center border-t border-gray-100">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No appointments scheduled for this day</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Select a different date or check back later
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
