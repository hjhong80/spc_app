export const buildMainBarSeriesData = (
    slots,
    {
        toDisplayValue,
        resolveStatus,
        resolveColor,
    },
) => {
    if (!Array.isArray(slots)) {
        return [];
    }

    return slots.map((slot) => {
        if (!slot?.point) {
            return { x: slot?.key, y: null };
        }

        const status = resolveStatus(slot.point.meta);
        const color = resolveColor(status);

        return {
            x: slot.key,
            y: toDisplayValue(slot.point.y),
            fillColor: color,
            strokeColor: color,
            meta: {
                ...(slot.point.meta || {}),
                visualStatus: status,
            },
        };
    });
};

export const calculateChartWidthRatio = ({ slotCount, visibleCount }) => {
    const normalizedSlotCount = Math.max(0, Number(slotCount) || 0);
    const normalizedVisibleCount = Math.max(1, Number(visibleCount) || 1);

    return Math.max(1, normalizedSlotCount / normalizedVisibleCount);
};
