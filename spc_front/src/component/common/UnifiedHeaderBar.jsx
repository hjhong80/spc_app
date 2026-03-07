import { Box, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import HeaderAuthStatus from './HeaderAuthStatus';

const NAV_SECTION_WIDTH_PX = 128;

const UnifiedHeaderBar = ({
    title,
    titleVariant = 'h5',
    showNavigationButtons = true,
    onBack,
    onHome,
    titleAdornment = null,
    rightSlot = null,
}) => {
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: `${NAV_SECTION_WIDTH_PX}px minmax(0,1fr) auto ${NAV_SECTION_WIDTH_PX}px`,
                alignItems: 'center',
                columnGap: 1.5,
                width: '100%',
                minHeight: '60px',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                {showNavigationButtons && (
                    <>
                        <IconButton
                            onClick={onBack}
                            sx={{
                                color: 'neutral.400',
                                '&:hover': {
                                    color: 'neutral.200',
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                },
                            }}
                        >
                            <ArrowBackIcon sx={{ fontSize: 24 }} />
                        </IconButton>
                        <IconButton
                            onClick={onHome}
                            sx={{
                                color: 'neutral.400',
                                '&:hover': {
                                    color: 'neutral.200',
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                },
                            }}
                        >
                            <HomeIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                    </>
                )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
                <Typography
                    variant={titleVariant}
                    sx={{
                        fontWeight: 700,
                        color: 'neutral.200',
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {title}
                </Typography>
                {titleAdornment}
            </Box>

            <HeaderAuthStatus sx={{ ml: 0 }} />

            <Box
                sx={{
                    width: `${NAV_SECTION_WIDTH_PX}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    minWidth: 0,
                }}
            >
                {rightSlot}
            </Box>
        </Box>
    );
};

export default UnifiedHeaderBar;
