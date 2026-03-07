import { beforeEach, describe, expect, it } from 'vitest';
import {
    CHART_PERF_STATE_KEY,
    clearChartPerfState,
    recordChartPerfMetric,
    setChartPerfEnabled,
    setChartPerfTestApi,
} from './chartPerfMonitor.js';

describe('chartPerfMonitor', () => {
    beforeEach(() => {
        delete window.__SPC_ENABLE_PERF__;
        delete window.__SPC_CHART_PERF__;
        delete window.__SPC_CHART_TEST_API__;
    });

    it('records metrics only when perf mode is enabled', () => {
        recordChartPerfMetric('mainReady', { durationMs: 3200 });
        expect(window[CHART_PERF_STATE_KEY]).toBeUndefined();

        setChartPerfEnabled(true);
        recordChartPerfMetric('mainReady', { durationMs: 2800, status: 'ready' });

        expect(window[CHART_PERF_STATE_KEY]).toEqual({
            metrics: {
                mainReady: {
                    durationMs: 2800,
                    status: 'ready',
                },
            },
        });
    });

    it('stores the test api next to the perf state and can reset it', () => {
        setChartPerfEnabled(true);
        setChartPerfTestApi({
            showDistribution: () => 'ok',
        });

        expect(window.__SPC_CHART_TEST_API__.showDistribution()).toBe('ok');

        clearChartPerfState();

        expect(window[CHART_PERF_STATE_KEY]).toEqual({ metrics: {} });
        expect(window.__SPC_CHART_TEST_API__).toBeUndefined();
    });
});
