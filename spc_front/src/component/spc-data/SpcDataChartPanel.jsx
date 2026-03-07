import React, { Suspense, lazy } from 'react';
import { Box } from '@mui/material';

const ReactApexChart = lazy(() => import('react-apexcharts'));

const SpcDataChartPanel = ({
    options,
    series,
    isSplit,
    minHeight = '420px',
    chartKey = 'spc-chart',
}) => {
    const chartType = options?.chart?.type || 'candlestick';

    return (
        <Box
            sx={{
                width: isSplit ? '20%' : '100%',
                height: '100%',
                minHeight,
                flexShrink: 0,
                flexGrow: isSplit ? 0 : 1,
                transition: 'all 0.3s ease-in-out',
                borderRadius: '15px',
                border: '1px solid',
                borderColor: 'neutral.700',
                background: 'linear-gradient(to bottom right, #2a2d33, #212429)',
                boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.08)',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
                position: 'relative',
                zIndex: 1,
                '& .apexcharts-canvas, & .apexcharts-svg, & .apexcharts-inner, & .apexcharts-tooltip': {
                    overflow: 'visible !important',
                },
            }}
        >
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'visible' }}>
                <Suspense
                    fallback={
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%',
                                minHeight,
                                color: 'neutral.main',
                                fontSize: '0.85rem',
                            }}
                        >
                            차트 렌더러 로딩 중...
                        </Box>
                    }
                >
                    <ReactApexChart
                        key={chartKey}
                        options={options}
                        series={series}
                        type={chartType}
                        height="100%"
                        width="100%"
                    />
                </Suspense>
            </Box>
        </Box>
    );
};

export default SpcDataChartPanel;
