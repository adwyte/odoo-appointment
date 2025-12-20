import { useState, useEffect } from "react";
import axios from "axios";
import { Clock, Save, RefreshCw, Check } from "lucide-react";

interface DaySchedule {
    id?: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_unavailable: boolean;
    enabled: boolean;
}

const API_BASE = "http://localhost:8000/api";

const DAYS = [
    { value: 0, label: "Monday" },
    { value: 1, label: "Tuesday" },
    { value: 2, label: "Wednesday" },
    { value: 3, label: "Thursday" },
    { value: 4, label: "Friday" },
    { value: 5, label: "Saturday" },
    { value: 6, label: "Sunday" },
];

const DEFAULT_START = "09:00";
const DEFAULT_END = "17:00";

function getUserIdFromToken(): number | null {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split(".")[1])).user_id;
    } catch {
        return null;
    }
}

export default function AvailabilitySettings() {
    const [schedules, setSchedules] = useState<DaySchedule[]>(
        DAYS.map((day) => ({
            day_of_week: day.value,
            start_time: DEFAULT_START,
            end_time: DEFAULT_END,
            is_unavailable: false,
            enabled: day.value < 5, // Mon-Fri enabled by default
        }))
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const userId = getUserIdFromToken();

    const fetchSchedules = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/schedules`, {
                params: { user_id: userId },
            });

            // Merge fetched data with default structure
            const fetchedData = response.data as any[];
            setSchedules(
                DAYS.map((day) => {
                    const existing = fetchedData.find(
                        (s) => s.day_of_week === day.value
                    );
                    if (existing) {
                        return {
                            id: existing.id,
                            day_of_week: existing.day_of_week,
                            start_time: existing.start_time,
                            end_time: existing.end_time,
                            is_unavailable: existing.is_unavailable,
                            enabled: !existing.is_unavailable,
                        };
                    }
                    return {
                        day_of_week: day.value,
                        start_time: DEFAULT_START,
                        end_time: DEFAULT_END,
                        is_unavailable: false,
                        enabled: false,
                    };
                })
            );
        } catch (error) {
            console.error("Error fetching schedules:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, [userId]);

    const handleToggleDay = (dayOfWeek: number) => {
        setSchedules((prev) =>
            prev.map((s) =>
                s.day_of_week === dayOfWeek ? { ...s, enabled: !s.enabled } : s
            )
        );
        setSaved(false);
    };

    const handleTimeChange = (
        dayOfWeek: number,
        field: "start_time" | "end_time",
        value: string
    ) => {
        setSchedules((prev) =>
            prev.map((s) =>
                s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s
            )
        );
        setSaved(false);
    };

    const handleSave = async () => {
        if (!userId) {
            alert("User not logged in");
            return;
        }

        setSaving(true);
        try {
            // Only save enabled days
            const toSave = schedules
                .filter((s) => s.enabled)
                .map((s) => ({
                    day_of_week: s.day_of_week,
                    start_time: s.start_time,
                    end_time: s.end_time,
                    is_unavailable: false,
                }));

            await axios.post(`${API_BASE}/schedules/bulk`, toSave, {
                params: { user_id: userId },
            });

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Error saving schedules:", error);
            alert("Failed to save schedules. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (!userId) {
        return (
            <div className="dashboard-page">
                <div className="card p-8 text-center">
                    <p className="text-gray-500">Please log in to manage availability.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h2>Availability Settings</h2>
                    <p>Set your working hours for each day of the week</p>
                </div>
                <div className="flex gap-2">
                    <button
                        className="btn btn-outline"
                        onClick={fetchSchedules}
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : saved ? (
                            <>
                                <Check className="w-4 h-4" />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Schedule Grid */}
            <div className="dashboard-card">
                <div className="card-header">
                    <h3 className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Weekly Schedule
                    </h3>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading schedule...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {schedules.map((schedule) => {
                            const day = DAYS.find((d) => d.value === schedule.day_of_week);
                            return (
                                <div
                                    key={schedule.day_of_week}
                                    className={`flex items-center justify-between p-4 transition-colors ${schedule.enabled ? "bg-white" : "bg-gray-50"
                                        }`}
                                >
                                    {/* Day Name & Toggle */}
                                    <div className="flex items-center gap-4 w-40">
                                        <button
                                            onClick={() => handleToggleDay(schedule.day_of_week)}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${schedule.enabled ? "bg-green-500" : "bg-gray-300"
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${schedule.enabled ? "left-7" : "left-1"
                                                    }`}
                                            />
                                        </button>
                                        <span
                                            className={`font-medium ${schedule.enabled ? "text-gray-900" : "text-gray-400"
                                                }`}
                                        >
                                            {day?.label}
                                        </span>
                                    </div>

                                    {/* Time Inputs */}
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-gray-500">From</label>
                                            <input
                                                type="time"
                                                value={schedule.start_time}
                                                onChange={(e) =>
                                                    handleTimeChange(
                                                        schedule.day_of_week,
                                                        "start_time",
                                                        e.target.value
                                                    )
                                                }
                                                disabled={!schedule.enabled}
                                                className={`p-2 border border-gray-200 rounded-lg text-sm ${schedule.enabled
                                                        ? "bg-white"
                                                        : "bg-gray-100 text-gray-400"
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-gray-500">To</label>
                                            <input
                                                type="time"
                                                value={schedule.end_time}
                                                onChange={(e) =>
                                                    handleTimeChange(
                                                        schedule.day_of_week,
                                                        "end_time",
                                                        e.target.value
                                                    )
                                                }
                                                disabled={!schedule.enabled}
                                                className={`p-2 border border-gray-200 rounded-lg text-sm ${schedule.enabled
                                                        ? "bg-white"
                                                        : "bg-gray-100 text-gray-400"
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="w-24 text-right">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${schedule.enabled
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-gray-100 text-gray-500"
                                                }`}
                                        >
                                            {schedule.enabled ? "Available" : "Off"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Info Card */}
            <div className="card p-4 mt-6 bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Toggle each day to set when you're available for
                    bookings. Your availability will affect which time slots customers can
                    book.
                </p>
            </div>
        </div>
    );
}
