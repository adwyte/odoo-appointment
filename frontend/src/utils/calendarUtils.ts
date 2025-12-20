/**
 * Utility functions for generating Google Calendar event URLs
 */

export interface CalendarEventData {
    title: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    description?: string;
    location?: string;
}

/**
 * Format date to Google Calendar format: YYYYMMDDTHHmmssZ
 */
function formatDateForGoogleCalendar(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generate a Google Calendar URL for creating a new event
 */
export function generateGoogleCalendarUrl(event: CalendarEventData): string {
    const baseUrl = 'https://calendar.google.com/calendar/render';

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${formatDateForGoogleCalendar(event.startTime)}/${formatDateForGoogleCalendar(event.endTime)}`,
    });

    if (event.description) {
        params.set('details', event.description);
    }

    if (event.location) {
        params.set('location', event.location);
    }

    return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate calendar URL for a booking
 */
export function generateBookingCalendarUrl(
    serviceName: string,
    startTime: string,
    endTime: string,
    bookingId?: number
): string {
    const description = bookingId
        ? `Booking #${bookingId}\n\nYour appointment for ${serviceName} has been confirmed.`
        : `Your appointment for ${serviceName} has been confirmed.`;

    return generateGoogleCalendarUrl({
        title: serviceName,
        startTime,
        endTime,
        description,
        location: 'UrbanCare',
    });
}
