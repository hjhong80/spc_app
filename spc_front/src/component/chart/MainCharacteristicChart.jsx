import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import SpcDataChartPanel from '../spc-data/SpcDataChartPanel';

const MainCharacteristicChart = ({
    chartWidthRatio,
    options,
    series,
    yAxisHoverTooltipResolver,
}) => {
    const chartKey = `main-${options?.chart?.type || 'bar'}`;
    const containerRef = useRef(null);
    const [yAxisHotspots, setYAxisHotspots] = useState([]);
    const [hoverTooltip, setHoverTooltip] = useState({
        open: false,
        text: '',
        left: 0,
        top: 0,
    });

    useEffect(() => {
        const container = containerRef.current;
        if (!container || typeof yAxisHoverTooltipResolver !== 'function') {
            setYAxisHotspots([]);
            setHoverTooltip((current) => (current.open ? { ...current, open: false } : current));
            return undefined;
        }

        let resizeObserver = null;
        let mutationObserver = null;
        let timeoutId = null;

        const syncYAxisHotspots = () => {
            const yAxisRoot = container.querySelector('.apexcharts-yaxis');
            const yAxisGroup = container.querySelector('.apexcharts-yaxis-texts-g');
            if (!yAxisRoot || !yAxisGroup) {
                setYAxisHotspots([]);
                return;
            }

            const removeNativeTitles = () => {
                yAxisRoot.querySelectorAll('title').forEach((titleNode) => titleNode.remove());
                yAxisRoot.querySelectorAll('[title]').forEach((node) => node.removeAttribute('title'));
            };

            removeNativeTitles();
            yAxisRoot.style.setProperty('pointer-events', 'none', 'important');
            yAxisGroup.style.setProperty('pointer-events', 'none', 'important');
            yAxisRoot.querySelectorAll('*').forEach((node) => {
                node.style?.setProperty?.('pointer-events', 'none', 'important');
            });

            const labelNodes = Array.from(yAxisGroup.querySelectorAll('.apexcharts-yaxis-label'));
            const containerRect = container.getBoundingClientRect();
            const yAxisRect = yAxisRoot.getBoundingClientRect();
            const yAxisLeft = Math.max(0, yAxisRect.left - containerRect.left - 6);
            const yAxisRight = Math.min(containerRect.width, yAxisRect.right - containerRect.left + 6);
            const nextHotspots = labelNodes
                .map((labelNode, index) => {
                    labelNode.style.setProperty('pointer-events', 'none', 'important');
                    labelNode.style.cursor = 'default';

                    const rect = labelNode.getBoundingClientRect();
                    const labelText =
                        labelNode.querySelector('tspan')?.textContent?.trim() ||
                        labelNode.firstChild?.textContent?.trim() ||
                        labelNode.textContent?.trim() ||
                        '';
                    const tooltipText = yAxisHoverTooltipResolver(labelText);

                    if (!tooltipText || rect.width === 0 || rect.height === 0) {
                        return null;
                    }

                    return {
                        id: `${labelText}-${index}`,
                        text: tooltipText,
                        left: yAxisLeft,
                        top: rect.top - containerRect.top - 2,
                        width: Math.max(yAxisRight - yAxisLeft, rect.width + 12, 48),
                        height: Math.max(rect.height + 4, 18),
                    };
                })
                .filter(Boolean);

            setYAxisHotspots(nextHotspots);
        };

        timeoutId = window.setTimeout(() => {
            syncYAxisHotspots();

            const yAxisRoot = container.querySelector('.apexcharts-yaxis');
            const yAxisGroup = container.querySelector('.apexcharts-yaxis-texts-g');
            if (!yAxisRoot || !yAxisGroup) {
                return;
            }

            resizeObserver = new ResizeObserver(() => {
                syncYAxisHotspots();
            });
            resizeObserver.observe(container);

            mutationObserver = new MutationObserver(() => {
                syncYAxisHotspots();
            });
            mutationObserver.observe(yAxisRoot, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['title', 'transform', 'x', 'y', 'style'],
            });
        }, 0);

        return () => {
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            if (mutationObserver) {
                mutationObserver.disconnect();
            }
            setYAxisHotspots([]);
        };
    }, [chartKey, yAxisHoverTooltipResolver]);

    return (
        <Box
            ref={containerRef}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1.1,
                minHeight: 0,
                minWidth: 0,
                gap: 0,
                position: 'relative',
                overflow: 'visible',
            }}
        >
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
                        minHeight="360px"
                    />
                </Box>
            </Box>
            {yAxisHotspots.map((hotspot) => (
                <Box
                    key={hotspot.id}
                    onMouseEnter={(event) => {
                        const nextContainer = containerRef.current;
                        if (!nextContainer) {
                            return;
                        }

                        const containerRect = nextContainer.getBoundingClientRect();
                        setHoverTooltip({
                            open: true,
                            text: hotspot.text,
                            left: event.clientX - containerRect.left + 12,
                            top: event.clientY - containerRect.top - 10,
                        });
                    }}
                    onMouseMove={(event) => {
                        const nextContainer = containerRef.current;
                        if (!nextContainer) {
                            return;
                        }

                        const containerRect = nextContainer.getBoundingClientRect();
                        setHoverTooltip({
                            open: true,
                            text: hotspot.text,
                            left: event.clientX - containerRect.left + 12,
                            top: event.clientY - containerRect.top - 10,
                        });
                    }}
                    onMouseLeave={() => {
                        setHoverTooltip((current) => ({ ...current, open: false }));
                    }}
                    sx={{
                        position: 'absolute',
                        left: hotspot.left,
                        top: hotspot.top,
                        width: hotspot.width,
                        height: hotspot.height,
                        zIndex: 4,
                        bgcolor: 'transparent',
                        cursor: 'help',
                    }}
                />
            ))}
            {hoverTooltip.open && (
                <Box
                    sx={{
                        position: 'absolute',
                        left: hoverTooltip.left,
                        top: hoverTooltip.top,
                        zIndex: 8,
                        px: 1,
                        py: 0.6,
                        borderRadius: '8px',
                        border: '1px solid rgba(163,163,163,0.22)',
                        bgcolor: 'rgba(15,18,24,0.96)',
                        color: '#f2f4f8',
                        fontSize: '0.72rem',
                        lineHeight: 1.35,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.28)',
                        transform: 'translate(0, -100%)',
                    }}
                >
                    {hoverTooltip.text}
                </Box>
            )}
        </Box>
    );
};

export default MainCharacteristicChart;
