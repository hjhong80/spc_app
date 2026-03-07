import { describe, expect, it } from 'vitest';
import {
    buildDetailDistributionPerfPayload,
    formatDetailDistributionPerfSummary,
} from './detailDistributionPerf.js';

describe('detailDistributionPerf', () => {
    it('formats a compact summary for the last measurement', () => {
        expect(
            formatDetailDistributionPerfSummary({
                durationMs: 842.4,
                responseCacheStatus: 'hit',
                computationCacheStatus: 'miss',
            }),
        ).toBe('정규분포 842ms · resp hit · compute miss');
    });

    it('builds a console payload with rounded duration and context', () => {
        expect(
            buildDetailDistributionPerfPayload({
                durationMs: 1204.8,
                responseCacheStatus: 'miss',
                computationCacheStatus: 'hit',
                charId: 11,
                scale: 'day',
                baseDate: '2026-03-07',
            }),
        ).toEqual({
            durationMs: 1205,
            responseCacheStatus: 'miss',
            computationCacheStatus: 'hit',
            charId: 11,
            scale: 'day',
            baseDate: '2026-03-07',
        });
    });
});
