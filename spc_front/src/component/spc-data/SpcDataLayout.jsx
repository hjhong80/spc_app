import React from 'react';
import { Box } from '@mui/material';
import UnifiedFooterBar from '../common/UnifiedFooterBar';

const SpcDataLayout = ({ header, children, footer = null }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
                bgcolor: 'background.default',
                color: 'neutral.300',
                p: 3,
                gap: 2,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {header}
            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    minHeight: 0,
                    minWidth: 0,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {children}
            </Box>
            <UnifiedFooterBar>{footer}</UnifiedFooterBar>
        </Box>
    );
};

export default SpcDataLayout;
