import { describe, expect, it } from 'vitest';
import {
    appendUploadNotification,
    getHighestUploadNotificationSeverity,
    resolveUploadNotificationSeverity,
    UPLOAD_NOTIFICATION_SEVERITY,
} from './spcDataUploadNotifications';

describe('spcDataUploadNotifications', () => {
    it('classifies duplicate-skip style results as warning and failures as error', () => {
        expect(
            resolveUploadNotificationSeverity({
                failedCount: 0,
                skippedCount: 1,
                totalCount: 5,
            }),
        ).toBe(UPLOAD_NOTIFICATION_SEVERITY.WARNING);

        expect(
            resolveUploadNotificationSeverity({
                failedCount: 2,
                skippedCount: 0,
                totalCount: 5,
            }),
        ).toBe(UPLOAD_NOTIFICATION_SEVERITY.ERROR);

        expect(
            resolveUploadNotificationSeverity({
                failedCount: 0,
                skippedCount: 0,
                totalCount: 5,
            }),
        ).toBe(UPLOAD_NOTIFICATION_SEVERITY.SUCCESS);
    });

    it('keeps the most recent upload notifications at the front of the history', () => {
        const first = { id: '1', severity: 'success', message: 'first' };
        const second = { id: '2', severity: 'warning', message: 'second' };

        expect(appendUploadNotification([first], second)).toEqual([second, first]);
    });

    it('returns the highest visible severity for the header icon', () => {
        expect(
            getHighestUploadNotificationSeverity([
                { id: '1', severity: 'success' },
                { id: '2', severity: 'warning' },
            ]),
        ).toBe(UPLOAD_NOTIFICATION_SEVERITY.WARNING);

        expect(
            getHighestUploadNotificationSeverity([
                { id: '1', severity: 'success' },
                { id: '2', severity: 'error' },
                { id: '3', severity: 'warning' },
            ]),
        ).toBe(UPLOAD_NOTIFICATION_SEVERITY.ERROR);
    });
});
