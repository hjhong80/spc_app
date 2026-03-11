import { describe, expect, it } from 'vitest';
import {
    collectSerialSearchCandidates,
    findExactSerialSearchCandidate,
    normalizeSerialSearchKeyword,
} from './chartSerialSearch';

describe('chartSerialSearch', () => {
    const detailItems = [
        {
            meta: {
                serialNo: 'EM293568',
                bucketDateTime: '2025-08-29T04:55:39',
            },
        },
        {
            meta: {
                serialNo: 'EM293569',
                bucketDateTime: '2025-08-29T04:58:10',
            },
        },
        {
            meta: {
                serialNo: 'SN100100',
                bucketDateTime: '2025-08-29T05:00:00',
            },
        },
    ];

    it('입력값의양끝공백만정리한다', () => {
        expect(normalizeSerialSearchKeyword('  EM29  ')).toBe('EM29');
    });

    it('대소문자무시prefix기준으로후보를수집한다', () => {
        expect(collectSerialSearchCandidates(detailItems, 'em29')).toEqual([
            {
                serialNo: 'EM293568',
                inspDt: '2025-08-29T04:55:39',
                source: 'local',
            },
            {
                serialNo: 'EM293569',
                inspDt: '2025-08-29T04:58:10',
                source: 'local',
            },
        ]);
    });

    it('정확한serialNo후보를대소문자무시로찾는다', () => {
        const candidates = collectSerialSearchCandidates(detailItems, 'em29');

        expect(findExactSerialSearchCandidate(candidates, 'em293569')).toEqual({
            serialNo: 'EM293569',
            inspDt: '2025-08-29T04:58:10',
            source: 'local',
        });
    });
});
