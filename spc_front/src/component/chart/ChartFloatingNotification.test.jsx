import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ChartFloatingNotification from './ChartFloatingNotification';
import { CHART_NOTIFICATION_SEVERITY } from '../../page/chartNotifications';

describe('ChartFloatingNotification', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('auto closes after the configured duration and keeps rendering the notification message', () => {
        const anchorEl = document.createElement('button');
        document.body.appendChild(anchorEl);
        const handleClose = vi.fn();

        render(
            <ChartFloatingNotification
                open
                anchorEl={anchorEl}
                notification={{
                    severity: CHART_NOTIFICATION_SEVERITY.INFO,
                    message: '정규분포 102ms · resp miss · compute miss',
                }}
                onClose={handleClose}
            />,
        );

        expect(screen.getByRole('alert')).toHaveTextContent(
            '정규분포 102ms · resp miss · compute miss',
        );

        vi.advanceTimersByTime(1999);
        expect(handleClose).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
