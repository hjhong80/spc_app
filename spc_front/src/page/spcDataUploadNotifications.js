const MAX_UPLOAD_NOTIFICATIONS = 10;

export const UPLOAD_NOTIFICATION_SEVERITY = {
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
};

const SEVERITY_PRIORITY = {
    [UPLOAD_NOTIFICATION_SEVERITY.SUCCESS]: 1,
    [UPLOAD_NOTIFICATION_SEVERITY.WARNING]: 2,
    [UPLOAD_NOTIFICATION_SEVERITY.ERROR]: 3,
};

export const createUploadNotification = ({ severity, message }) => ({
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    severity,
    message,
    createdAt: Date.now(),
});

export const appendUploadNotification = (notifications, notification) => {
    const nextNotifications = [notification, ...(Array.isArray(notifications) ? notifications : [])];
    return nextNotifications.slice(0, MAX_UPLOAD_NOTIFICATIONS);
};

export const resolveUploadNotificationSeverity = ({
    failedCount = 0,
    skippedCount = 0,
    totalCount = 0,
}) => {
    if (failedCount > 0) {
        return UPLOAD_NOTIFICATION_SEVERITY.ERROR;
    }

    if (skippedCount > 0 || totalCount === 0) {
        return UPLOAD_NOTIFICATION_SEVERITY.WARNING;
    }

    return UPLOAD_NOTIFICATION_SEVERITY.SUCCESS;
};

export const getHighestUploadNotificationSeverity = (notifications) => {
    if (!Array.isArray(notifications) || notifications.length === 0) {
        return null;
    }

    return notifications.reduce((highest, notification) => {
        if (!highest) {
            return notification.severity;
        }

        return SEVERITY_PRIORITY[notification.severity] > SEVERITY_PRIORITY[highest]
            ? notification.severity
            : highest;
    }, null);
};
