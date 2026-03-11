import React from 'react';
import { Box } from '@mui/material';
import SpcDataChartPanel from '../spc-data/SpcDataChartPanel';

const toChartKeyPart = (value) => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    return String(value);
};

const buildDetailChartKey = ({ options, series, chartWidthRatio }) => {
    const chartType = options?.chart?.type || 'candlestick';
    const categoryKey = Array.isArray(options?.xaxis?.categories)
        ? options.xaxis.categories.map(toChartKeyPart).join('|')
        : '-';
    const seriesKey = Array.isArray(series)
        ? series
              .map((entry, index) => {
                  const dataKey = Array.isArray(entry?.data)
                      ? entry.data
                            .map((point) => {
                                if (point && typeof point === 'object') {
                                    return toChartKeyPart(point.x ?? point.y);
                                }
                                return toChartKeyPart(point);
                            })
                            .join(',')
                      : '-';
                  return `${index + 1}:${dataKey}`;
              })
              .join(';')
        : '-';

    return `detail-${chartType}-${toChartKeyPart(chartWidthRatio)}-${categoryKey}-${seriesKey}`;
};

const DetailCharacteristicChart = ({
    chartWidthRatio,
    options,
    series,
    overlayControls = null,
    onBack,
}) => {
    const chartKey = buildDetailChartKey({
        options,
        series,
        chartWidthRatio,
    });

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
