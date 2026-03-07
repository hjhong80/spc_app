import { describe, expect, it } from 'vitest';
import {
    buildDetailDistributionCacheKey,
    buildDetailDistributionComputationCacheKey,
    upsertBoundedCacheEntry,
} from './detailDistributionCache.js';

describe('detailDistributionCache', () => {
    it('builds a stable response cache key from characteristic and period inputs', () => {
        expect(
            buildDetailDistributionCacheKey({
                charId: 12,
                scale: 'day',
                baseDate: '2026-03-07',
            }),
        ).toBe('12::day::2026-03-07');
    });

    it('separates computation cache keys by curve and point modes', () => {
        const responseKey = buildDetailDistributionCacheKey({
            charId: 5,
            scale: 'month',
            baseDate: '2026-03',
        });

        expect(
            buildDetailDistributionComputationCacheKey({
                responseKey,
                curveMode: 'single-sided',
                pointMode: 'rug',
            }),
        ).toBe('5::month::2026-03::single-sided::rug');

        expect(
            buildDetailDistributionComputationCacheKey({
                responseKey,
                curveMode: 'asymmetric',
                pointMode: 'curve',
            }),
        ).toBe('5::month::2026-03::asymmetric::curve');
    });

    it('evicts the oldest cache entry when a bounded cache exceeds max size', () => {
        const cache = new Map([
            ['first', { value: 1 }],
            ['second', { value: 2 }],
        ]);

        upsertBoundedCacheEntry(cache, 'third', { value: 3 }, 2);

        expect(Array.from(cache.keys())).toEqual(['second', 'third']);
        expect(cache.get('third')).toEqual({ value: 3 });
    });
});
