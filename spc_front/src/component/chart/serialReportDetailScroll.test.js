import { describe, expect, it } from 'vitest';
import {
    SERIAL_REPORT_TABLE_MAX_HEIGHT,
    SERIAL_REPORT_VISIBLE_ROW_COUNT,
    resolveSerialReportScrollState,
} from './serialReportDetailScroll';

describe('serialReportDetailScroll', () => {
    it('15개 행이 보이도록 최대 높이 값을 제공한다', () => {
        expect(SERIAL_REPORT_VISIBLE_ROW_COUNT).toBe(15);
        expect(SERIAL_REPORT_TABLE_MAX_HEIGHT).toBeGreaterThan(0);
    });

    it('스크롤이 맨 위면 아래 버튼만 노출한다', () => {
        expect(
            resolveSerialReportScrollState({
                scrollTop: 0,
                clientHeight: 600,
                scrollHeight: 760,
            }),
        ).toEqual({
            canScrollUp: false,
            canScrollDown: true,
        });
    });

    it('스크롤 중간이면 위아래 버튼을 모두 노출한다', () => {
        expect(
            resolveSerialReportScrollState({
                scrollTop: 80,
                clientHeight: 600,
                scrollHeight: 760,
            }),
        ).toEqual({
            canScrollUp: true,
            canScrollDown: true,
        });
    });

    it('스크롤 끝이면 위 버튼만 노출한다', () => {
        expect(
            resolveSerialReportScrollState({
                scrollTop: 160,
                clientHeight: 600,
                scrollHeight: 760,
            }),
        ).toEqual({
            canScrollUp: true,
            canScrollDown: false,
        });
    });
});
