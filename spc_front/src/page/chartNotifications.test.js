import { describe, expect, it } from 'vitest';
import {
    appendChartNotification,
    CHART_NOTIFICATION_SEVERITY,
    createChartNotification,
    getChartNotificationAlertSurfaceStyle,
    getChartNotificationAutoHideDuration,
    getChartNotificationContextKey,
    getHighestChartNotificationSeverity,
    shouldResetChartNotificationsForContextChange,
    shouldUseFloatingChartNotification,
} from './chartNotifications';

describe('chartNotifications', () => {
    it('appends notifications newest first and caps the history size', () => {
        const notifications = Array.from({ length: 12 }, (_, index) =>
            createChartNotification({
                severity: CHART_NOTIFICATION_SEVERITY.INFO,
                message: `message-${index}`,
            }),
        ).reduce((acc, notification) => appendChartNotification(acc, notification), []);

        expect(notifications).toHaveLength(10);
        expect(notifications[0].message).toBe('message-11');
        expect(notifications.at(-1).message).toBe('message-2');
    });

    it('resolves the highest severity in error-warning-success-info order', () => {
        const notifications = [
            createChartNotification({
                severity: CHART_NOTIFICATION_SEVERITY.INFO,
                message: 'info',
            }),
            createChartNotification({
                severity: CHART_NOTIFICATION_SEVERITY.SUCCESS,
                message: 'success',
            }),
            createChartNotification({
                severity: CHART_NOTIFICATION_SEVERITY.ERROR,
                message: 'error',
            }),
        ];

        expect(getHighestChartNotificationSeverity(notifications)).toBe(
            CHART_NOTIFICATION_SEVERITY.ERROR,
        );
    });

    it('uses a short auto hide duration for info notifications only', () => {
        expect(
            getChartNotificationAutoHideDuration(CHART_NOTIFICATION_SEVERITY.INFO),
        ).toBe(2000);
        expect(
            getChartNotificationAutoHideDuration(CHART_NOTIFICATION_SEVERITY.SUCCESS),
        ).toBe(5000);
        expect(
            getChartNotificationAutoHideDuration(CHART_NOTIFICATION_SEVERITY.WARNING),
        ).toBe(7000);
        expect(
            getChartNotificationAutoHideDuration(CHART_NOTIFICATION_SEVERITY.ERROR),
        ).toBe(8000);
    });

    it('treats info notifications as floating translucent alerts', () => {
        expect(shouldUseFloatingChartNotification(CHART_NOTIFICATION_SEVERITY.INFO)).toBe(true);
        expect(shouldUseFloatingChartNotification(CHART_NOTIFICATION_SEVERITY.SUCCESS)).toBe(
            false,
        );

        expect(
            getChartNotificationAlertSurfaceStyle(CHART_NOTIFICATION_SEVERITY.INFO),
        ).toMatchObject({
            bgcolor: 'rgba(15, 41, 66, 0.82)',
            color: '#e3f2fd',
        });
    });

    it('builds chart notification context keys by chart scope rather than visual mode', () => {
        expect(getChartNotificationContextKey({ activeChartView: 'main', detailScale: 'month' })).toBe(
            'main',
        );
        expect(
            getChartNotificationContextKey({ activeChartView: 'detail', detailScale: 'month' }),
        ).toBe('detail-month');
        expect(
            getChartNotificationContextKey({ activeChartView: 'detail', detailScale: 'day' }),
        ).toBe('detail-day');
    });

    it('resets notifications only when chart scope changes across month-day-main boundaries', () => {
        expect(
            shouldResetChartNotificationsForContextChange('detail-month', 'detail-month'),
        ).toBe(false);
        expect(
            shouldResetChartNotificationsForContextChange('detail-month', 'detail-day'),
        ).toBe(true);
        expect(shouldResetChartNotificationsForContextChange('detail-month', 'main')).toBe(true);
    });
});
