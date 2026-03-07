import { useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';

import theme from '../theme';
import { navigateBackOrFallback } from '../utils/navigation';
import UnifiedHeaderBar from '../component/common/UnifiedHeaderBar';

const headerConfigByPath = {
    '/': {
        title: 'CMM 성적서 관리 시스템',
        titleVariant: 'h5',
        showNavigationButtons: false,
    },
    '/project-mapper': {
        title: '성적서 양식 설정',
        titleVariant: 'h5',
        showNavigationButtons: true,
    },
};

const MainLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const headerWrapperRef = useRef(null);
    const [headerOffset, setHeaderOffset] = useState('0px');

    const normalizedPath =
        location.pathname !== '/' && location.pathname.endsWith('/')
            ? location.pathname.slice(0, -1)
            : location.pathname;
    const headerConfig = headerConfigByPath[normalizedPath];
    const showGlobalHeader = Boolean(headerConfig);
    const resolvedHeaderOffset = showGlobalHeader ? headerOffset : '0px';

    useLayoutEffect(() => {
        if (!showGlobalHeader) {
            return;
        }

        const wrapper = headerWrapperRef.current;
        if (!wrapper) {
            return;
        }

        const updateHeaderOffset = () => {
            const measured = Math.ceil(wrapper.getBoundingClientRect().height);
            setHeaderOffset(`${measured}px`);
        };

        updateHeaderOffset();

        let resizeObserver;
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(updateHeaderOffset);
            resizeObserver.observe(wrapper);
        }

        window.addEventListener('resize', updateHeaderOffset);
        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener('resize', updateHeaderOffset);
        };
    }, [showGlobalHeader]);

    const handleBack = () => {
        navigateBackOrFallback(navigate, '/');
    };

    const handleHome = () => {
        navigate('/');
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100vh',
                    bgcolor: 'background.default',
                    '--global-header-offset': resolvedHeaderOffset,
                }}
            >
                {showGlobalHeader && (
                    <Box ref={headerWrapperRef} sx={{ px: 3, pt: 3 }}>
                        <UnifiedHeaderBar
                            title={headerConfig.title}
                            titleVariant={headerConfig.titleVariant}
                            showNavigationButtons={headerConfig.showNavigationButtons}
                            onBack={handleBack}
                            onHome={handleHome}
                        />
                    </Box>
                )}

                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 0,
                        minHeight: 0,
                        display: 'flex',
                        height: 'calc(100vh - var(--global-header-offset))',
                        maxHeight: 'calc(100vh - var(--global-header-offset))',
                        overflow: 'hidden',
                        '@supports (height: 100dvh)': {
                            height: 'calc(100dvh - var(--global-header-offset))',
                            maxHeight:
                                'calc(100dvh - var(--global-header-offset))',
                        },
                    }}
                >
                    <Outlet />
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default MainLayout;
