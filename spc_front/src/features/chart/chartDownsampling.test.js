import { describe, expect, it } from 'vitest';
import { buildMainChartSlots } from './chartDownsampling.js';

const createPoint = (index, defectRatePercent) => ({
    x: `C-${index}`,
    y: defectRatePercent,
    meta: {
        label: `C-${index}`,
        defectRatePercent,
        count: index,
    },
});

describe('buildMainChartSlots', () => {
    it('pads up to the minimum slot count for small datasets', () => {
        const slots = buildMainChartSlots([createPoint(1, 5), createPoint(2, 10)], {
            minSlots: 5,
            maxSlots: 10,
        });

        expect(slots).toHaveLength(5);
        expect(slots[0].label).toBe('C-1');
        expect(slots[1].label).toBe('C-2');
        expect(slots[2].point).toBeNull();
    });

    it('compresses large datasets into ranged slots', () => {
        const points = Array.from({ length: 12 }, (_, index) =>
            createPoint(index + 1, index === 2 ? 99 : index + 1),
        );

        const slots = buildMainChartSlots(points, {
            minSlots: 4,
            maxSlots: 4,
        });

        expect(slots).toHaveLength(4);
        expect(slots[0].label).toBe('C-1 ~ C-3');
        expect(slots[0].point.meta.groupSize).toBe(3);
        expect(slots[0].point.meta.groupLabel).toBe('C-1 ~ C-3');
        expect(slots[0].point.meta.label).toBe('C-3');
        expect(slots[0].point.meta.defectRatePercent).toBe(99);
    });
});
