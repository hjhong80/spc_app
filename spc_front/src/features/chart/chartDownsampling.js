const DEFAULT_MIN_SLOT_COUNT = 35;
const DEFAULT_MAX_SLOT_COUNT = 240;

const toDisplayLabel = (point, fallback) => {
    const label = point?.meta?.label ?? point?.x ?? fallback;
    return typeof label === 'string' && label.trim() ? label.trim() : fallback;
};

const buildGroupLabel = (points, groupIndex) => {
    const firstLabel = toDisplayLabel(points[0], `G-${groupIndex + 1}`);
    const lastLabel = toDisplayLabel(points[points.length - 1], firstLabel);

    if (points.length <= 1 || firstLabel === lastLabel) {
        return firstLabel;
    }

    return `${firstLabel} ~ ${lastLabel}`;
};

const pickRepresentativePoint = (points) => {
    if (!Array.isArray(points) || points.length === 0) {
        return null;
    }

    return points.reduce((currentBest, point) => {
        if (!currentBest) {
            return point;
        }

        const currentRate = Number(currentBest?.meta?.defectRatePercent);
        const nextRate = Number(point?.meta?.defectRatePercent);

        if (Number.isFinite(nextRate) && !Number.isFinite(currentRate)) {
            return point;
        }

        if (Number.isFinite(nextRate) && Number.isFinite(currentRate) && nextRate > currentRate) {
            return point;
        }

        return currentBest;
    }, null);
};

export const buildMainChartSlots = (
    points,
    {
        minSlots = DEFAULT_MIN_SLOT_COUNT,
        maxSlots = DEFAULT_MAX_SLOT_COUNT,
    } = {},
) => {
    const normalizedPoints = Array.isArray(points) ? points.filter(Boolean) : [];
    const safeMinSlots = Math.max(0, Number(minSlots) || 0);
    const safeMaxSlots = Math.max(safeMinSlots || 1, Number(maxSlots) || DEFAULT_MAX_SLOT_COUNT);

    if (normalizedPoints.length === 0) {
        return Array.from({ length: safeMinSlots }, (_, index) => ({
            key: `slot-${index + 1}`,
            label: '',
            point: null,
        }));
    }

    const targetSlotCount = Math.min(normalizedPoints.length, safeMaxSlots);
    const groupSize = Math.max(1, Math.ceil(normalizedPoints.length / targetSlotCount));
    const summarizedSlots = [];

    for (let startIndex = 0; startIndex < normalizedPoints.length; startIndex += groupSize) {
        const groupedPoints = normalizedPoints.slice(startIndex, startIndex + groupSize);
        const representativePoint = pickRepresentativePoint(groupedPoints);
        const groupLabel = buildGroupLabel(groupedPoints, summarizedSlots.length);

        summarizedSlots.push({
            key: `slot-${summarizedSlots.length + 1}`,
            label: groupLabel,
            point: representativePoint
                ? {
                      ...representativePoint,
                      meta: {
                          ...(representativePoint?.meta || {}),
                          groupLabel,
                          groupSize: groupedPoints.length,
                          isGrouped: groupedPoints.length > 1,
                      },
                  }
                : null,
        });
    }

    const finalSlotCount = Math.max(safeMinSlots, summarizedSlots.length);

    return Array.from({ length: finalSlotCount }, (_, index) => {
        return (
            summarizedSlots[index] || {
                key: `slot-${index + 1}`,
                label: '',
                point: null,
            }
        );
    });
};

export const buildSlotLabelMap = (slots) => {
    const labelMap = new Map();

    if (!Array.isArray(slots)) {
        return labelMap;
    }

    slots.forEach((slot) => {
        labelMap.set(slot.key, slot.label || '');
    });

    return labelMap;
};
