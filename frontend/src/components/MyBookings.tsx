import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, CalendarPlus } from 'lucide-react';
import { generateBookingCalendarUrl } from '../utils/calendarUtils';
import { useAuth } from '../hooks/useAuth.tsx';

interface Booking {
    id: number;
    service_name: string;
    start_time: string;
    end_time: string;
    status: string;
    created_at: string | null;
}

const MyBookings: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (user?.email) {
            fetchBookings(user.email);
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [user, authLoading]);

    const fetchBookings = async (email: string) => {
        setLoading(true);
        try {
            const response = await axios.get<Booking[]>(`${API_BASE}/bookings`, {
                params: { customer_email: email }
            });
            setBookings(response.data);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return {
            date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'cancelled':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'pending':
                return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            default:
                return <CheckCircle className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold";
        switch (status.toLowerCase()) {
            case 'confirmed':
                return `${baseClasses} bg-green-100 text-green-700`;
            case 'cancelled':
                return `${baseClasses} bg-red-100 text-red-700`;
            case 'pending':
                return `${baseClasses} bg-yellow-100 text-yellow-700`;
            case 'completed':
                return `${baseClasses} bg-blue-100 text-blue-700`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-700`;
        }
    };

    // Show loading while auth is being resolved
    if (authLoading) {
        return (
            <div className="dashboard-page">
                <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // Show message if user is not logged in
    if (!user) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-card">
                    <div className="p-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Please Sign In</h3>
                        <p className="text-gray-500">You need to be signed in to view your bookings.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h2>My Bookings</h2>
                    <p>View and manage your appointment bookings</p>
                </div>
            </div>

            {/* Bookings List */}
            <div className="dashboard-card">
                <div className="card-header">
                    <h3>Your Appointments</h3>
                    <span className="text-sm text-gray-500">{bookings.length} bookings found</span>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading your bookings...</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="p-8 text-center">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No bookings found.</p>
                        <p className="text-sm text-gray-400 mt-2">Book an appointment to see it here!</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {bookings.map((booking) => {
                            const { date, time } = formatDateTime(booking.start_time);
                            return (
                                <div key={booking.id} className="p-5 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                                                <Calendar className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-lg">{booking.service_name}</h4>
                                                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {date}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {time}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {booking.status.toLowerCase() === 'confirmed' && (
                                                <button
                                                    onClick={() => {
                                                        const calendarUrl = generateBookingCalendarUrl(
                                                            booking.service_name,
                                                            booking.start_time,
                                                            booking.end_time,
                                                            booking.id
                                                        );
                                                        window.open(calendarUrl, '_blank');
                                                    }}
                                                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
                                                    title="Add to Google Calendar"
                                                >
                                                    <CalendarPlus className="w-5 h-5" />
                                                </button>
                                            )}
                                            {getStatusIcon(booking.status)}
                                            <span className={getStatusBadge(booking.status)}>
                                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyBookings;

