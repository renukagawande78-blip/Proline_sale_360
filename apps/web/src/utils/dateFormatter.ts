/**
 * Centralized Date & Time Formatting Utilities for Proline OMS 360
 * Standard: DD-MMM-YYYY (e.g. 31-Aug-2026) and 12-hour Time (e.g. 10:44 AM)
 */

export interface FormattedDateTimeParts {
  date: string;
  time: string;
  full: string;
}

export const formatDateTimeParts = (dateInput?: string | Date | null): FormattedDateTimeParts => {
  if (!dateInput) {
    return { date: '—', time: '', full: '—' };
  }

  try {
    const dt = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(dt.getTime())) {
      return { date: String(dateInput), time: '', full: String(dateInput) };
    }

    // Format date part: "31-Aug-2026"
    const day = dt.toLocaleDateString('en-GB', { day: '2-digit' });
    const month = dt.toLocaleDateString('en-GB', { month: 'short' });
    const year = dt.getFullYear();
    const date = `${day}-${month}-${year}`;

    // Format time part: "10:44 AM"
    const time = dt.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return {
      date,
      time,
      full: `${date}, ${time}`
    };
  } catch {
    return { date: String(dateInput), time: '', full: String(dateInput) };
  }
};

export const formatDisplayDate = (dateInput?: string | Date | null): string => {
  return formatDateTimeParts(dateInput).date;
};

export const formatDisplayTime = (dateInput?: string | Date | null): string => {
  return formatDateTimeParts(dateInput).time;
};

export const formatDisplayDateTime = (dateInput?: string | Date | null): string => {
  return formatDateTimeParts(dateInput).full;
};
