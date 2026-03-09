import React, { useEffect } from 'react';
import { Alert, Box, Popper } from '@mui/material';
import {
    CHART_NOTIFICATION_SEVERITY,
    getChartNotificationAlertSurfaceStyle,
    getChartNotificationAutoHideDuration,
} from '../../page/chartNotifications';

const ChartFloatingNotification = ({ open, anchorEl, notification, onClose }) => {
    useEffect(() => {
        if (!open || !notification) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            onClose?.(null, 'timeout');
        }, getChartNotificationAutoHideDuration(notification.severity));

        return () => {
            window.clearTimeout(timer);
        };
    }, [notification, onClose, open]);

    if (!open || !anchorEl || !notification) {
        return null;
    }

    const style = getChartNotificationAlertSurfaceStyle(notification.severity);

    return (
        <Popper
            open
            anchorEl={anchorEl}
            placement="bottom-end"
            modifiers={[
                {
                    name: 'offset',
                    options: {
                        offset: [0, 8],
                    },
                },
            ]}
            sx={{
                zIndex: (theme) => theme.zIndex.snackbar + 10,
            }}
        >
            <Box sx={{ width: 'min(360px, 62vw)' }}>
                <Alert
                    role="alert"
                    severity={notification.severity || CHART_NOTIFICATION_SEVERITY.INFO}
                    onClose={onClose}
                    sx={{
                        bgcolor: style.bgcolor,
                        color: style.color,
                        border: style.border,
                        boxShadow: '0 10px 24px rgba(0,0,0,0.38)',
                        backdropFilter: 'blur(8px)',
                        '& .MuiAlert-icon': {
                            color: style.iconColor,
                        },
                        '& .MuiAlert-action': {
                            color: style.actionColor,
                        },
                    }}
                >
                    {notification.message}
                </Alert>
            </Box>
        </Popper>
    );
};

export default ChartFloatingNotification;
