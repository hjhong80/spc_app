import React from 'react';
import { Box } from '@mui/material';
import SpcDataChartPanel from '../spc-data/SpcDataChartPanel';

const DetailCharacteristicChart = ({
    chartWidthRatio,
    options,
    series,
    overlayControls = null,
    onBack,
}) => {
    const chartKey = `detail-${options?.chart?.type || 'candlestick'}`;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                position: 'relative',
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    minHeight: 0,
                    minWidth: 0,
                }}
            >
                {overlayControls && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 18,
                            zIndex: 5,
                        }}
                    >
                        {overlayControls}
                    </Box>
                )}

                <Box
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        minWidth: 0,
                        borderRadius: '12px',
                        display: 'flex',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                    }}
                    onContextMenu={(event) => {
                        event.preventDefault();
                        onBack?.();
                    }}
                >
                    <Box
                        sx={{
                            minWidth: `calc(100% * ${chartWidthRatio})`,
                            width: `calc(100% * ${chartWidthRatio})`,
                            height: '100%',
                            minHeight: 0,
                        }}
                    >
                        <SpcDataChartPanel
                            chartKey={chartKey}
                            options={options}
                            series={series}
                            isSplit={false}
                            minHeight="280px"
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default DetailCharacteristicChart;
