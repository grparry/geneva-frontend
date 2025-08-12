/**
 * Date and time utility functions for the Geneva frontend
 * Handles timezone conversion and consistent formatting across the application
 */

/**
 * Format timestamps with dates and local time conversion
 * Converts UTC timestamps to user's local timezone with smart date context
 * 
 * @param timestamp - ISO timestamp string (with or without timezone info)
 * @returns Formatted string like "Today 9:41 PM", "Yesterday 2:30 PM", "Monday 10:15 AM", etc.
 */
export const formatTimestamp = (timestamp: string): string => {
  // Handle null/undefined timestamps
  if (!timestamp) {
    return 'Unknown time';
  }
  
  // Parse timestamp - if no timezone info, assume it's UTC
  let messageDate: Date;
  if (timestamp.endsWith('Z') || timestamp.includes('+') || timestamp.includes('-', 10)) {
    // Already has timezone info, parse normally
    messageDate = new Date(timestamp);
  } else {
    // No timezone info - assume UTC and append Z
    messageDate = new Date(timestamp + 'Z');
  }
  
  const now = new Date();
  
  // Use a more robust method for local time formatting
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const formattedTime = timeFormatter.format(messageDate);
  
  // Calculate date difference based on local dates
  const messageLocalDate = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  const nowLocalDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffInDays = Math.floor((nowLocalDate.getTime() - messageLocalDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Format based on how recent the message is
  if (diffInDays === 0) {
    return `Today ${formattedTime}`;
  } else if (diffInDays === 1) {
    return `Yesterday ${formattedTime}`;
  } else if (diffInDays === -1) {
    return `Tomorrow ${formattedTime}`;
  } else if (Math.abs(diffInDays) < 7) {
    const dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long' });
    const dayName = dayFormatter.format(messageDate);
    return `${dayName} ${formattedTime}`;
  } else {
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...(messageDate.getFullYear() !== now.getFullYear() && { year: 'numeric' })
    });
    return dateFormatter.format(messageDate);
  }
};

/**
 * Format timestamp for debugging purposes
 * Shows original timestamp, parsed date, UTC, local time, and timezone offset
 * 
 * @param timestamp - ISO timestamp string
 * @returns Debug information object
 */
export const debugTimestamp = (timestamp: string) => {
  const messageDate = new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z');
  const now = new Date();
  
  return {
    originalTimestamp: timestamp,
    parsedDate: messageDate.toString(),
    parsedUTC: messageDate.toUTCString(),
    parsedLocal: messageDate.toLocaleString(),
    currentTime: now.toString(),
    timezoneOffset: messageDate.getTimezoneOffset(),
    formattedTime: formatTimestamp(timestamp)
  };
};

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 * Useful for activity timestamps and relative dates
 * 
 * @param timestamp - ISO timestamp string
 * @returns Relative time string
 */
export const getRelativeTime = (timestamp: string): string => {
  const messageDate = new Date(timestamp.endsWith('Z') ? timestamp : timestamp + 'Z');
  const now = new Date();
  const diffInMs = now.getTime() - messageDate.getTime();
  
  const minutes = Math.floor(diffInMs / (1000 * 60));
  const hours = Math.floor(diffInMs / (1000 * 60 * 60));
  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  
  // For older dates, use the formatted timestamp
  return formatTimestamp(timestamp);
};