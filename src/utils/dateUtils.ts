/**
 * Date utility functions for formatting timestamps and time differences
 */

/**
 * Format a date relative to now (e.g., "2 hours ago", "in 5 minutes")
 */
export function formatDistanceToNow(date: Date, options: { addSuffix?: boolean } = {}): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    let result: string;

    if (Math.abs(diffSeconds) < 60) {
        result = "just now";
    } else if (Math.abs(diffMinutes) < 60) {
        const minutes = Math.abs(diffMinutes);
        result = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    } else if (Math.abs(diffHours) < 24) {
        const hours = Math.abs(diffHours);
        result = `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else if (Math.abs(diffDays) < 30) {
        const days = Math.abs(diffDays);
        result = `${days} day${days !== 1 ? "s" : ""}`;
    } else {
        return date.toLocaleDateString();
    }

    if (options.addSuffix) {
        if (diffMs < 0) {
            result = `in ${result}`;
        } else {
            result = `${result} ago`;
        }
    }

    return result;
}

/**
 * Format a date as a human-readable string
 */
export function formatDate(date: Date): string {
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Format a timestamp for display in the UI
 */
export function formatTimestamp(timestamp: number): string {
    return formatDate(new Date(timestamp));
}

/**
 * Get a short relative time string (e.g., "2h", "5m", "now")
 */
export function formatRelativeTimeShort(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (Math.abs(diffSeconds) < 60) {
        return "now";
    } else if (Math.abs(diffMinutes) < 60) {
        return `${Math.abs(diffMinutes)}m`;
    } else if (Math.abs(diffHours) < 24) {
        return `${Math.abs(diffHours)}h`;
    } else {
        return `${Math.abs(diffDays)}d`;
    }
}
