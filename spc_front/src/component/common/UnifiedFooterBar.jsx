import { Box } from '@mui/material';

export const UNIFIED_FOOTER_HEIGHT_PX = 18;

const UnifiedFooterBar = ({ children = null, sx = {} }) => {
    return (
        <Box
            sx={{
                minHeight: `${UNIFIED_FOOTER_HEIGHT_PX}px`,
                height: `${UNIFIED_FOOTER_HEIGHT_PX}px`,
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                minWidth: 0,
                ...sx,
            }}
        >
            {children}
        </Box>
    );
};

export default UnifiedFooterBar;
