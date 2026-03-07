export const CHART_PERF_FLAG_KEY = '__SPC_ENABLE_PERF__';
export const CHART_PERF_STATE_KEY = '__SPC_CHART_PERF__';
export const CHART_PERF_TEST_API_KEY = '__SPC_CHART_TEST_API__';

const roundDuration = (durationMs) => Math.max(0, Math.round(Number(durationMs) || 0));

const isBrowser = () => typeof window !== 'undefined';

export const isChartPerfEnabled = () =>
    isBrowser() && window[CHART_PERF_FLAG_KEY] === true;

export const setChartPerfEnabled = (enabled) => {
    if (!isBrowser()) {
        return;
    }

    window[CHART_PERF_FLAG_KEY] = Boolean(enabled);
    if (enabled) {
        if (!window[CHART_PERF_STATE_KEY]) {
            window[CHART_PERF_STATE_KEY] = { metrics: {} };
        }
        return;
    }

    delete window[CHART_PERF_STATE_KEY];
    delete window[CHART_PERF_TEST_API_KEY];
};

const ensureChartPerfState = () => {
    if (!isChartPerfEnabled()) {
        return null;
    }

    const current = window[CHART_PERF_STATE_KEY];
    if (current && typeof current === 'object' && current.metrics && typeof current.metrics === 'object') {
        return current;
    }

    const nextState = { metrics: {} };
    window[CHART_PERF_STATE_KEY] = nextState;
    return nextState;
};

export const clearChartPerfTestApi = () => {
    if (!isBrowser()) {
        return;
    }
    delete window[CHART_PERF_TEST_API_KEY];
};

export const clearChartPerfState = () => {
    if (!isBrowser()) {
        return;
    }

    if (isChartPerfEnabled()) {
        window[CHART_PERF_STATE_KEY] = { metrics: {} };
    } else {
        delete window[CHART_PERF_STATE_KEY];
    }

    clearChartPerfTestApi();
};

export const recordChartPerfMetric = (metricKey, payload = {}) => {
    if (!metricKey) {
        return null;
    }

    const state = ensureChartPerfState();
    if (!state) {
        return null;
    }

    const nextMetric = {
        ...payload,
        durationMs: roundDuration(payload.durationMs),
    };
    state.metrics[metricKey] = nextMetric;
    return nextMetric;
};

export const setChartPerfTestApi = (api) => {
    if (!isChartPerfEnabled()) {
        return;
    }
    window[CHART_PERF_TEST_API_KEY] = api;
};
