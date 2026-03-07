import { describe, expect, it } from 'vitest';
import { buildMainBarSeriesData, calculateChartWidthRatio } from './chartSeriesBuilder.js';

describe('chartSeriesBuilder', () => {
    it('maps bar colors and null slots', () => {
        const series = buildMainBarSeriesData(
            [
                {
                    key: 'slot-1',
                    label: 'A',
                    point: {
                        y: 12,
                        meta: {
                            label: 'A',
                        },
                    },
                },
                {
                    key: 'slot-2',
                    label: '',
                    point: null,
                },
            ],
            {
                toDisplayValue: (value) => value * 2,
                resolveStatus: () => 'stable',
                resolveColor: () => '#0f0',
            },
        );

        expect(series[0]).toEqual({
            x: 'slot-1',
            y: 24,
            fillColor: '#0f0',
            strokeColor: '#0f0',
            meta: {
                label: 'A',
                visualStatus: 'stable',
            },
        });
        expect(series[1]).toEqual({
            x: 'slot-2',
            y: null,
        });
    });

    it('never drops below one screen', () => {
        expect(calculateChartWidthRatio({ slotCount: 10, visibleCount: 35 })).toBe(1);
        expect(calculateChartWidthRatio({ slotCount: 70, visibleCount: 35 })).toBe(2);
    });
});
