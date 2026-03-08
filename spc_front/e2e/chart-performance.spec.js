import { test, expect } from '@playwright/test';

const CHART_ROUTE_STATE_STORAGE_KEY = 'spc_chart_route_state';
const API_ROUTE_BASE = '**/spc/api/spcdata/report/project/1';

const chartRouteState = {
    project: {
        projId: 1,
        projNum: 'P-001',
        projName: 'Perf Project',
    },
};

const chartStatsResponse = {
    status: 'success',
    message: 'ok',
    data: [
        {
            charId: 101,
            charNo: 'C-01',
            axis: 'X',
            nominal: 10,
            uTol: 0.5,
            lTol: -0.5,
            measuredMean: 10.02,
            measuredSigma: 0.08,
            measuredMin: 9.84,
            measuredMax: 10.21,
            sampleCount: 10000,
        },
    ],
};

const detailResponse = {
    status: 'success',
    message: 'ok',
    data: [
        {
            bucketKey: '2026-03-01',
            bucketLabel: '2026-03',
            bucketDate: '2026-03-01',
            sampleCount: 10000,
            nominal: 10,
            uTol: 0.5,
            lTol: -0.5,
            measuredMean: 10.02,
            measuredSigma: 0.08,
            measuredMin: 9.84,
            measuredMax: 10.21,
        },
    ],
};

const distributionResponse = {
    status: 'success',
    message: 'ok',
    data: {
        charId: 101,
        scale: 'month',
        baseDate: '2026-03',
        sampleCount: 10000,
        nominal: 10,
        uTol: 0.5,
        lTol: -0.5,
        measuredMean: 10.02,
        measuredSigma: 0.08,
        measuredMin: 9.84,
        measuredMax: 10.21,
        measuredValues: Array.from({ length: 512 }, (_, index) => 9.8 + index * 0.001),
    },
};

test('chart page meets production performance thresholds', async ({ page }) => {
    await page.addInitScript((state) => {
        window.__SPC_ENABLE_PERF__ = true;
        window.sessionStorage.setItem('spc_chart_route_state', JSON.stringify(state));
    }, chartRouteState);

    await page.route(`${API_ROUTE_BASE}/chart-stats`, async (route) => {
        await route.fulfill({ json: chartStatsResponse });
    });
    await page.route(`${API_ROUTE_BASE}/report-count`, async (route) => {
        await route.fulfill({ json: { status: 'success', message: 'ok', data: 42 } });
    });
    await page.route(new RegExp('.*/spc/api/spcdata/report/project/1/characteristic/101/detail.*'), async (route) => {
        await route.fulfill({ json: detailResponse });
    });
    await page.route(new RegExp('.*/spc/api/spcdata/report/project/1/characteristic/101/distribution.*'), async (route) => {
        await route.fulfill({ json: distributionResponse });
    });

    await page.goto('/chart');

    await page.waitForFunction(() => Boolean(window.__SPC_CHART_PERF__?.metrics?.mainReady));

    const mainReady = await page.evaluate(() => window.__SPC_CHART_PERF__.metrics.mainReady);
    expect(mainReady.durationMs).toBeLessThanOrEqual(3000);

    const detailSelected = await page.evaluate(
        () => window.__SPC_CHART_TEST_API__.selectCharacteristicByCharId(101),
    );
    expect(detailSelected).toBe(true);
    await page.waitForFunction(
        () => window.__SPC_CHART_TEST_API__.getState().activeChartView === 'detail',
    );
    await page.waitForFunction(() => Boolean(window.__SPC_CHART_PERF__?.metrics?.detailReady));

    const detailReady = await page.evaluate(() => window.__SPC_CHART_PERF__.metrics.detailReady);
    expect(detailReady.durationMs).toBeLessThanOrEqual(2000);

    const distributionShown = await page.evaluate(
        () => window.__SPC_CHART_TEST_API__.showDistribution(),
    );
    expect(distributionShown).toBe(true);
    await page.waitForFunction(() => Boolean(window.__SPC_CHART_PERF__?.metrics?.detailDistribution));

    const detailDistribution = await page.evaluate(
        () => window.__SPC_CHART_PERF__.metrics.detailDistribution,
    );
    expect(detailDistribution.durationMs).toBeLessThanOrEqual(3000);

    await page.evaluate(() => window.__SPC_CHART_TEST_API__.showBase());
    await page.evaluate(() => window.__SPC_CHART_TEST_API__.showDistribution());
    await page.waitForFunction(() => Boolean(window.__SPC_CHART_PERF__?.metrics?.detailDistributionCached));

    const detailDistributionCached = await page.evaluate(
        () => window.__SPC_CHART_PERF__.metrics.detailDistributionCached,
    );
    expect(detailDistributionCached.durationMs).toBeLessThanOrEqual(1200);
});
