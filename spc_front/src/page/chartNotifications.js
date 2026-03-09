export const CHART_NOTIFICATION_SEVERITY = {
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    INFO: 'info',
};

const MAX_CHART_NOTIFICATION_COUNT = 10;

const NOTIFICATION_PRIORITY = {
    [CHART_NOTIFICATION_SEVERITY.ERROR]: 4,
    [CHART_NOTIFICATION_SEVERITY.WARNING]: 3,
    [CHART_NOTIFICATION_SEVERITY.SUCCESS]: 2,
    [CHART_NOTIFICATION_SEVERITY.INFO]: 1,
};

export const createChartNotification = ({ severity, message, source = '' }) => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    severity,
    message,
    source,
});

export const appendChartNotification = (notifications, notification) => {
    return [notification, ...(Array.isArray(notifications) ? notifications : [])].slice(
        0,
        MAX_CHART_NOTIFICATION_COUNT,
    );
};

export const getHighestChartNotificationSeverity = (notifications) => {
    return (Array.isArray(notifications) ? notifications : []).reduce((highest, notification) => {
        if (!highest) {
            return notification?.severity || null;
        }

        return NOTIFICATION_PRIORITY[notification?.severity] >
            NOTIFICATION_PRIORITY[highest]
            ? notification.severity
            : highest;
    }, null);
};

export const getChartNotificationAutoHideDuration = (severity) => {
    if (severity === CHART_NOTIFICATION_SEVERITY.INFO) {
        return 2000;
    }
    if (severity === CHART_NOTIFICATION_SEVERITY.SUCCESS) {
        return 5000;
    }
    if (severity === CHART_NOTIFICATION_SEVERITY.WARNING) {
        return 7000;
    }
    if (severity === CHART_NOTIFICATION_SEVERITY.ERROR) {
        return 8000;
    }
    return 5000;
};

export const shouldUseFloatingChartNotification = (severity) => {
    return severity === CHART_NOTIFICATION_SEVERITY.INFO;
};

export const getChartNotificationAlertSurfaceStyle = (severity) => {
    if (severity === CHART_NOTIFICATION_SEVERITY.ERROR) {
        return {
            bgcolor: 'rgba(66, 22, 26, 0.92)',
            color: '#ffdadd',
            border: '1px solid #ff5f6d',
            iconColor: '#ff5f6d',
            actionColor: '#ff9aa4',
        };
    }
    if (severity === CHART_NOTIFICATION_SEVERITY.WARNING) {
        return {
            bgcolor: 'rgba(59, 42, 20, 0.9)',
            color: '#ffe8c2',
            border: '1px solid #ffb74d',
            iconColor: '#ffb74d',
            actionColor: '#ffcc80',
        };
    }
    if (severity === CHART_NOTIFICATION_SEVERITY.SUCCESS) {
        return {
            bgcolor: 'rgba(22, 51, 36, 0.9)',
            color: '#d4f5de',
            border: '1px solid #66bb6a',
            iconColor: '#66bb6a',
            actionColor: '#a5d6a7',
        };
    }

    return {
        bgcolor: 'rgba(15, 41, 66, 0.82)',
        color: '#e3f2fd',
        border: '1px solid rgba(41, 182, 246, 0.72)',
        iconColor: '#29b6f6',
        actionColor: '#81d4fa',
    };
};

export const getChartNotificationContextKey = ({ activeChartView, detailScale }) => {
    if (activeChartView !== 'detail') {
        return 'main';
    }

    return detailScale === 'day' ? 'detail-day' : 'detail-month';
};

export const shouldResetChartNotificationsForContextChange = (previousKey, nextKey) => {
    if (!previousKey || !nextKey) {
        return false;
    }

    return previousKey !== nextKey;
};
