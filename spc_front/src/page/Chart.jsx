import React, {
    startTransition,
    useCallback,
    useDeferredValue,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Alert,
    Badge,
    Box,
    Chip,
    IconButton,
    Popover,
    Snackbar,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useLocation, useNavigate } from 'react-router-dom';
import DetailCharacteristicChart from '../component/chart/DetailCharacteristicChart';
import MainCharacteristicChart from '../component/chart/MainCharacteristicChart';
import ChartFloatingNotification from '../component/chart/ChartFloatingNotification';
import { customInstance } from '../apis/custom-instance';
import { navigateBackOrFallback } from '../utils/navigation';
import {
    formatDateTimeLabel,
    formatCompactDateLabel,
    formatCompactDateTimeLabel,
    toInputDateValue,
    toInputMonthValue,
} from '../utils/chartDate';
import UnifiedHeaderBar from '../component/common/UnifiedHeaderBar';
import { buildMainChartSlots, buildSlotLabelMap } from '../features/chart/chartDownsampling';
import { buildMainBarSeriesData, calculateChartWidthRatio } from '../features/chart/chartSeriesBuilder';
import {
    buildDetailDistributionCacheKey,
    buildDetailDistributionComputationCacheKey,
    upsertBoundedCacheEntry,
} from '../features/chart/detailDistributionCache';
import {
    buildDetailDistributionPerfPayload,
    formatDetailDistributionPerfSummary,
} from '../features/chart/detailDistributionPerf';
import {
    clearChartPerfState,
    clearChartPerfTestApi,
    isChartPerfEnabled,
    recordChartPerfMetric,
    setChartPerfTestApi,
} from '../features/chart/chartPerfMonitor';
import {
    appendChartNotification,
    CHART_NOTIFICATION_SEVERITY,
    createChartNotification,
    getChartNotificationAlertSurfaceStyle,
    getChartNotificationAutoHideDuration,
    getChartNotificationContextKey,
    getHighestChartNotificationSeverity,
    shouldResetChartNotificationsForContextChange,
    shouldUseFloatingChartNotification,
} from './chartNotifications';

const SIGMA_MULTIPLIER = 2;
const Y_AXIS_LINEAR_PERCENT_LIMIT = 100;
const Y_AXIS_MARGIN_PERCENT_POINTS = 25;
const Y_AXIS_DISPLAY_STEP = 50;
const Y_AXIS_LOG_DISPLAY_LIMIT = 200;
const DEFAULT_VISIBLE_CANDLE_COUNT = 35;
const DEFAULT_DETAIL_VISIBLE_POINT_COUNT = DEFAULT_VISIBLE_CANDLE_COUNT;
const DEFAULT_CHARACTERISTIC_COUNT = 24;
const DEFAULT_MEASUREMENT_COUNT = 24;
const CPK_STABLE_THRESHOLD = 1.33;
const SIGMA_LEVEL_PER_CPK = 3;
const CANDLE_COLOR_DEFECT = '#ff335f';
const CANDLE_COLOR_STABLE = '#6f9d7e';
const CANDLE_COLOR_RISK = '#c98a4a';
const DETAIL_SCALE_MONTH = 'month';
const DETAIL_SCALE_DAY = 'day';
const DETAIL_VISUAL_BASE = 'base';
const DETAIL_VISUAL_DISTRIBUTION = 'distribution';
const DISTRIBUTION_POINT_CURVE = 'curve';
const DISTRIBUTION_POINT_RUG = 'rug';
const DEFAULT_DISTRIBUTION_POINT_MODE = DISTRIBUTION_POINT_RUG;
const DISTRIBUTION_CURVE_SINGLE_SIDED = 'single-sided';
const DISTRIBUTION_CURVE_ASYMMETRIC = 'asymmetric';
const DEFAULT_DISTRIBUTION_CURVE_MODE = DISTRIBUTION_CURVE_SINGLE_SIDED;
const DETAIL_DISTRIBUTION_RESPONSE_CACHE_MAX = 12;
const DETAIL_DISTRIBUTION_COMPUTATION_CACHE_MAX = 24;
const CHART_ROUTE_STATE_STORAGE_KEY = 'spc_chart_route_state';
const IS_DEV_MODE = import.meta.env.DEV;
const MAIN_CHART_AXIS_MIN = -1;
const MAIN_CHART_AXIS_MAX = 7;
const MAIN_CHART_AXIS_STEP = 1;
const MAIN_CHART_MIN_CPK = 0;
const MAIN_CHART_MAX_CPK = 2;
const DETAIL_AXIS_HEADROOM_RATIO = 0.1;
const INFO_MESSAGE =
    '메인 차트는 Cpk를 3×Cpk 시그마 수준으로 변환한 뒤 정규분포 기반 불량률로 환산한 막대로 표시합니다. 메인 Y축은 하단 여백 1칸과 0% / 6σ / 5σ / 4σ / 3σ / 2σ / 1σ / 100% 고정 눈금을 사용하며, Cpk>=2는 0%, Cpk<=0은 100%로 클램프합니다. 세부 차트는 기존 평균 ±2σ 캔들 및 min/max 꼬리를 유지합니다.';
const toFiniteNumber = (value) => {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'string' && value.trim() === '') {
        return null;
    }

    const next = Number(value);
    return Number.isFinite(next) ? next : null;
};

const formatNumber = (value, digits = 4) => {
    const next = toFiniteNumber(value);
    if (next === null) {
        return '-';
    }
    return next.toFixed(digits);
};

const formatPercent = (value, digits = 1) => {
    const next = toFiniteNumber(value);
    if (next === null) {
        return '-';
    }
    return `${next.toFixed(digits)}%`;
};

const formatPpm = (defectRatePercentRaw) => {
    const defectRatePercent = toFiniteNumber(defectRatePercentRaw);
    if (defectRatePercent === null) {
        return '-';
    }
    const ppm = defectRatePercent * 10000;
    if (ppm >= 1) {
        return String(Math.round(ppm));
    }
    return ppm.toFixed(3);
};

const resolveSpecificationLimits = (nominalRaw, uTolRaw, lTolRaw) => {
    const nominal = toFiniteNumber(nominalRaw);
    const uTol = toFiniteNumber(uTolRaw);
    const lTol = toFiniteNumber(lTolRaw);

    if (nominal === null) {
        return {
            nominal: null,
            usl: null,
            lsl: null,
        };
    }

    return {
        nominal,
        usl: uTol === null ? null : nominal + uTol,
        lsl: lTol === null ? null : nominal + lTol,
    };
};

const calculateCpk = (meanRaw, sigmaRaw, uslRaw, lslRaw) => {
    const mean = toFiniteNumber(meanRaw);
    const sigma = toFiniteNumber(sigmaRaw);
    const usl = toFiniteNumber(uslRaw);
    const lsl = toFiniteNumber(lslRaw);

    if (mean === null || sigma === null || sigma <= 0) {
        return null;
    }

    const cpu = usl === null ? null : (usl - mean) / (3 * sigma);
    const cpl = lsl === null ? null : (mean - lsl) / (3 * sigma);

    if (cpu === null && cpl === null) {
        return null;
    }
    if (cpu === null) {
        return cpl;
    }
    if (cpl === null) {
        return cpu;
    }

    return Math.min(cpu, cpl);
};

const isOutOfSpecRange = (minRaw, maxRaw, uslRaw, lslRaw) => {
    const min = toFiniteNumber(minRaw);
    const max = toFiniteNumber(maxRaw);
    const usl = toFiniteNumber(uslRaw);
    const lsl = toFiniteNumber(lslRaw);

    if (min === null || max === null) {
        return false;
    }

    if (usl !== null && max > usl) {
        return true;
    }

    if (lsl !== null && min < lsl) {
        return true;
    }

    return false;
};

const resolveCandleVisualStatus = (meta) => {
    if (meta?.isOutOfSpec) {
        return 'defect';
    }

    const cpk = toFiniteNumber(meta?.cpk);
    if (cpk !== null && cpk >= CPK_STABLE_THRESHOLD) {
        return 'stable';
    }

    return 'risk';
};

const resolveCandleColorByStatus = (status) => {
    if (status === 'defect') {
        return CANDLE_COLOR_DEFECT;
    }
    if (status === 'stable') {
        return CANDLE_COLOR_STABLE;
    }
    return CANDLE_COLOR_RISK;
};

const DISPLAY_ANCHORS = [0, 50, 100, 150, 200];

const mapByAnchors = (value, fromAnchors, toAnchors) => {
    if (!Array.isArray(fromAnchors) || !Array.isArray(toAnchors)) {
        return value;
    }
    if (fromAnchors.length !== toAnchors.length || fromAnchors.length < 2) {
        return value;
    }

    if (value <= fromAnchors[0]) {
        return toAnchors[0];
    }

    const lastIndex = fromAnchors.length - 1;
    if (value >= fromAnchors[lastIndex]) {
        return toAnchors[lastIndex];
    }

    for (let index = 0; index < lastIndex; index += 1) {
        const fromMin = fromAnchors[index];
        const fromMax = fromAnchors[index + 1];
        if (value < fromMin || value > fromMax) {
            continue;
        }

        const toMin = toAnchors[index];
        const toMax = toAnchors[index + 1];
        const ratio = fromMax === fromMin ? 0 : (value - fromMin) / (fromMax - fromMin);
        return toMin + (toMax - toMin) * ratio;
    }

    return value;
};

const cumulativeStandardNormal = (zRaw) => {
    const zValue = toFiniteNumber(zRaw);
    if (zValue === null) {
        return null;
    }

    const x = Math.abs(zValue);
    const t = 1 / (1 + 0.2316419 * x);
    const density = 0.3989422804014327 * Math.exp(-0.5 * x * x);
    const polynomial =
        (((((1.330274429 * t) - 1.821255978) * t + 1.781477937) * t - 0.356563782) *
            t +
            0.31938153) *
        t;
    const probability = 1 - density * polynomial;
    return zValue >= 0 ? probability : 1 - probability;
};

const calculateGoodRatePercentFromSigmaLevel = (sigmaLevelRaw) => {
    const sigmaLevel = toFiniteNumber(sigmaLevelRaw);
    if (sigmaLevel === null) {
        return 0;
    }

    const cpk = sigmaLevel / SIGMA_LEVEL_PER_CPK;
    if (cpk <= MAIN_CHART_MIN_CPK) {
        return 0;
    }

    const cdf = cumulativeStandardNormal(sigmaLevel);
    if (cdf === null) {
        return 0;
    }

    return Math.min(100, Math.max(0, (2 * cdf - 1) * 100));
};

const calculateDefectRatePercentFromGoodRate = (goodRatePercentRaw) => {
    const goodRatePercent = toFiniteNumber(goodRatePercentRaw);
    if (goodRatePercent === null) {
        return 100;
    }
    return Math.min(100, Math.max(0, 100 - goodRatePercent));
};

const MAIN_CHART_SIGMA_LEVEL_TICKS = [6, 5, 4, 3, 2, 1];
const MAIN_CHART_DEFECT_RATE_ANCHORS = [
    0,
    ...MAIN_CHART_SIGMA_LEVEL_TICKS.map((sigmaLevel) =>
        calculateDefectRatePercentFromGoodRate(
            calculateGoodRatePercentFromSigmaLevel(sigmaLevel),
        ),
    ),
    100,
];
const MAIN_CHART_DISPLAY_ANCHORS = [0, 1, 2, 3, 4, 5, 6, 7];

const toMainChartDisplayValue = (defectRatePercentRaw) => {
    const defectRatePercent = toFiniteNumber(defectRatePercentRaw);
    if (defectRatePercent === null) {
        return MAIN_CHART_AXIS_MAX;
    }

    const clampedRate = Math.min(100, Math.max(0, defectRatePercent));
    return mapByAnchors(
        clampedRate,
        MAIN_CHART_DEFECT_RATE_ANCHORS,
        MAIN_CHART_DISPLAY_ANCHORS,
    );
};

const formatMainChartYAxisLabel = (valueRaw) => {
    const value = toFiniteNumber(valueRaw);
    if (value === null) {
        return '';
    }

    const rounded = Math.round(value);
    if (Math.abs(value - rounded) > 0.001) {
        return '';
    }

    if (rounded === 0) {
        return '0%';
    }
    if (rounded >= 1 && rounded <= 6) {
        return `${7 - rounded}σ`;
    }
    if (rounded === 7) {
        return '100%';
    }
    return '';
};

const formatMainChartExpectedDefectRateTooltip = (labelRaw) => {
    if (typeof labelRaw !== 'string') {
        return '';
    }

    const label = labelRaw.trim();
    if (!label) {
        return '';
    }

    let defectRatePercent = null;

    if (label === '0%') {
        defectRatePercent = 0;
    } else if (label === '100%') {
        defectRatePercent = 100;
    } else {
        const sigmaMatch = label.match(/^([1-6])σ$/);
        if (sigmaMatch) {
            const sigmaLevel = Number(sigmaMatch[1]);
            defectRatePercent = calculateDefectRatePercentFromGoodRate(
                calculateGoodRatePercentFromSigmaLevel(sigmaLevel),
            );
        }
    }

    if (!Number.isFinite(defectRatePercent)) {
        return '';
    }

    return `예상 불량률: ${formatPpm(defectRatePercent)} PPM`;
};

const resolveCapabilityMetrics = ({
    meanRaw,
    sigmaRaw,
    nominalRaw,
    uTolRaw,
    lTolRaw,
    uslRaw,
    lslRaw,
    cpkRaw,
    sigmaLevelRaw,
    goodRatePercentRaw,
    defectRatePercentRaw,
}) => {
    const mean = toFiniteNumber(meanRaw);
    const sigma = toFiniteNumber(sigmaRaw);
    const nominal = toFiniteNumber(nominalRaw);
    const uTol = toFiniteNumber(uTolRaw);
    const lTol = toFiniteNumber(lTolRaw);
    const fallbackLimits = resolveSpecificationLimits(nominal, uTol, lTol);
    const usl = toFiniteNumber(uslRaw) ?? fallbackLimits.usl;
    const lsl = toFiniteNumber(lslRaw) ?? fallbackLimits.lsl;
    const cpk = toFiniteNumber(cpkRaw) ?? calculateCpk(mean, sigma, usl, lsl);
    const sigmaLevel =
        toFiniteNumber(sigmaLevelRaw) ??
        (cpk === null ? null : cpk * SIGMA_LEVEL_PER_CPK);

    let goodRatePercent = toFiniteNumber(goodRatePercentRaw);
    let defectRatePercent = toFiniteNumber(defectRatePercentRaw);

    if (goodRatePercent === null || defectRatePercent === null) {
        if (cpk === null || cpk <= MAIN_CHART_MIN_CPK) {
            goodRatePercent = 0;
            defectRatePercent = 100;
        } else if (cpk >= MAIN_CHART_MAX_CPK) {
            goodRatePercent = 100;
            defectRatePercent = 0;
        } else {
            goodRatePercent = calculateGoodRatePercentFromSigmaLevel(sigmaLevel);
            defectRatePercent = calculateDefectRatePercentFromGoodRate(goodRatePercent);
        }
    }

    return {
        usl,
        lsl,
        cpk,
        sigmaLevel,
        goodRatePercent,
        defectRatePercent,
    };
};

const resolveDetailAxisSpec = (items) => {
    const normalizedItems = Array.isArray(items) ? items : [];

    for (const item of normalizedItems) {
        const nominal = toFiniteNumber(item?.nominal);
        const uTol = toFiniteNumber(item?.uTol);
        const lTol = toFiniteNumber(item?.lTol);
        const { usl, lsl } = resolveSpecificationLimits(nominal, uTol, lTol);

        if (usl !== null && lsl !== null && usl > lsl) {
            return {
                centerRaw: (usl + lsl) / 2,
                uslRaw: usl,
                lslRaw: lsl,
            };
        }
    }

    const firstNominal = normalizedItems
        .map((item) => toFiniteNumber(item?.nominal))
        .find((value) => value !== null);

    if (firstNominal !== undefined) {
        return {
            centerRaw: firstNominal,
            uslRaw: firstNominal + 1,
            lslRaw: firstNominal - 1,
        };
    }

    return {
        centerRaw: 0,
        uslRaw: 1,
        lslRaw: -1,
    };
};

const buildDetailAxisScale = (rawValues, axisSpecRaw) => {
    const normalizedValues = Array.isArray(rawValues)
        ? rawValues.map(toFiniteNumber).filter((value) => value !== null)
        : [];
    const centerRaw = toFiniteNumber(axisSpecRaw?.centerRaw) ?? 0;
    const uslRaw = toFiniteNumber(axisSpecRaw?.uslRaw);
    const lslRaw = toFiniteNumber(axisSpecRaw?.lslRaw);

    const positiveInnerMagnitude = Math.max(
        1e-9,
        (uslRaw ?? centerRaw + 1) - centerRaw,
    );
    const negativeInnerMagnitude = Math.max(
        1e-9,
        centerRaw - (lslRaw ?? centerRaw - 1),
    );

    const observedMax = Math.max(
        centerRaw,
        uslRaw ?? centerRaw + positiveInnerMagnitude,
        ...normalizedValues,
    );
    const observedMin = Math.min(
        centerRaw,
        lslRaw ?? centerRaw - negativeInnerMagnitude,
        ...normalizedValues,
    );

    const positiveObservedLimitRaw = Math.max(
        observedMax,
        uslRaw ?? centerRaw + positiveInnerMagnitude,
    );
    const negativeObservedLimitRaw = Math.min(
        observedMin,
        lslRaw ?? centerRaw - negativeInnerMagnitude,
    );
    const positiveHeadroom =
        Math.max(positiveObservedLimitRaw - centerRaw, positiveInnerMagnitude) *
        DETAIL_AXIS_HEADROOM_RATIO;
    const negativeHeadroom =
        Math.max(centerRaw - negativeObservedLimitRaw, negativeInnerMagnitude) *
        DETAIL_AXIS_HEADROOM_RATIO;
    const positiveTailLimitRaw = positiveObservedLimitRaw + positiveHeadroom;
    const negativeTailLimitRaw = negativeObservedLimitRaw - negativeHeadroom;

    const toDisplayValue = (valueRaw) => {
        const value = toFiniteNumber(valueRaw);
        if (value === null) {
            return null;
        }

        if (value >= centerRaw) {
            if (uslRaw === null || value <= uslRaw) {
                return ((value - centerRaw) / positiveInnerMagnitude) * 100;
            }

            if (positiveTailLimitRaw <= uslRaw) {
                return 100;
            }

            const normalized = Math.min(
                1,
                Math.max(0, (value - uslRaw) / (positiveTailLimitRaw - uslRaw)),
            );
            return 100 + Math.log10(1 + 9 * normalized) * 100;
        }

        if (lslRaw === null || value >= lslRaw) {
            return -((centerRaw - value) / negativeInnerMagnitude) * 100;
        }

        if (negativeTailLimitRaw >= lslRaw) {
            return -100;
        }

        const normalized = Math.min(
            1,
            Math.max(0, (lslRaw - value) / (lslRaw - negativeTailLimitRaw)),
        );
        return -(100 + Math.log10(1 + 9 * normalized) * 100);
    };

    const toRawValue = (displayRaw) => {
        const display = toFiniteNumber(displayRaw);
        if (display === null) {
            return null;
        }

        if (display >= 0) {
            if (display <= 100 || uslRaw === null) {
                return centerRaw + (display / 100) * positiveInnerMagnitude;
            }

            if (positiveTailLimitRaw <= uslRaw) {
                return uslRaw;
            }

            const compressedRatio = Math.min(1, Math.max(0, (display - 100) / 100));
            const rawRatio = (10 ** compressedRatio - 1) / 9;
            return uslRaw + rawRatio * (positiveTailLimitRaw - uslRaw);
        }

        if (display >= -100 || lslRaw === null) {
            return centerRaw - (Math.abs(display) / 100) * negativeInnerMagnitude;
        }

        if (negativeTailLimitRaw >= lslRaw) {
            return lslRaw;
        }

        const compressedRatio = Math.min(1, Math.max(0, (Math.abs(display) - 100) / 100));
        const rawRatio = (10 ** compressedRatio - 1) / 9;
        return lslRaw - rawRatio * (lslRaw - negativeTailLimitRaw);
    };

    return {
        minDisplay: -Y_AXIS_LOG_DISPLAY_LIMIT,
        maxDisplay: Y_AXIS_LOG_DISPLAY_LIMIT,
        stepSize: Y_AXIS_DISPLAY_STEP,
        centerRaw,
        uslRaw: uslRaw ?? centerRaw + positiveInnerMagnitude,
        lslRaw: lslRaw ?? centerRaw - negativeInnerMagnitude,
        toDisplayValue,
        toRawValue,
    };
};

const resolveDetailDefaultVisualMode = (scale) =>
    scale === DETAIL_SCALE_DAY ? DETAIL_VISUAL_DISTRIBUTION : DETAIL_VISUAL_BASE;

const isOneSidedUpperToleranceCase = (nominalRaw, uTolRaw, lTolRaw) => {
    const nominal = toFiniteNumber(nominalRaw);
    const uTol = toFiniteNumber(uTolRaw);
    const lTol = toFiniteNumber(lTolRaw);

    return nominal === 0 && lTol === 0 && uTol !== null && uTol > 0;
};

const hasNegativeMeasuredNoise = (measuredValuesRaw) =>
    Array.isArray(measuredValuesRaw) &&
    measuredValuesRaw.some((value) => {
        const nextValue = toFiniteNumber(value);
        return nextValue !== null && nextValue < 0;
    });

const toDistributionDisplayMagnitude = (magnitude, toleranceMagnitude, maxMagnitude) => {
    if (!Number.isFinite(magnitude) || magnitude <= 0) {
        return 0;
    }
    if (!Number.isFinite(toleranceMagnitude) || toleranceMagnitude <= 0) {
        return null;
    }

    if (magnitude <= toleranceMagnitude) {
        return (magnitude / toleranceMagnitude) * 6;
    }

    const clampedMax = Math.max(maxMagnitude ?? toleranceMagnitude, toleranceMagnitude);
    if (clampedMax <= toleranceMagnitude) {
        return 6;
    }

    const normalized = Math.min(
        1,
        Math.max(0, (magnitude - toleranceMagnitude) / (clampedMax - toleranceMagnitude)),
    );
    return 6 + Math.log10(1 + 9 * normalized) * 2;
};

const toDistributionRawMagnitude = (displayMagnitude, toleranceMagnitude, maxMagnitude) => {
    if (!Number.isFinite(displayMagnitude) || displayMagnitude <= 0) {
        return 0;
    }
    if (!Number.isFinite(toleranceMagnitude) || toleranceMagnitude <= 0) {
        return null;
    }

    if (displayMagnitude <= 6) {
        return (displayMagnitude / 6) * toleranceMagnitude;
    }

    const clampedMax = Math.max(maxMagnitude ?? toleranceMagnitude, toleranceMagnitude);
    if (clampedMax <= toleranceMagnitude) {
        return toleranceMagnitude;
    }

    const compressedRatio = Math.min(1, Math.max(0, (displayMagnitude - 6) / 2));
    const rawRatio = (10 ** compressedRatio - 1) / 9;
    return toleranceMagnitude + rawRatio * (clampedMax - toleranceMagnitude);
};

const buildDistributionAxisScale = (measuredValues, nominalRaw, uTolRaw, lTolRaw) => {
    const nominal = toFiniteNumber(nominalRaw);
    const { usl, lsl } = resolveSpecificationLimits(nominalRaw, uTolRaw, lTolRaw);
    const centerRaw =
        Number.isFinite(usl) && Number.isFinite(lsl) ? (usl + lsl) / 2 : nominal;
    const halfTolerance =
        Number.isFinite(usl) && Number.isFinite(lsl) ? Math.abs(usl - lsl) / 2 : null;
    const normalizedValues = Array.isArray(measuredValues)
        ? measuredValues.map(toFiniteNumber).filter((value) => value !== null)
        : [];

    const positiveRawMagnitudes = normalizedValues
        .map((value) => value - centerRaw)
        .filter((value) => Number.isFinite(value) && value > 0)
        .map((value) => Math.abs(value));
    const negativeRawMagnitudes = normalizedValues
        .map((value) => centerRaw - value)
        .filter((value) => Number.isFinite(value) && value > 0)
        .map((value) => Math.abs(value));

    const positiveMaxMagnitude = Math.max(
        halfTolerance ?? 0,
        ...positiveRawMagnitudes,
    );
    const negativeMaxMagnitude = Math.max(
        halfTolerance ?? 0,
        ...negativeRawMagnitudes,
    );

    return {
        nominal,
        centerRaw,
        usl,
        lsl,
        minDisplay: -8,
        maxDisplay: 8,
        upperTolerance: halfTolerance,
        lowerTolerance: halfTolerance,
        upperMaxMagnitude: positiveMaxMagnitude,
        lowerMaxMagnitude: negativeMaxMagnitude,
        toDisplayValue: (valueRaw) => {
            const value = toFiniteNumber(valueRaw);
            if (value === null || centerRaw === null) {
                return null;
            }

            const delta = value - centerRaw;
            const magnitude = Math.abs(delta);
            if (magnitude === 0) {
                return 0;
            }

            const isPositive = delta >= 0;
            const toleranceMagnitude = halfTolerance;
            const maxMagnitude = isPositive ? positiveMaxMagnitude : negativeMaxMagnitude;
            const displayMagnitude = toDistributionDisplayMagnitude(
                magnitude,
                toleranceMagnitude,
                maxMagnitude,
            );
            if (displayMagnitude === null) {
                return null;
            }
            return isPositive ? displayMagnitude : -displayMagnitude;
        },
        toRawValue: (displayRaw) => {
            const display = toFiniteNumber(displayRaw);
            if (display === null || centerRaw === null) {
                return null;
            }

            const magnitude = Math.abs(display);
            if (magnitude === 0) {
                return centerRaw;
            }

            const isPositive = display >= 0;
            const toleranceMagnitude = halfTolerance;
            const maxMagnitude = isPositive ? positiveMaxMagnitude : negativeMaxMagnitude;
            const rawMagnitude = toDistributionRawMagnitude(
                magnitude,
                toleranceMagnitude,
                maxMagnitude,
            );
            if (rawMagnitude === null) {
                return null;
            }

            return centerRaw + (isPositive ? rawMagnitude : -rawMagnitude);
        },
    };
};

const formatDistributionAxisLabel = (displayRaw, axisScale) => {
    const display = toFiniteNumber(displayRaw);
    if (display === null || !axisScale) {
        return '';
    }

    const rounded = Math.round(display);
    if (Math.abs(display - rounded) > 0.001) {
        return '';
    }

    if (rounded === 0) {
        return formatNumber(axisScale?.centerRaw, 3);
    }

    const rawValue = axisScale.toRawValue(rounded);
    return rawValue === null ? '' : formatNumber(rawValue, 3);
};

const resolveDistributionSigma = (sigmaRaw, axisScale) => {
    const sigma = toFiniteNumber(sigmaRaw);
    if (sigma !== null && sigma > 0) {
        return sigma;
    }

    const fallbackTolerance =
        axisScale?.upperTolerance ?? axisScale?.lowerTolerance ?? 1;
    return Math.max(fallbackTolerance / 6, 0.0001);
};

const resolveMeasuredDistributionValues = (distributionMeta) =>
    Array.isArray(distributionMeta?.measuredValues)
        ? distributionMeta.measuredValues.map(toFiniteNumber).filter((value) => value !== null)
        : [];

const calculateGaussianDensity = (value, mean, sigma) => {
    if (!Number.isFinite(value) || !Number.isFinite(mean) || !Number.isFinite(sigma) || sigma <= 0) {
        return 0;
    }

    const exponent = -((value - mean) ** 2) / (2 * sigma * sigma);
    return Math.exp(exponent);
};

const calculateQuantile = (sortedValues, ratio) => {
    if (!Array.isArray(sortedValues) || sortedValues.length === 0) {
        return null;
    }

    const index = (sortedValues.length - 1) * ratio;
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);
    const lower = sortedValues[lowerIndex];
    const upper = sortedValues[upperIndex];

    if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
        return null;
    }

    if (lowerIndex === upperIndex) {
        return lower;
    }

    return lower + (upper - lower) * (index - lowerIndex);
};

const resolveDistributionBandwidth = (distributionMeta, axisScale) => {
    const measuredValues = resolveMeasuredDistributionValues(distributionMeta);
    const fallbackSigma = resolveDistributionSigma(distributionMeta?.measuredSigma, axisScale);

    if (measuredValues.length < 2) {
        return fallbackSigma;
    }

    const sortedValues = [...measuredValues].sort((left, right) => left - right);
    const q1 = calculateQuantile(sortedValues, 0.25);
    const q3 = calculateQuantile(sortedValues, 0.75);
    const iqr = q1 === null || q3 === null ? null : q3 - q1;
    const robustSigma = iqr !== null && iqr > 0 ? iqr / 1.34 : null;
    const scaleCandidates = [fallbackSigma, robustSigma].filter(
        (value) => Number.isFinite(value) && value > 0,
    );
    const scale = scaleCandidates.length > 0 ? Math.min(...scaleCandidates) : fallbackSigma;
    const silvermanBandwidth = 0.9 * scale * Math.pow(measuredValues.length, -0.2);

    return Math.max(silvermanBandwidth || fallbackSigma, 0.0001);
};

const calculateKdeDensity = (value, measuredValues, bandwidth) => {
    if (!Number.isFinite(value) || !Array.isArray(measuredValues) || measuredValues.length === 0) {
        return 0;
    }

    const safeBandwidth = Math.max(toFiniteNumber(bandwidth) ?? 0, 0.0001);

    return (
        measuredValues.reduce((sum, sample) => {
            if (!Number.isFinite(sample)) {
                return sum;
            }

            const normalized = (value - sample) / safeBandwidth;
            return sum + Math.exp(-0.5 * normalized * normalized);
        }, 0) / measuredValues.length
    );
};

const buildDistributionCurveData = (
    distributionMeta,
    axisScale,
    isOneSidedUpperTolerance = false,
    curveMode = DEFAULT_DISTRIBUTION_CURVE_MODE,
) => {
    const centerRaw = toFiniteNumber(axisScale?.centerRaw);
    if (centerRaw === null || !axisScale) {
        return [];
    }

    const measuredValues = resolveMeasuredDistributionValues(distributionMeta);
    if (measuredValues.length === 0) {
        return [];
    }

    const sigma = resolveDistributionSigma(distributionMeta?.measuredSigma, axisScale);
    const bandwidth = resolveDistributionBandwidth(distributionMeta, axisScale);
    const leftBound = centerRaw - (axisScale.lowerMaxMagnitude || sigma * 4);
    const rightBound = centerRaw + (axisScale.upperMaxMagnitude || sigma * 4);
    const rawPoints = Array.from({ length: 161 }, (_, index) => {
        const ratio = index / 160;
        const rawValue = leftBound + (rightBound - leftBound) * ratio;
        const displayX = axisScale.toDisplayValue(rawValue);
        const density = calculateKdeDensity(rawValue, measuredValues, bandwidth);

        return {
            x: displayX,
            y: density,
            meta: {
                rawValue,
                measuredValueCount: measuredValues.length,
            },
        };
    }).filter((point) => point.x !== null);

    const peakDensity =
        rawPoints.reduce((max, point) => Math.max(max, toFiniteNumber(point?.y) ?? 0), 0) || 1;

    return rawPoints.map((point) => ({
        ...point,
        y: (toFiniteNumber(point?.y) ?? 0) / peakDensity,
    }));
};

const buildDistributionPointData = (distributionMeta, axisScale, pointMode) => {
    const measuredValues = resolveMeasuredDistributionValues(distributionMeta);
    const nominal = toFiniteNumber(distributionMeta?.nominal);
    const centerRaw = toFiniteNumber(axisScale?.centerRaw);
    if (nominal === null || centerRaw === null || !axisScale) {
        return [];
    }

    const measuredMean =
        toFiniteNumber(distributionMeta?.measuredMean) ??
        (measuredValues.length > 0
            ? measuredValues.reduce((sum, value) => sum + value, 0) / measuredValues.length
            : null);
    const bandwidth = resolveDistributionBandwidth(distributionMeta, axisScale);
    const peakDensity =
        measuredValues.reduce(
            (max, value) => Math.max(max, calculateKdeDensity(value, measuredValues, bandwidth)),
            0,
        ) || 1;

    return measuredValues
        .map((value, index) => {
            const displayX = axisScale.toDisplayValue(value);
            if (displayX === null) {
                return null;
            }

            const y =
                pointMode === DISTRIBUTION_POINT_RUG
                    ? 0.04 + pseudoNoise(index + 1) * 0.06
                    : calculateKdeDensity(value, measuredValues, bandwidth) / peakDensity;

            return {
                x: displayX,
                y,
                meta: {
                    measuredValue: value,
                    deltaFromCenter: value - centerRaw,
                    deltaFromNominal: value - nominal,
                    deltaFromMean: measuredMean === null ? null : value - measuredMean,
                },
            };
        })
        .filter((point) => point !== null);
};

const resolveTooltipTitle = ({ meta, chartScope, detailScale }) => {
    if (chartScope === 'main') {
        return meta?.label || '-';
    }

    const baseValue = meta?.bucketDateTime ?? meta?.bucketDate;
    if (detailScale === DETAIL_SCALE_DAY) {
        return formatDateTimeLabel(baseValue) || '-';
    }

    return formatCompactDateLabel(baseValue) || '-';
};

const resolveTooltipMeanValue = (meta) => {
    return toFiniteNumber(meta?.measuredMean ?? meta?.mean);
};

const resolveTooltipMinValue = (meta) => {
    return toFiniteNumber(meta?.measuredMin ?? meta?.min);
};

const resolveTooltipMaxValue = (meta) => {
    return toFiniteNumber(meta?.measuredMax ?? meta?.max);
};

const resolveTooltipSerialNo = (meta) => {
    return String(meta?.serialNo ?? meta?.serial_no ?? '').trim();
};

const buildTooltipContentRows = (
    meta,
    projectReportCountLabel,
    {
        includeSerialNo = false,
        includeSigmaMetrics = true,
        includeProjectReportCount = true,
        includeMinMaxTail = true,
        meanLabel = '평균(mean)',
        projectReportCountText = '선택 프로젝트 성적서 수',
        projectReportCountValue = null,
    } = {},
) => {
    const serialNo = resolveTooltipSerialNo(meta);
    const resolvedProjectReportCountValue =
        projectReportCountValue ?? projectReportCountLabel;

    return `
            ${
                includeSerialNo && serialNo
                    ? `<div>serial no.: ${serialNo}</div>`
                    : ''
            }
            <div>nominal: ${formatNumber(meta?.nominal, 4)}</div>
            <div>공차(uTol/lTol): ${formatNumber(meta?.uTol, 4)} / ${formatNumber(meta?.lTol, 4)}</div>
            <div>${meanLabel}: ${formatNumber(resolveTooltipMeanValue(meta), 4)}</div>
            ${
                includeSigmaMetrics
                    ? `<div>Cpk / 표준편차(σ): ${formatNumber(meta?.cpk, 3)} / ${formatNumber(meta?.sigma, 4)}</div>
            <div>봉(-2σ~+2σ): ${formatNumber(meta?.lowerBodyRaw, 4)} ~ ${formatNumber(meta?.upperBodyRaw, 4)}</div>`
                    : ''
            }
            ${
                includeMinMaxTail
                    ? `<div>꼬리(min~max): ${formatNumber(resolveTooltipMinValue(meta), 4)} ~ ${formatNumber(resolveTooltipMaxValue(meta), 4)}</div>`
                    : ''
            }
            ${
                includeProjectReportCount
                    ? `<div>${projectReportCountText}: ${resolvedProjectReportCountValue}</div>`
                    : ''
            }
        `;
};

const buildTooltipContainerMarkup = ({ title, rowsMarkup }) => {
    return `
        <div style="max-width:min(420px, calc(100vw - 48px)); padding:10px 12px; background:#14181f; color:#f2f4f8; border:1px solid rgba(255,255,255,0.24); border-radius:12px; box-shadow:0 12px 28px rgba(0,0,0,0.38); white-space:normal; overflow-wrap:anywhere; line-height:1.35;">
            <div style="font-weight:700; margin-bottom:8px; font-size:16px;">${title}</div>
            ${rowsMarkup}
        </div>
    `;
};

const buildMainTooltipMarkup = ({ meta, projectReportCountLabel }) => {
    return buildTooltipContainerMarkup({
        title: meta?.label || '-',
        rowsMarkup: `
            ${
                meta?.isGrouped
                    ? `<div>요약 구간: ${meta?.groupLabel || '-'} (${meta?.groupSize || 0}개)</div>`
                    : ''
            }
            <div>nominal: ${formatNumber(meta?.nominal, 4)}</div>
            <div>공차(uTol/lTol): ${formatNumber(meta?.uTol, 4)} / ${formatNumber(meta?.lTol, 4)}</div>
            <div>평균(mean): ${formatNumber(resolveTooltipMeanValue(meta), 4)}</div>
            <div>표준편차(σ): ${formatNumber(meta?.sigma, 4)}</div>
            <div>최소/최대: ${formatNumber(resolveTooltipMinValue(meta), 4)} / ${formatNumber(resolveTooltipMaxValue(meta), 4)}</div>
            <div>Cpk: ${formatNumber(meta?.cpk, 3)}</div>
            <div>시그마 수준(Z): ${formatNumber(meta?.sigmaLevel, 3)}</div>
            <div>불량률: ${formatNumber(meta?.defectRatePercent, 6)}%</div>
            <div>PPM: ${formatPpm(meta?.defectRatePercent)}</div>
            <div>양품율: ${formatNumber(meta?.goodRatePercent, 6)}%</div>
            <div>선택 프로젝트 성적서 수: ${projectReportCountLabel}</div>
        `,
    });
};

const buildDetailTooltipMarkup = ({ meta, detailScale, projectReportCountLabel }) => {
    return buildTooltipContainerMarkup({
        title: resolveTooltipTitle({
            meta,
            chartScope: 'detail',
            detailScale,
        }),
        rowsMarkup: buildTooltipContentRows(meta, projectReportCountLabel, {
            includeSerialNo: detailScale === DETAIL_SCALE_DAY,
            includeSigmaMetrics: detailScale !== DETAIL_SCALE_DAY,
            includeProjectReportCount: detailScale !== DETAIL_SCALE_DAY,
            includeMinMaxTail: detailScale !== DETAIL_SCALE_DAY,
            meanLabel: detailScale === DETAIL_SCALE_DAY ? '측정값' : '평균(mean)',
            projectReportCountText:
                detailScale === DETAIL_SCALE_MONTH
                    ? `${formatCompactDateLabel(meta?.bucketDate ?? meta?.bucketDateTime) || '-'}일 성적서`
                    : '선택 프로젝트 성적서 수',
            projectReportCountValue:
                detailScale === DETAIL_SCALE_MONTH
                    ? `${Number(meta?.sampleCount ?? 0).toLocaleString()}개`
                    : null,
        }),
    });
};

const buildDistributionTooltipMarkup = ({
    pointMeta,
    distributionMeta,
    detailScale,
    baseDate,
    pointMode,
    isOneSidedUpperTolerance,
}) => {
    const periodLabel =
        detailScale === DETAIL_SCALE_DAY
            ? (baseDate || '-')
            : `${baseDate || '-'} 월`;
    const { usl: tooltipUsl, lsl: tooltipLsl } = resolveSpecificationLimits(
        distributionMeta?.nominal,
        distributionMeta?.uTol ?? distributionMeta?.utol,
        distributionMeta?.lTol ?? distributionMeta?.ltol,
    );
    const centerValue =
        tooltipUsl !== null && tooltipLsl !== null ? (tooltipUsl + tooltipLsl) / 2 : null;

    return buildTooltipContainerMarkup({
        title: `${periodLabel} 정규분포`,
        rowsMarkup: `
            <div>표시 방식: ${pointMode === DISTRIBUTION_POINT_RUG ? '러그 점' : '곡선 정렬점'}</div>
            <div>곡선 기준: 실측 KDE 분포</div>
            <div>N((USL+LSL)/2): ${formatNumber(centerValue, 4)}</div>
            <div>nominal: ${formatNumber(distributionMeta?.nominal, 4)}</div>
            <div>공차(uTol/lTol): ${formatNumber(distributionMeta?.uTol, 4)} / ${formatNumber(distributionMeta?.lTol, 4)}</div>
            ${
                isOneSidedUpperTolerance
                    ? '<div>해석 기준: 일방공차(0에 가까울수록 양호)</div>'
                    : ''
            }
            <div>실측값: ${formatNumber(pointMeta?.measuredValue, 4)}</div>
            <div>N 대비 편차: ${formatNumber(pointMeta?.deltaFromCenter, 4)}</div>
            <div>nominal 대비 편차: ${formatNumber(pointMeta?.deltaFromNominal, 4)}</div>
            <div>평균(mean): ${formatNumber(distributionMeta?.measuredMean, 4)}</div>
            <div>mean 대비 편차: ${formatNumber(pointMeta?.deltaFromMean, 4)}</div>
            <div>표준편차(σ): ${formatNumber(distributionMeta?.measuredSigma, 4)}</div>
            <div>최소/최대: ${formatNumber(distributionMeta?.measuredMin, 4)} / ${formatNumber(distributionMeta?.measuredMax, 4)}</div>
            <div>표본 수: ${Number(distributionMeta?.sampleCount ?? 0).toLocaleString()}개</div>
        `,
    });
};

const getToleranceMagnitudes = (uTolRaw, lTolRaw) => {
    const upperRaw = toFiniteNumber(uTolRaw);
    const lowerRaw = toFiniteNumber(lTolRaw);
    const upper = upperRaw === null ? null : Math.abs(upperRaw);
    const lower = lowerRaw === null ? null : Math.abs(lowerRaw);

    return {
        upper: upper !== null && upper > 0 ? upper : null,
        lower: lower !== null && lower > 0 ? lower : null,
    };
};

const pseudoNoise = (seed) => {
    const raw = Math.sin(seed * 12.9898) * 43758.5453;
    return raw - Math.floor(raw);
};

const gaussianLikeNoise = (seed) => {
    const n1 = pseudoNoise(seed + 0.13) * 2 - 1;
    const n2 = pseudoNoise(seed + 0.71) * 2 - 1;
    const n3 = pseudoNoise(seed + 1.37) * 2 - 1;
    return (n1 + n2 + n3) / 3;
};

const buildCharacteristicLabel = (charNoRaw, axisRaw, fallbackIndex) => {
    const charNoText = String(charNoRaw ?? '').trim();
    const axisText = String(axisRaw ?? '').trim();
    const charNo = charNoText || `C-${String(fallbackIndex + 1).padStart(2, '0')}`;
    return axisText ? `${charNo}-${axisText}` : charNo;
};

const isPrimarySelectionEvent = (event) => {
    const nativeEvent = event?.nativeEvent ?? event;

    if (!nativeEvent) {
        return true;
    }

    if (
        nativeEvent.type?.startsWith('touch') ||
        nativeEvent.pointerType === 'touch' ||
        nativeEvent.pointerType === 'pen'
    ) {
        return true;
    }

    if (typeof nativeEvent.button === 'number') {
        return nativeEvent.button === 0;
    }

    if (typeof nativeEvent.which === 'number') {
        return nativeEvent.which === 1;
    }

    return true;
};

const persistChartRouteState = (routeState) => {
    if (!routeState) {
        return;
    }

    try {
        window.sessionStorage.setItem(
            CHART_ROUTE_STATE_STORAGE_KEY,
            JSON.stringify(routeState),
        );
    } catch {
        // ignore sessionStorage failures
    }
};

const readPersistedChartRouteState = () => {
    try {
        const raw = window.sessionStorage.getItem(CHART_ROUTE_STATE_STORAGE_KEY);
        if (!raw) {
            return null;
        }

        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const clearPersistedChartRouteState = () => {
    try {
        window.sessionStorage.removeItem(CHART_ROUTE_STATE_STORAGE_KEY);
    } catch {
        // ignore sessionStorage failures
    }
};

const normalizeIncomingRows = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) {
        return [];
    }

    const groupMap = new Map();

    rows.forEach((row, index) => {
        const measuredValue = toFiniteNumber(
            row?.measuredValue ?? row?.measured_value ?? row?.measurement ?? row?.value,
        );

        if (measuredValue === null) {
            return;
        }

        const label = buildCharacteristicLabel(
            row?.charNo ?? row?.char_no ?? row?.characteristic ?? row?.x ?? row?.label,
            row?.axis,
            index,
        );
        const charNo = String(
            row?.charNo ?? row?.char_no ?? row?.characteristic ?? row?.x ?? row?.label ?? '',
        ).trim();
        const axis = String(row?.axis ?? '').trim();

        if (!groupMap.has(label)) {
            groupMap.set(label, {
                x: label,
                charId: toFiniteNumber(row?.charId ?? row?.char_id),
                charNo,
                axis,
                nominal: toFiniteNumber(row?.nominal ?? row?.norminal),
                uTol: toFiniteNumber(row?.uTol ?? row?.utol),
                lTol: toFiniteNumber(row?.lTol ?? row?.ltol),
                measuredValues: [],
            });
        }

        const group = groupMap.get(label);
        if (group.charId === null) {
            group.charId = toFiniteNumber(row?.charId ?? row?.char_id);
        }
        if (!group.charNo) {
            group.charNo = charNo;
        }
        if (!group.axis) {
            group.axis = axis;
        }
        if (group.nominal === null) {
            group.nominal = toFiniteNumber(row?.nominal ?? row?.norminal);
        }
        if (group.uTol === null) {
            group.uTol = toFiniteNumber(row?.uTol ?? row?.utol);
        }
        if (group.lTol === null) {
            group.lTol = toFiniteNumber(row?.lTol ?? row?.ltol);
        }

        group.measuredValues.push(measuredValue);
    });

    return Array.from(groupMap.values());
};

const createMockMeasurementGroups = (project) => {
    const characteristicList =
        Array.isArray(project?.characteristicList) && project.characteristicList.length > 0
            ? project.characteristicList
            : Array.from({ length: DEFAULT_CHARACTERISTIC_COUNT }, (_, index) => ({
                  charNo: `C-${String(index + 1).padStart(2, '0')}`,
                  axis: '',
                  nominal: 100,
                  uTol: 0.5,
                  lTol: -0.5,
              }));

    return characteristicList.map((characteristic, index) => {
        const label = buildCharacteristicLabel(
            characteristic?.charNo,
            characteristic?.axis,
            index,
        );
        const nominalValue =
            toFiniteNumber(characteristic?.nominal ?? characteristic?.norminal) ?? 100;
        const uTolValue = toFiniteNumber(characteristic?.uTol ?? characteristic?.utol) ?? 0.5;
        const lTolValue = toFiniteNumber(characteristic?.lTol ?? characteristic?.ltol) ?? -0.5;

        const toleranceMagnitudes = getToleranceMagnitudes(uTolValue, lTolValue);
        const upperTol = toleranceMagnitudes.upper ?? 0.5;
        const lowerTol = toleranceMagnitudes.lower ?? upperTol;
        const meanOffsetRatio = (Math.sin((index + 1) * 0.73) * 0.6 + 0.2) * 0.5;
        const baselineCenter = nominalValue + meanOffsetRatio * upperTol;
        const sigmaSeed = 0.06 * Math.min(upperTol, lowerTol);

        const measuredValues = Array.from({ length: DEFAULT_MEASUREMENT_COUNT }, (_, dataIndex) => {
            const noise = gaussianLikeNoise((index + 1) * 101 + dataIndex * 17);
            return baselineCenter + noise * sigmaSeed * 2.1;
        });

        measuredValues.push(nominalValue + upperTol * 1.2);
        measuredValues.push(nominalValue - lowerTol * 0.6);

        return {
            x: label,
            charId: toFiniteNumber(characteristic?.charId ?? characteristic?.char_id),
            charNo: String(characteristic?.charNo ?? '').trim(),
            axis: String(characteristic?.axis ?? '').trim(),
            nominal: nominalValue,
            uTol: uTolValue,
            lTol: lTolValue,
            measuredValues,
        };
    });
};

const toMainChartPoint = (group) => {
    const values = Array.isArray(group?.measuredValues)
        ? group.measuredValues.map(toFiniteNumber).filter((value) => value !== null)
        : [];

    if (values.length === 0) {
        return null;
    }

    const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
    const variance =
        values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;
    const sigma = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const nominal = toFiniteNumber(group?.nominal) ?? 0;
    const uTol = toFiniteNumber(group?.uTol ?? group?.utol);
    const lTol = toFiniteNumber(group?.lTol ?? group?.ltol);
    const { usl, lsl, cpk, sigmaLevel, goodRatePercent, defectRatePercent } =
        resolveCapabilityMetrics({
            meanRaw: mean,
            sigmaRaw: sigma,
            nominalRaw: nominal,
            uTolRaw: uTol,
            lTolRaw: lTol,
        });
    if (usl === null && lsl === null) {
        return null;
    }
    const isOutOfSpec = isOutOfSpecRange(min, max, usl, lsl);
    const displayValue = toMainChartDisplayValue(defectRatePercent);

    return {
        x: group.x,
        y: displayValue,
        meta: {
            charId: toFiniteNumber(group?.charId),
            charNo: String(group?.charNo ?? '').trim(),
            axis: String(group?.axis ?? '').trim(),
            label: group.x,
            count: values.length,
            nominal,
            uTol,
            lTol,
            mean,
            sigma,
            min,
            max,
            usl,
            lsl,
            cpk,
            sigmaLevel,
            defectRatePercent,
            goodRatePercent,
            ppm: toFiniteNumber(defectRatePercent) === null ? null : defectRatePercent * 10000,
            displayValue,
            isOutOfSpec,
        },
    };
};

const toMainChartPointFromBackendStat = (stat, index) => {
    const mean = toFiniteNumber(stat?.measuredMean);
    const sigma = toFiniteNumber(stat?.measuredSigma);
    const min = toFiniteNumber(stat?.measuredMin);
    const max = toFiniteNumber(stat?.measuredMax);
    const nominal = toFiniteNumber(stat?.nominal) ?? 0;
    const uTol = toFiniteNumber(stat?.uTol ?? stat?.utol);
    const lTol = toFiniteNumber(stat?.lTol ?? stat?.ltol);
    const sampleCountRaw = Number(stat?.sampleCount);
    const sampleCount = Number.isFinite(sampleCountRaw) ? sampleCountRaw : 0;

    if (mean === null || sigma === null || min === null || max === null) {
        return null;
    }

    const label = buildCharacteristicLabel(stat?.charNo, stat?.axis, index);
    const { usl, lsl, cpk, sigmaLevel, goodRatePercent, defectRatePercent } =
        resolveCapabilityMetrics({
            meanRaw: mean,
            sigmaRaw: sigma,
            nominalRaw: nominal,
            uTolRaw: uTol,
            lTolRaw: lTol,
            uslRaw: stat?.usl,
            lslRaw: stat?.lsl,
            cpkRaw: stat?.cpk,
            sigmaLevelRaw: stat?.sigmaLevel,
            goodRatePercentRaw: stat?.goodRatePercent,
            defectRatePercentRaw: stat?.defectRatePercent,
        });
    if (usl === null && lsl === null) {
        return null;
    }
    const isOutOfSpec = isOutOfSpecRange(min, max, usl, lsl);
    const displayValue = toMainChartDisplayValue(defectRatePercent);

    return {
        x: label,
        y: displayValue,
        meta: {
            charId: toFiniteNumber(stat?.charId),
            charNo: String(stat?.charNo ?? '').trim(),
            axis: String(stat?.axis ?? '').trim(),
            label,
            count: sampleCount,
            nominal,
            uTol,
            lTol,
            mean,
            sigma,
            min,
            max,
            usl,
            lsl,
            cpk,
            sigmaLevel,
            defectRatePercent,
            goodRatePercent,
            ppm: toFiniteNumber(defectRatePercent) === null ? null : defectRatePercent * 10000,
            displayValue,
            isOutOfSpec,
        },
    };
};

const Chart = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const persistedRouteState = useMemo(() => {
        if (location.state) {
            return null;
        }

        return readPersistedChartRouteState();
    }, [location.state]);
    const routeState = location.state ?? persistedRouteState ?? null;
    const project = routeState?.project || null;
    const [backendCandleData, setBackendCandleData] = useState([]);
    const [isBackendLoading, setIsBackendLoading] = useState(false);
    const [projectReportCount, setProjectReportCount] = useState(null);
    const [backendStatusMessage, setBackendStatusMessage] = useState('');
    const [backendErrorMessage, setBackendErrorMessage] = useState('');
    const [chartNotifications, setChartNotifications] = useState([]);
    const [activeChartNotification, setActiveChartNotification] = useState(null);
    const [isChartNotificationOpen, setIsChartNotificationOpen] = useState(false);
    const [messageAnchorEl, setMessageAnchorEl] = useState(null);
    const [isInfoSnackbarOpen, setIsInfoSnackbarOpen] = useState(false);
    const [infoAnchorEl, setInfoAnchorEl] = useState(null);
    const [activeChartView, setActiveChartView] = useState('main');
    const [selectedCharacteristic, setSelectedCharacteristic] = useState(null);
    const [detailScale, setDetailScale] = useState(DETAIL_SCALE_MONTH);
    const [detailVisualMode, setDetailVisualMode] = useState(
        resolveDetailDefaultVisualMode(DETAIL_SCALE_MONTH),
    );
    const [distributionPointMode, setDistributionPointMode] = useState(
        DEFAULT_DISTRIBUTION_POINT_MODE,
    );
    const [distributionCurveMode, setDistributionCurveMode] = useState(
        DEFAULT_DISTRIBUTION_CURVE_MODE,
    );
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [detailTimelineData, setDetailTimelineData] = useState([]);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [detailErrorMessage, setDetailErrorMessage] = useState('');
    const [detailDistributionData, setDetailDistributionData] = useState(null);
    const [isDetailDistributionLoading, setIsDetailDistributionLoading] = useState(false);
    const [detailDistributionErrorMessage, setDetailDistributionErrorMessage] = useState('');
    const detailDistributionResponseCacheRef = useRef(new Map());
    const detailDistributionComputationCacheRef = useRef(new Map());
    const detailDistributionPerfRef = useRef(null);
    const detailPerfAnchorRef = useRef(null);
    const lastBackendStatusMessageRef = useRef('');
    const lastBackendErrorMessageRef = useRef('');
    const lastDetailNoiseWarningMessageRef = useRef('');
    const previousChartNotificationContextKeyRef = useRef(null);
    const chartPerfEnabledRef = useRef(isChartPerfEnabled());
    const mainReadyPerfRef = useRef(
        chartPerfEnabledRef.current ? { startedAt: performance.now(), completed: false } : null,
    );
    const detailReadyPerfRef = useRef(null);

    const handleBack = () => {
        if (activeChartView === 'detail') {
            if (detailScale === DETAIL_SCALE_DAY) {
                setSelectedDate('');
                setDetailScale(DETAIL_SCALE_MONTH);
                return;
            }

            persistChartRouteState(routeState);
            window.location.reload();
            return;
        }

        clearPersistedChartRouteState();
        navigateBackOrFallback(navigate, '/spc-data');
    };

    const handleHome = () => {
        clearPersistedChartRouteState();
        navigate('/');
    };

    const startDetailReadyMeasurement = (nextMeta) => {
        if (!chartPerfEnabledRef.current || !nextMeta) {
            return;
        }

        detailReadyPerfRef.current = {
            startedAt: performance.now(),
            completed: false,
            charId: toFiniteNumber(nextMeta?.charId),
        };
    };

    const pushChartNotification = useCallback((severity, message, options = {}) => {
        if (!message) {
            return;
        }

        const notification = createChartNotification({
            severity,
            message,
            source: options.source || '',
        });
        setChartNotifications((prev) => appendChartNotification(prev, notification));

        if (options.openSnackbar) {
            setActiveChartNotification(notification);
            setIsChartNotificationOpen(true);
        }
    }, []);

    const handleChartNotificationClose = (_, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setIsChartNotificationOpen(false);
    };

    const handleInfoIconClick = (event) => {
        setInfoAnchorEl(event.currentTarget);
        setIsInfoSnackbarOpen(true);
    };

    const handleMessageIconClick = (event) => {
        setMessageAnchorEl(event.currentTarget);
    };

    const handleMessagePopoverClose = () => {
        setMessageAnchorEl(null);
    };

    const handleInfoSnackbarClose = (_, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setInfoAnchorEl(null);
        setIsInfoSnackbarOpen(false);
    };

    const chartNotificationContextKey = useMemo(
        () =>
            getChartNotificationContextKey({
                activeChartView,
                detailScale,
            }),
        [activeChartView, detailScale],
    );

    const highestChartNotificationSeverity = useMemo(
        () => getHighestChartNotificationSeverity(chartNotifications),
        [chartNotifications],
    );

    const chartMessageIconColor = {
        [CHART_NOTIFICATION_SEVERITY.ERROR]: '#ff5f6d',
        [CHART_NOTIFICATION_SEVERITY.WARNING]: '#ffb74d',
        [CHART_NOTIFICATION_SEVERITY.SUCCESS]: '#66bb6a',
        [CHART_NOTIFICATION_SEVERITY.INFO]: '#29b6f6',
    }[highestChartNotificationSeverity || CHART_NOTIFICATION_SEVERITY.INFO];

    const activeChartNotificationStyle = getChartNotificationAlertSurfaceStyle(
        activeChartNotification?.severity || CHART_NOTIFICATION_SEVERITY.INFO,
    );
    const isFloatingChartNotification =
        isChartNotificationOpen &&
        shouldUseFloatingChartNotification(activeChartNotification?.severity) &&
        activeChartView === 'detail' &&
        Boolean(detailPerfAnchorRef.current);

    useEffect(() => {
        if (!chartPerfEnabledRef.current) {
            return undefined;
        }

        clearChartPerfState();
        mainReadyPerfRef.current = {
            startedAt: performance.now(),
            completed: false,
        };

        return () => {
            clearChartPerfTestApi();
            clearChartPerfState();
        };
    }, []);

    useEffect(() => {
        const previousKey = previousChartNotificationContextKeyRef.current;

        if (!previousKey) {
            previousChartNotificationContextKeyRef.current = chartNotificationContextKey;
            return;
        }

        if (
            shouldResetChartNotificationsForContextChange(
                previousKey,
                chartNotificationContextKey,
            )
        ) {
            setChartNotifications([]);
            setActiveChartNotification(null);
            setIsChartNotificationOpen(false);
            setMessageAnchorEl(null);
        }

        previousChartNotificationContextKeyRef.current = chartNotificationContextKey;
    }, [chartNotificationContextKey]);

    useEffect(() => {
        if (location.state) {
            clearPersistedChartRouteState();
        }
    }, [location.state]);

    const incomingRows = useMemo(() => {
        if (Array.isArray(routeState?.measurementRows)) {
            return routeState.measurementRows;
        }

        if (Array.isArray(routeState?.parsedRows)) {
            return routeState.parsedRows;
        }

        if (Array.isArray(routeState?.rows)) {
            return routeState.rows;
        }

        return [];
    }, [routeState]);

    useEffect(() => {
        let cancelled = false;

        const projectId = Number(project?.projId);
        if (!Number.isFinite(projectId) || projectId <= 0) {
            setBackendCandleData([]);
            setProjectReportCount(null);
            setBackendStatusMessage('');
            setBackendErrorMessage('');
            setIsBackendLoading(false);
            return () => {
                cancelled = true;
            };
        }

        const fetchBackendChartStats = async () => {
            setIsBackendLoading(true);
            setBackendErrorMessage('');
            setBackendStatusMessage('');

            try {
                const response = await customInstance(
                    `/spcdata/report/project/${projectId}/chart-stats`,
                    { method: 'GET' },
                );
                const body = response?.data;

                if (body?.status !== 'success') {
                    throw new Error(body?.message || '차트 통계 데이터를 불러오지 못했습니다.');
                }

                const rawStats = Array.isArray(body?.data) ? body.data : [];
                const nextCandles = rawStats
                    .map((stat, index) => toMainChartPointFromBackendStat(stat, index))
                    .filter((point) => point !== null);

                if (cancelled) {
                    return;
                }

                setBackendCandleData(nextCandles);
                setBackendStatusMessage(body?.message || '');
            } catch (error) {
                if (cancelled) {
                    return;
                }

                setBackendCandleData([]);
                setBackendStatusMessage('');
                setBackendErrorMessage(
                    error?.response?.data?.message ||
                        error?.message ||
                        '백엔드 차트 통계 조회 중 오류가 발생했습니다.',
                );
            } finally {
                if (!cancelled) {
                    setIsBackendLoading(false);
                }
            }
        };

        fetchBackendChartStats();

        return () => {
            cancelled = true;
        };
    }, [project?.projId]);

    useEffect(() => {
        let cancelled = false;

        const projectId = Number(project?.projId);
        if (!Number.isFinite(projectId) || projectId <= 0) {
            setProjectReportCount(null);
            return () => {
                cancelled = true;
            };
        }

        const fetchProjectReportCount = async () => {
            try {
                const response = await customInstance(
                    `/spcdata/report/project/${projectId}/report-count`,
                    { method: 'GET' },
                );
                const body = response?.data;

                if (body?.status !== 'success') {
                    throw new Error(body?.message || '프로젝트 성적서 건수를 불러오지 못했습니다.');
                }

                const parsedCount = Number(body?.data);
                const nextCount = Number.isFinite(parsedCount) && parsedCount >= 0 ? parsedCount : 0;

                if (!cancelled) {
                    setProjectReportCount(nextCount);
                }
            } catch {
                if (!cancelled) {
                    setProjectReportCount(null);
                }
            }
        };

        fetchProjectReportCount();

        return () => {
            cancelled = true;
        };
    }, [project?.projId]);

    useEffect(() => {
        const warningMessage = backendErrorMessage
            ? `${backendErrorMessage} (fallback 데이터로 표시 중)`
            : '';

        if (!warningMessage) {
            lastBackendErrorMessageRef.current = '';
            return;
        }

        if (warningMessage !== lastBackendErrorMessageRef.current) {
            pushChartNotification(CHART_NOTIFICATION_SEVERITY.WARNING, warningMessage, {
                source: 'backend-warning',
            });
            lastBackendErrorMessageRef.current = warningMessage;
        }
    }, [backendErrorMessage, pushChartNotification]);

    useEffect(() => {
        if (!backendStatusMessage || backendErrorMessage) {
            lastBackendStatusMessageRef.current = '';
            return;
        }

        if (backendStatusMessage !== lastBackendStatusMessageRef.current) {
            pushChartNotification(CHART_NOTIFICATION_SEVERITY.SUCCESS, backendStatusMessage, {
                source: 'backend-success',
            });
            lastBackendStatusMessageRef.current = backendStatusMessage;
        }
    }, [backendErrorMessage, backendStatusMessage, pushChartNotification]);

    const measurementGroups = useMemo(() => {
        const normalizedGroups = normalizeIncomingRows(incomingRows);
        if (normalizedGroups.length > 0) {
            return normalizedGroups;
        }
        return createMockMeasurementGroups(project);
    }, [incomingRows, project]);

    const fallbackCandleData = useMemo(
        () => measurementGroups.map(toMainChartPoint).filter((point) => point !== null),
        [measurementGroups],
    );

    const candleData = useMemo(() => {
        if (backendCandleData.length > 0) {
            return backendCandleData;
        }
        return fallbackCandleData;
    }, [backendCandleData, fallbackCandleData]);
    const deferredCandleData = useDeferredValue(candleData);

    const normalizedCandleData = useMemo(
        () =>
            deferredCandleData.map((point, index) => ({
                ...point,
                slotKey: `slot-${index + 1}`,
                meta: {
                    ...(point?.meta || {}),
                    label: point?.meta?.label || point?.x || `C-${index + 1}`,
                    index: index + 1,
                    slotKey: `slot-${index + 1}`,
                },
            })),
        [deferredCandleData],
    );

    useEffect(() => {
        if (!chartPerfEnabledRef.current) {
            return undefined;
        }

        setChartPerfTestApi({
            selectCharacteristicByCharId: (charId) => {
                const normalizedCharId = toFiniteNumber(charId);
                const matchedPoint = normalizedCandleData.find((point) => {
                    return toFiniteNumber(point?.meta?.charId) === normalizedCharId;
                });

                if (!matchedPoint?.meta) {
                    return false;
                }

                startDetailReadyMeasurement(matchedPoint.meta);
                startTransition(() => {
                    setSelectedCharacteristic(matchedPoint.meta);
                    setDetailScale(DETAIL_SCALE_MONTH);
                    setSelectedMonth('');
                    setSelectedDate('');
                    setActiveChartView('detail');
                });
                return true;
            },
            showDistribution: () => {
                startTransition(() => {
                    setDetailVisualMode(DETAIL_VISUAL_DISTRIBUTION);
                });
                return true;
            },
            showBase: () => {
                startTransition(() => {
                    setDetailVisualMode(DETAIL_VISUAL_BASE);
                });
                return true;
            },
            getState: () => ({
                activeChartView,
                detailVisualMode,
                selectedCharacteristic,
            }),
        });

        return () => {
            clearChartPerfTestApi();
        };
    }, [activeChartView, detailVisualMode, normalizedCandleData, selectedCharacteristic]);

    useEffect(() => {
        if (normalizedCandleData.length === 0) {
            setActiveChartView('main');
            setSelectedCharacteristic(null);
            return;
        }

        if (!selectedCharacteristic) {
            return;
        }

        const currentCharId = toFiniteNumber(selectedCharacteristic?.charId);
        const matchedPoint = normalizedCandleData.find((point) => {
            const pointCharId = toFiniteNumber(point?.meta?.charId);
            if (currentCharId !== null && pointCharId !== null) {
                return pointCharId === currentCharId;
            }
            return point?.meta?.label === selectedCharacteristic?.label;
        });

        if (!matchedPoint) {
            setActiveChartView('main');
            setSelectedCharacteristic(null);
            return;
        }

        setSelectedCharacteristic(matchedPoint.meta);
    }, [normalizedCandleData, selectedCharacteristic?.charId, selectedCharacteristic?.label]);

    useEffect(() => {
        setSelectedMonth('');
        setSelectedDate('');
    }, [selectedCharacteristic?.charId, selectedCharacteristic?.label]);

    useEffect(() => {
        setDetailVisualMode(resolveDetailDefaultVisualMode(detailScale));
        setDistributionPointMode(DEFAULT_DISTRIBUTION_POINT_MODE);
        setDistributionCurveMode(DEFAULT_DISTRIBUTION_CURVE_MODE);
    }, [detailScale]);

    const mainChartSlots = useMemo(
        () =>
            buildMainChartSlots(normalizedCandleData, {
                minSlots: DEFAULT_VISIBLE_CANDLE_COUNT,
            }),
        [normalizedCandleData],
    );

    const slotLabelMap = useMemo(() => buildSlotLabelMap(mainChartSlots), [mainChartSlots]);

    const mainBarSeriesData = useMemo(
        () =>
            buildMainBarSeriesData(mainChartSlots, {
                toDisplayValue: toFiniteNumber,
                resolveStatus: resolveCandleVisualStatus,
                resolveColor: resolveCandleColorByStatus,
            }),
        [mainChartSlots],
    );

    const chartWidthRatio = useMemo(
        () =>
            calculateChartWidthRatio({
                slotCount: mainChartSlots.length,
                visibleCount: DEFAULT_VISIBLE_CANDLE_COUNT,
            }),
        [mainChartSlots.length],
    );

    useEffect(() => {
        const pending = mainReadyPerfRef.current;
        const hasProjectId = Number.isFinite(Number(project?.projId)) && Number(project?.projId) > 0;
        const isBackendResolved =
            !hasProjectId || backendStatusMessage !== '' || backendErrorMessage !== '';
        const hasResolvedMainDataset = !hasProjectId || backendCandleData.length > 0;

        if (
            !chartPerfEnabledRef.current ||
            !pending ||
            pending.completed ||
            activeChartView !== 'main' ||
            isBackendLoading ||
            !isBackendResolved ||
            !hasResolvedMainDataset ||
            mainBarSeriesData.length === 0
        ) {
            return;
        }

        pending.completed = true;
        recordChartPerfMetric('mainReady', {
            durationMs: performance.now() - pending.startedAt,
            status: backendErrorMessage ? 'fallback' : 'ready',
            pointCount: mainBarSeriesData.length,
        });
    }, [
        activeChartView,
        backendErrorMessage,
        backendCandleData.length,
        backendStatusMessage,
        isBackendLoading,
        mainBarSeriesData.length,
        project?.projId,
    ]);

    const sourceLabel = useMemo(() => {
        if (backendCandleData.length > 0) {
            return '백엔드 집계';
        }
        return incomingRows.length > 0 ? '전달 데이터' : '모의 데이터';
    }, [backendCandleData.length, incomingRows.length]);

    const totalMeasuredCount = useMemo(
        () =>
            candleData.reduce((acc, candle) => {
                return acc + (candle?.meta?.count || 0);
            }, 0),
        [candleData],
    );

    const inferredProjectReportCount = useMemo(() => {
        if (!Array.isArray(backendCandleData) || backendCandleData.length === 0) {
            return null;
        }

        const counts = backendCandleData
            .map((candle) => Number(candle?.meta?.count))
            .filter((count) => Number.isFinite(count) && count > 0);

        if (counts.length === 0) {
            return null;
        }

        return Math.max(...counts);
    }, [backendCandleData]);

    const projectReportCountLabel = useMemo(() => {
        const resolvedCount =
            projectReportCount === null || projectReportCount === undefined
                ? inferredProjectReportCount
                : projectReportCount;

        if (resolvedCount === null || resolvedCount === undefined) {
            return '-';
        }
        return Number(resolvedCount).toLocaleString();
    }, [inferredProjectReportCount, projectReportCount]);

    useEffect(() => {
        let cancelled = false;

        const projectId = Number(project?.projId);
        const charId = toFiniteNumber(selectedCharacteristic?.charId);

        if (!Number.isFinite(projectId) || projectId <= 0) {
            setDetailTimelineData([]);
            setDetailErrorMessage('');
            setIsDetailLoading(false);
            return () => {
                cancelled = true;
            };
        }

        if (!selectedCharacteristic) {
            setDetailTimelineData([]);
            setDetailErrorMessage('');
            setIsDetailLoading(false);
            return () => {
                cancelled = true;
            };
        }

        if (activeChartView !== 'detail') {
            setIsDetailLoading(false);
            return () => {
                cancelled = true;
            };
        }

        if (charId === null) {
            setDetailTimelineData([]);
            setDetailErrorMessage(
                isBackendLoading
                    ? ''
                    : '세부 차트는 백엔드 특성 데이터가 있을 때 조회할 수 있습니다.',
            );
            setIsDetailLoading(false);
            return () => {
                cancelled = true;
            };
        }

        const fetchDetailTimeline = async () => {
            setIsDetailLoading(true);
            setDetailErrorMessage('');
            setDetailTimelineData([]);

            try {
                const query = new URLSearchParams({
                    scale: detailScale,
                });

                const baseDate = detailScale === DETAIL_SCALE_DAY ? selectedDate : selectedMonth;
                if (baseDate) {
                    query.set('baseDate', baseDate);
                }

                const response = await customInstance(
                    `/spcdata/report/project/${projectId}/characteristic/${charId}/detail?${query.toString()}`,
                    { method: 'GET' },
                );
                const body = response?.data;

                if (body?.status !== 'success') {
                    throw new Error(body?.message || '세부 차트 데이터를 불러오지 못했습니다.');
                }

                if (cancelled) {
                    return;
                }

                setDetailTimelineData(Array.isArray(body?.data) ? body.data : []);
            } catch (error) {
                if (cancelled) {
                    return;
                }

                setDetailTimelineData([]);
                setDetailErrorMessage(
                    error?.response?.data?.message ||
                        error?.message ||
                        '세부 차트 데이터를 불러오는 중 오류가 발생했습니다.',
                );
            } finally {
                if (!cancelled) {
                    setIsDetailLoading(false);
                }
            }
        };

        fetchDetailTimeline();

        return () => {
            cancelled = true;
        };
    }, [
        activeChartView,
        detailScale,
        isBackendLoading,
        project?.projId,
        selectedCharacteristic?.charId,
        selectedCharacteristic?.label,
        selectedDate,
        selectedMonth,
    ]);

    const detailDistributionBaseDate = useMemo(() => {
        if (detailScale === DETAIL_SCALE_DAY) {
            if (selectedDate) {
                return selectedDate;
            }

            const latestRow = detailTimelineData[detailTimelineData.length - 1];
            return toInputDateValue(latestRow?.bucketDateTime ?? latestRow?.bucketDate);
        }

        if (selectedMonth) {
            return selectedMonth;
        }

        const latestRow = detailTimelineData[detailTimelineData.length - 1];
        return toInputMonthValue(latestRow?.bucketDate ?? latestRow?.bucketDateTime);
    }, [detailScale, detailTimelineData, selectedDate, selectedMonth]);

    const detailDistributionResponseCacheKey = useMemo(() => {
        const charId = toFiniteNumber(selectedCharacteristic?.charId);

        if (charId === null || !detailDistributionBaseDate) {
            return '';
        }

        return buildDetailDistributionCacheKey({
            charId,
            scale: detailScale,
            baseDate: detailDistributionBaseDate,
        });
    }, [detailDistributionBaseDate, detailScale, selectedCharacteristic?.charId]);

    useEffect(() => {
        const shouldMeasureDistribution =
            activeChartView === 'detail' &&
            detailVisualMode === DETAIL_VISUAL_DISTRIBUTION &&
            Boolean(detailDistributionResponseCacheKey);

        if (!shouldMeasureDistribution) {
            return;
        }

        detailDistributionPerfRef.current = {
            startedAt: performance.now(),
            responseCacheStatus: 'pending',
            computationCacheStatus: 'pending',
            charId: toFiniteNumber(selectedCharacteristic?.charId),
            scale: detailScale,
            baseDate: detailDistributionBaseDate,
            measurementKey: detailDistributionResponseCacheKey,
            completed: false,
        };
    }, [
        activeChartView,
        detailDistributionBaseDate,
        detailDistributionResponseCacheKey,
        detailScale,
        detailVisualMode,
        selectedCharacteristic?.charId,
    ]);

    useEffect(() => {
        let cancelled = false;

        const projectId = Number(project?.projId);
        const charId = toFiniteNumber(selectedCharacteristic?.charId);
        const shouldFetchDistribution =
            activeChartView === 'detail' && detailVisualMode === DETAIL_VISUAL_DISTRIBUTION;

        if (!shouldFetchDistribution) {
            setDetailDistributionData(null);
            setDetailDistributionErrorMessage('');
            setIsDetailDistributionLoading(false);
            return () => {
                cancelled = true;
            };
        }

        if (!Number.isFinite(projectId) || projectId <= 0 || charId === null) {
            setDetailDistributionData(null);
            setDetailDistributionErrorMessage('');
            setIsDetailDistributionLoading(false);
            return () => {
                cancelled = true;
            };
        }

        if (!detailDistributionBaseDate) {
            setDetailDistributionData(null);
            setDetailDistributionErrorMessage('');
            setIsDetailDistributionLoading(false);
            return () => {
                cancelled = true;
            };
        }

        if (detailDistributionResponseCacheKey) {
            const cachedDistributionResponse =
                detailDistributionResponseCacheRef.current.get(
                    detailDistributionResponseCacheKey,
                );

            if (cachedDistributionResponse !== undefined) {
                if (detailDistributionPerfRef.current) {
                    detailDistributionPerfRef.current.responseCacheStatus = 'hit';
                }
                setDetailDistributionData(cachedDistributionResponse);
                setDetailDistributionErrorMessage('');
                setIsDetailDistributionLoading(false);
                return () => {
                    cancelled = true;
                };
            }
        }

        const fetchDetailDistribution = async () => {
            if (detailDistributionPerfRef.current) {
                detailDistributionPerfRef.current.responseCacheStatus = 'miss';
            }
            setIsDetailDistributionLoading(true);
            setDetailDistributionErrorMessage('');
            setDetailDistributionData(null);

            try {
                const query = new URLSearchParams({
                    scale: detailScale,
                    baseDate: detailDistributionBaseDate,
                });
                const response = await customInstance(
                    `/spcdata/report/project/${projectId}/characteristic/${charId}/distribution?${query.toString()}`,
                    { method: 'GET' },
                );
                const body = response?.data;

                if (body?.status !== 'success') {
                    throw new Error(body?.message || '정규분포 데이터를 불러오지 못했습니다.');
                }

                if (cancelled) {
                    return;
                }

                const nextDistributionData = body?.data || null;
                if (detailDistributionResponseCacheKey) {
                    upsertBoundedCacheEntry(
                        detailDistributionResponseCacheRef.current,
                        detailDistributionResponseCacheKey,
                        nextDistributionData,
                        DETAIL_DISTRIBUTION_RESPONSE_CACHE_MAX,
                    );
                }
                setDetailDistributionData(nextDistributionData);
            } catch (error) {
                if (cancelled) {
                    return;
                }

                setDetailDistributionData(null);
                setDetailDistributionErrorMessage(
                    error?.response?.data?.message ||
                        error?.message ||
                        '정규분포 데이터를 불러오는 중 오류가 발생했습니다.',
                );
            } finally {
                if (!cancelled) {
                    setIsDetailDistributionLoading(false);
                }
            }
        };

        fetchDetailDistribution();

        return () => {
            cancelled = true;
        };
    }, [
        activeChartView,
        detailDistributionResponseCacheKey,
        detailDistributionBaseDate,
        detailScale,
        detailVisualMode,
        project?.projId,
        selectedCharacteristic?.charId,
    ]);

    const detailChartData = useMemo(
        () =>
            detailTimelineData
                .map((item, index) => {
                    const nominal = toFiniteNumber(item?.nominal ?? selectedCharacteristic?.nominal);
                    const uTol = toFiniteNumber(item?.uTol ?? item?.utol ?? selectedCharacteristic?.uTol);
                    const lTol = toFiniteNumber(item?.lTol ?? item?.ltol ?? selectedCharacteristic?.lTol);
                    const meanRaw = toFiniteNumber(item?.measuredMean);
                    const sigmaRaw = toFiniteNumber(item?.measuredSigma) ?? 0;
                    const minRaw = toFiniteNumber(item?.measuredMin);
                    const maxRaw = toFiniteNumber(item?.measuredMax);
                    const lowerBodyRaw = meanRaw === null ? null : meanRaw - SIGMA_MULTIPLIER * sigmaRaw;
                    const upperBodyRaw = meanRaw === null ? null : meanRaw + SIGMA_MULTIPLIER * sigmaRaw;
                    const { usl, lsl } = resolveSpecificationLimits(nominal, uTol, lTol);
                    const cpk = calculateCpk(meanRaw, sigmaRaw, usl, lsl);
                    const isOutOfSpec = isOutOfSpecRange(minRaw, maxRaw, usl, lsl);

                    if (meanRaw === null) {
                        return null;
                    }

                    const key = String(item?.bucketKey || `detail-${index + 1}`);
                    const compactLabel =
                        detailScale === DETAIL_SCALE_DAY
                            ? formatCompactDateTimeLabel(
                                  item?.bucketDateTime ?? item?.bucketDate,
                              )
                            : formatCompactDateLabel(
                                  item?.bucketDate ?? item?.bucketDateTime,
                              );
                    return {
                        x: key,
                        label: String(
                            compactLabel ||
                                item?.bucketLabel ||
                                item?.bucketDate ||
                                item?.bucketDateTime ||
                                `point-${index + 1}`,
                        ),
                        meanRaw,
                        minRaw: minRaw ?? meanRaw,
                        maxRaw: maxRaw ?? meanRaw,
                        meta: {
                            ...item,
                            nominal,
                            uTol,
                            lTol,
                            sigma: sigmaRaw,
                            cpk,
                            usl,
                            lsl,
                            isOutOfSpec,
                            mean: meanRaw,
                            min: minRaw,
                            max: maxRaw,
                            lowerBodyRaw: lowerBodyRaw ?? meanRaw,
                            upperBodyRaw: upperBodyRaw ?? meanRaw,
                        },
                    };
                })
                .filter((item) => item !== null),
        [detailScale, detailTimelineData, selectedCharacteristic],
    );

    const detailPlotPoints = useMemo(
        () =>
            detailChartData.map((item) => {
                const lowerBodyRaw =
                    toFiniteNumber(item?.meta?.lowerBodyRaw) ?? toFiniteNumber(item.meanRaw) ?? 0;
                const upperBodyRaw =
                    toFiniteNumber(item?.meta?.upperBodyRaw) ?? toFiniteNumber(item.meanRaw) ?? 0;
                const meanRaw = toFiniteNumber(item.meanRaw) ?? 0;
                const usl = toFiniteNumber(item?.meta?.usl);
                const lsl = toFiniteNumber(item?.meta?.lsl);
                const centerRaw =
                    usl !== null && lsl !== null ? (usl + lsl) / 2 : toFiniteNumber(item?.meta?.nominal) ?? meanRaw;
                const isNegativeBody = meanRaw < centerRaw;
                const openRaw = isNegativeBody ? upperBodyRaw : lowerBodyRaw;
                const closeRaw = isNegativeBody ? lowerBodyRaw : upperBodyRaw;

                const highCandidates = [
                    toFiniteNumber(item.maxRaw),
                    lowerBodyRaw,
                    upperBodyRaw,
                    openRaw,
                    closeRaw,
                ].filter((value) => value !== null);
                const lowCandidates = [
                    toFiniteNumber(item.minRaw),
                    lowerBodyRaw,
                    upperBodyRaw,
                    openRaw,
                    closeRaw,
                ].filter((value) => value !== null);

                const highRaw = Math.max(...highCandidates);
                const lowRaw = Math.min(...lowCandidates);
                const visualStatus = resolveCandleVisualStatus(item.meta);
                const candleColor = resolveCandleColorByStatus(visualStatus);

                return {
                    x: item.x,
                    y: [openRaw, highRaw, lowRaw, closeRaw],
                    fillColor: candleColor,
                    strokeColor: candleColor,
                    meta: {
                        ...item.meta,
                        label: item.label,
                        openRaw,
                        highRaw,
                        lowRaw,
                        closeRaw,
                        centerRaw,
                        visualStatus,
                        isOutOfSpec: Boolean(item?.meta?.isOutOfSpec),
                    },
                };
            }),
        [detailChartData],
    );

    const isDetailDayChart = detailScale === DETAIL_SCALE_DAY;
    const isDetailDistributionChart = detailVisualMode === DETAIL_VISUAL_DISTRIBUTION;

    const detailSlotCount = useMemo(
        () => Math.max(DEFAULT_DETAIL_VISIBLE_POINT_COUNT, detailPlotPoints.length),
        [detailPlotPoints.length],
    );

    const detailPaddedSlots = useMemo(
        () =>
            Array.from({ length: detailSlotCount }, (_, index) => {
                const point = detailPlotPoints[index] || null;
                return {
                    key: `detail-slot-${index + 1}`,
                    label: point?.meta?.label || '',
                    point,
                };
            }),
        [detailPlotPoints, detailSlotCount],
    );

    const detailLabelMap = useMemo(() => {
        const map = new Map();
        detailPaddedSlots.forEach((slot) => {
            map.set(slot.key, slot.label);
        });
        return map;
    }, [detailPaddedSlots]);

    const detailYAxisScale = useMemo(() => {
        const rawValues = isDetailDayChart
            ? detailPlotPoints
                  .map((item) => toFiniteNumber(item?.meta?.mean))
                  .filter((value) => value !== null)
            : detailPlotPoints.flatMap((item) =>
                  Array.isArray(item?.y)
                      ? item.y.map(toFiniteNumber).filter((value) => value !== null)
                      : [],
              );
        return buildDetailAxisScale(
            rawValues,
            resolveDetailAxisSpec(detailChartData.map((item) => item?.meta)),
        );
    }, [detailChartData, detailPlotPoints, isDetailDayChart]);

    const detailDistributionComputedCacheKey = useMemo(() => {
        if (!detailDistributionResponseCacheKey) {
            return '';
        }

        return buildDetailDistributionComputationCacheKey({
            responseKey: detailDistributionResponseCacheKey,
            curveMode: distributionCurveMode,
            pointMode: distributionPointMode,
        });
    }, [
        detailDistributionResponseCacheKey,
        distributionCurveMode,
        distributionPointMode,
    ]);

    const detailDistributionComputationCacheStatus = useMemo(() => {
        if (!detailDistributionData || !detailDistributionComputedCacheKey) {
            return 'idle';
        }

        return detailDistributionComputationCacheRef.current.has(
            detailDistributionComputedCacheKey,
        )
            ? 'hit'
            : 'miss';
    }, [detailDistributionComputedCacheKey, detailDistributionData]);

    const detailDistributionComputed = useMemo(() => {
        if (!detailDistributionData || !detailDistributionComputedCacheKey) {
            return null;
        }

        const cachedComputation =
            detailDistributionComputationCacheRef.current.get(
                detailDistributionComputedCacheKey,
            );
        if (cachedComputation) {
            return cachedComputation;
        }

        const axisScale = buildDistributionAxisScale(
            detailDistributionData?.measuredValues,
            detailDistributionData?.nominal ?? selectedCharacteristic?.nominal,
            detailDistributionData?.uTol ??
                detailDistributionData?.utol ??
                selectedCharacteristic?.uTol,
            detailDistributionData?.lTol ??
                detailDistributionData?.ltol ??
                selectedCharacteristic?.lTol,
        );
        const isOneSidedUpperTolerance = isOneSidedUpperToleranceCase(
            detailDistributionData?.nominal ?? selectedCharacteristic?.nominal,
            detailDistributionData?.uTol ??
                detailDistributionData?.utol ??
                selectedCharacteristic?.uTol,
            detailDistributionData?.lTol ??
                detailDistributionData?.ltol ??
                selectedCharacteristic?.lTol,
        );
        const curveData = buildDistributionCurveData(
            detailDistributionData,
            axisScale,
            isOneSidedUpperTolerance,
            distributionCurveMode,
        );
        const pointData = buildDistributionPointData(
            detailDistributionData,
            axisScale,
            distributionPointMode,
        );

        const nextComputation = {
            axisScale,
            isOneSidedUpperTolerance,
            curveData,
            pointData,
        };

        upsertBoundedCacheEntry(
            detailDistributionComputationCacheRef.current,
            detailDistributionComputedCacheKey,
            nextComputation,
            DETAIL_DISTRIBUTION_COMPUTATION_CACHE_MAX,
        );

        return nextComputation;
    }, [
        detailDistributionComputedCacheKey,
        detailDistributionData,
        distributionCurveMode,
        distributionPointMode,
        selectedCharacteristic?.lTol,
        selectedCharacteristic?.nominal,
        selectedCharacteristic?.uTol,
    ]);

    useEffect(() => {
        if (!detailDistributionPerfRef.current) {
            return;
        }

        if (detailDistributionComputationCacheStatus === 'idle') {
            return;
        }

        detailDistributionPerfRef.current.computationCacheStatus =
            detailDistributionComputationCacheStatus;
    }, [detailDistributionComputationCacheStatus]);

    const detailDistributionAxisScale =
        detailDistributionComputed?.axisScale ?? null;

    const isDetailOneSidedUpperTolerance =
        detailDistributionComputed?.isOneSidedUpperTolerance ?? false;

    const detailNoiseWarningMessage = useMemo(() => {
        if (
            activeChartView !== 'detail' ||
            detailVisualMode !== DETAIL_VISUAL_DISTRIBUTION ||
            !isDetailOneSidedUpperTolerance ||
            !hasNegativeMeasuredNoise(detailDistributionData?.measuredValues)
        ) {
            return '';
        }

        return '현재 정규분포 데이터는 nominal=0, 공차 0~+uTol 조건의 일방공차로 해석됩니다. 음수 실측값이 포함되어 있어 노이즈로 판단했습니다.';
    }, [
        activeChartView,
        detailDistributionData?.measuredValues,
        detailVisualMode,
        isDetailOneSidedUpperTolerance,
    ]);

    useEffect(() => {
        if (!detailNoiseWarningMessage) {
            lastDetailNoiseWarningMessageRef.current = '';
            return;
        }

        if (detailNoiseWarningMessage !== lastDetailNoiseWarningMessageRef.current) {
            pushChartNotification(
                CHART_NOTIFICATION_SEVERITY.ERROR,
                detailNoiseWarningMessage,
                {
                    source: 'detail-noise-warning',
                },
            );
            lastDetailNoiseWarningMessageRef.current = detailNoiseWarningMessage;
        }
    }, [detailNoiseWarningMessage, pushChartNotification]);

    const detailDistributionCurveData =
        detailDistributionComputed?.curveData ?? [];

    const detailDistributionPointData =
        detailDistributionComputed?.pointData ?? [];

    const detailSeries = useMemo(() => {
        if (isDetailDistributionChart) {
            if (detailDistributionCurveData.length === 0 && detailDistributionPointData.length === 0) {
                return [];
            }

            return [
                {
                    name: '실측 KDE 분포',
                    type: 'line',
                    data: detailDistributionCurveData,
                },
                {
                    name:
                        distributionPointMode === DISTRIBUTION_POINT_RUG
                            ? '러그 점'
                            : '곡선 정렬점',
                    type: 'scatter',
                    data: detailDistributionPointData,
                },
            ];
        }

        if (detailPlotPoints.length === 0) {
            return [];
        }

        if (isDetailDayChart) {
            return [
                {
                    name: '측정 평균',
                    type: 'line',
                    data: detailPaddedSlots.map((slot) => {
                        if (!slot.point) {
                            return {
                                x: slot.key,
                                y: null,
                                meta: null,
                            };
                        }

                        const displayValue = detailYAxisScale.toDisplayValue(
                            slot.point.meta?.mean,
                        );

                        return {
                            x: slot.key,
                            y: displayValue,
                            meta: slot.point.meta,
                        };
                    }),
                },
            ];
        }

        const emptyDisplayValue =
            detailYAxisScale.toDisplayValue(detailYAxisScale.centerRaw) ?? 0;

        return [
            {
                name: '기간 캔들',
                type: 'candlestick',
                data: detailPaddedSlots.map((slot) => {
                    if (!slot.point) {
                        return {
                            x: slot.key,
                            y: [
                                emptyDisplayValue,
                                emptyDisplayValue,
                                emptyDisplayValue,
                                emptyDisplayValue,
                            ],
                            fillColor: 'rgba(0,0,0,0)',
                            strokeColor: 'rgba(0,0,0,0)',
                            meta: null,
                        };
                    }

                    const rawY = Array.isArray(slot.point.y) ? slot.point.y : [];
                    const displayY = rawY
                        .map((value) => detailYAxisScale.toDisplayValue(value))
                        .filter((value) => value !== null);

                    return {
                        x: slot.key,
                        y: displayY.length === rawY.length ? displayY : rawY,
                        fillColor: slot.point.fillColor,
                        strokeColor: slot.point.strokeColor,
                        meta: slot.point.meta,
                    };
                }),
            },
        ];
    }, [
        detailDistributionCurveData,
        detailDistributionPointData,
        detailPaddedSlots,
        detailPlotPoints.length,
        detailYAxisScale,
        distributionPointMode,
        isDetailDayChart,
        isDetailDistributionChart,
    ]);

    useEffect(() => {
        const pendingDetail = detailReadyPerfRef.current;
        const shouldFinalizeDetailReady =
            activeChartView === 'detail' &&
            detailVisualMode === DETAIL_VISUAL_BASE &&
            Boolean(pendingDetail) &&
            !pendingDetail.completed &&
            !isDetailLoading &&
            detailTimelineData.length > 0 &&
            selectedCharacteristic;

        if (!shouldFinalizeDetailReady) {
            return;
        }

        pendingDetail.completed = true;
        recordChartPerfMetric('detailReady', {
            durationMs: performance.now() - pendingDetail.startedAt,
            status: detailErrorMessage ? 'fallback' : 'ready',
            charId: pendingDetail.charId,
            pointCount: detailTimelineData.length,
        });
    }, [
        activeChartView,
        detailErrorMessage,
        detailVisualMode,
        detailTimelineData.length,
        isDetailLoading,
        selectedCharacteristic,
    ]);

    useEffect(() => {
        const pendingPerf = detailDistributionPerfRef.current;
        const shouldFinalizeMeasurement =
            activeChartView === 'detail' &&
            detailVisualMode === DETAIL_VISUAL_DISTRIBUTION &&
            Boolean(pendingPerf) &&
            !pendingPerf.completed &&
            pendingPerf.measurementKey === detailDistributionResponseCacheKey &&
            detailSeries.length > 0;

        if (!shouldFinalizeMeasurement) {
            return;
        }

        const durationMs = performance.now() - pendingPerf.startedAt;
        const summary = formatDetailDistributionPerfSummary({
            durationMs,
            responseCacheStatus: pendingPerf.responseCacheStatus,
            computationCacheStatus: pendingPerf.computationCacheStatus,
        });

        pendingPerf.completed = true;

        const isCachedMeasurement =
            pendingPerf.responseCacheStatus === 'hit' &&
            pendingPerf.computationCacheStatus === 'hit';
        recordChartPerfMetric(
            isCachedMeasurement ? 'detailDistributionCached' : 'detailDistribution',
            {
                durationMs,
                status: 'ready',
                responseCacheStatus: pendingPerf.responseCacheStatus,
                computationCacheStatus: pendingPerf.computationCacheStatus,
                charId: pendingPerf.charId,
                scale: pendingPerf.scale,
                baseDate: pendingPerf.baseDate,
            },
        );

        if (IS_DEV_MODE) {
            pushChartNotification(CHART_NOTIFICATION_SEVERITY.INFO, summary, {
                source: 'detail-distribution-perf',
                openSnackbar: true,
            });
            console.info(
                '[DetailDistributionPerf]',
                buildDetailDistributionPerfPayload({
                    durationMs,
                    responseCacheStatus: pendingPerf.responseCacheStatus,
                    computationCacheStatus: pendingPerf.computationCacheStatus,
                    charId: pendingPerf.charId,
                    scale: pendingPerf.scale,
                    baseDate: pendingPerf.baseDate,
                }),
            );
        }
    }, [
        activeChartView,
        detailDistributionResponseCacheKey,
        detailSeries,
        detailVisualMode,
        pushChartNotification,
    ]);

    const detailChartWidthRatio = useMemo(
        () =>
            isDetailDistributionChart
                ? 1
                : detailSlotCount / DEFAULT_DETAIL_VISIBLE_POINT_COUNT,
        [detailSlotCount, isDetailDistributionChart],
    );

    const detailNoDataText = useMemo(() => {
        if (!selectedCharacteristic) {
            return '메인 차트 막대를 클릭하면 세부 차트가 표시됩니다.';
        }
        if (isDetailDistributionChart) {
            if (isDetailDistributionLoading) {
                return '정규분포 데이터를 불러오는 중입니다.';
            }
            if (detailDistributionErrorMessage) {
                return detailDistributionErrorMessage;
            }
            return '선택한 기간에 표시할 분포 데이터가 없습니다.';
        }
        if (isDetailLoading) {
            return '세부 차트 데이터를 불러오는 중입니다.';
        }
        if (detailErrorMessage) {
            return detailErrorMessage;
        }
        return '선택한 기간에 표시할 세부 데이터가 없습니다.';
    }, [
        detailDistributionErrorMessage,
        detailErrorMessage,
        isDetailDistributionChart,
        isDetailDistributionLoading,
        isDetailLoading,
        selectedCharacteristic,
    ]);

    const detailScaleLabel = useMemo(
        () => (detailScale === DETAIL_SCALE_DAY ? '일단위' : '월단위'),
        [detailScale],
    );

    const detailVisualModeLabel = useMemo(() => {
        if (detailVisualMode === DETAIL_VISUAL_DISTRIBUTION) {
            return '정규분포';
        }
        return detailScale === DETAIL_SCALE_DAY ? '기본 꺾은선' : '기본 캔들';
    }, [detailScale, detailVisualMode]);

    const detailDistributionInterpretationLabel = useMemo(() => {
        if (!isDetailOneSidedUpperTolerance) {
            return '양측공차 해석(KDE 실측 분포)';
        }

        return detailNoiseWarningMessage
            ? '일방공차 해석(KDE 실측 분포, 음수 노이즈 감지)'
            : '일방공차 해석(KDE 실측 분포, 0에 가까울수록 양호)';
    }, [detailNoiseWarningMessage, isDetailOneSidedUpperTolerance]);

    const detailOverlayControls = useMemo(() => {
        const baseLabel = detailScale === DETAIL_SCALE_DAY ? '꺾은선' : '캔들';

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.7 }}>
                <Box ref={detailPerfAnchorRef}>
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={detailVisualMode}
                        onChange={(_, nextValue) => {
                            if (nextValue) {
                                startTransition(() => {
                                    setDetailVisualMode(nextValue);
                                });
                            }
                        }}
                        sx={{
                            '& .MuiToggleButton-root': {
                                borderColor: 'rgba(163,163,163,0.2)',
                                color: '#cfcfcf',
                                px: 1,
                                py: 0.35,
                                minHeight: 28,
                                minWidth: 92,
                                bgcolor: 'rgba(33,36,41,0.9)',
                                textTransform: 'none',
                                justifyContent: 'center',
                            },
                            '& .Mui-selected': {
                                bgcolor: 'rgba(45,140,255,0.18) !important',
                                color: '#8ec5ff',
                            },
                        }}
                    >
                        <ToggleButton value={DETAIL_VISUAL_BASE}>{baseLabel}</ToggleButton>
                        <ToggleButton value={DETAIL_VISUAL_DISTRIBUTION}>정규 분포</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>
        );
    }, [detailScale, detailVisualMode]);

    const detailOptions = useMemo(() => {
        if (isDetailDistributionChart) {
            if (!detailDistributionAxisScale || !detailDistributionData) {
                return {
                    chart: {
                        type: 'line',
                        background: 'transparent',
                        foreColor: '#a3a3a3',
                        toolbar: { show: false },
                        zoom: { enabled: false },
                        animations: { enabled: true, easing: 'easeinout', speed: 280 },
                    },
                    legend: { show: false },
                    noData: {
                        text: detailNoDataText,
                        align: 'center',
                        verticalAlign: 'middle',
                        style: { color: '#a3a3a3' },
                    },
                    grid: {
                        borderColor: 'rgba(163, 163, 163, 0.22)',
                        strokeDashArray: 4,
                        padding: {
                            left: 10,
                            right: 16,
                        },
                    },
                    xaxis: {
                        type: 'numeric',
                        min: -8,
                        max: 8,
                        tickAmount: 16,
                        decimalsInFloat: 0,
                        labels: {
                            rotate: 0,
                            trim: false,
                            style: {
                                colors: '#a3a3a3',
                                fontSize: '10px',
                            },
                        },
                        title: {
                            text: '측정값 스케일',
                            style: { color: '#a3a3a3' },
                        },
                        tooltip: { enabled: false },
                    },
                    yaxis: {
                        min: 0,
                        max: 1.08,
                        tickAmount: 6,
                        labels: {
                            style: { colors: '#a3a3a3' },
                            formatter: (value) => formatNumber(value, 2),
                        },
                        title: {
                            text: '실측 밀도(KDE)',
                            style: { color: '#a3a3a3' },
                        },
                    },
                    tooltip: {
                        enabled: false,
                    },
                };
            }

            const nominalAnnotationX = detailDistributionAxisScale?.toDisplayValue(
                detailDistributionData?.nominal,
            );
            const meanAnnotationX = detailDistributionAxisScale?.toDisplayValue(
                detailDistributionData?.measuredMean,
            );

            return {
                chart: {
                    type: 'line',
                    background: 'transparent',
                    foreColor: '#a3a3a3',
                    toolbar: { show: false },
                    zoom: { enabled: false },
                    animations: { enabled: true, easing: 'easeinout', speed: 280 },
                },
                legend: {
                    show: true,
                    position: 'top',
                    horizontalAlign: 'left',
                    labels: {
                        colors: '#bcbcbc',
                    },
                },
                noData: {
                    text: detailNoDataText,
                    align: 'center',
                    verticalAlign: 'middle',
                    style: { color: '#a3a3a3' },
                },
                grid: {
                    borderColor: 'rgba(163, 163, 163, 0.22)',
                    strokeDashArray: 4,
                    padding: {
                        left: 10,
                        right: 16,
                    },
                },
                stroke: {
                    curve: 'smooth',
                    width: [2.2, 0],
                    colors: ['#8bc4ff', '#ffd18b'],
                },
                markers: {
                    size:
                        distributionPointMode === DISTRIBUTION_POINT_RUG
                            ? [0, 3.4]
                            : [0, 4.2],
                    colors: ['#8bc4ff', '#ffd18b'],
                    strokeColors: ['#8bc4ff', '#fff2d4'],
                    strokeWidth: [0, 1],
                    hover: {
                        sizeOffset: 1,
                    },
                },
                annotations: {
                    xaxis: [
                        {
                            x: 0,
                            borderColor: 'rgba(226,232,240,0.34)',
                            borderWidth: 1,
                            strokeDashArray: 3,
                            label: {
                                text: 'N',
                                style: {
                                    color: '#f2f4f8',
                                    background: 'rgba(69,80,95,0.95)',
                                },
                            },
                        },
                        ...(nominalAnnotationX !== null && Math.abs(nominalAnnotationX) > 0.001
                            ? [
                                  {
                                      x: nominalAnnotationX,
                                      borderColor: 'rgba(142,197,255,0.36)',
                                      borderWidth: 1,
                                      strokeDashArray: 5,
                                      label: {
                                          text: 'nominal',
                                          style: {
                                              color: '#dff3ff',
                                              background: 'rgba(36,63,83,0.94)',
                                          },
                                      },
                                  },
                              ]
                            : []),
                        ...(meanAnnotationX !== null
                            ? [
                                  {
                                      x: meanAnnotationX,
                                      borderColor: 'rgba(255,206,120,0.42)',
                                      borderWidth: 1,
                                      strokeDashArray: 4,
                                      label: {
                                          text: 'mean',
                                          style: {
                                              color: '#fff2d4',
                                              background: 'rgba(94,66,26,0.94)',
                                          },
                                      },
                                  },
                              ]
                            : []),
                        {
                            x: -6,
                            borderColor: 'rgba(255,120,120,0.26)',
                            label: {
                                text: 'LSL',
                                style: {
                                    color: '#ffd7d7',
                                    background: 'rgba(86,33,33,0.92)',
                                },
                            },
                        },
                        {
                            x: 6,
                            borderColor: 'rgba(255,120,120,0.26)',
                            label: {
                                text: 'USL',
                                style: {
                                    color: '#ffd7d7',
                                    background: 'rgba(86,33,33,0.92)',
                                },
                            },
                        },
                    ],
                    yaxis: [
                        {
                            y: 0,
                            borderColor: 'rgba(226,232,240,0.16)',
                        },
                    ],
                },
                xaxis: {
                    type: 'numeric',
                    min: detailDistributionAxisScale.minDisplay,
                    max: detailDistributionAxisScale.maxDisplay,
                    tickAmount: 16,
                    decimalsInFloat: 0,
                    labels: {
                        rotate: 0,
                        trim: false,
                        style: {
                            colors: '#a3a3a3',
                            fontSize: '10px',
                        },
                        formatter: (value) =>
                            formatDistributionAxisLabel(value, detailDistributionAxisScale),
                    },
                    title: {
                        text: '측정값 스케일',
                        style: { color: '#a3a3a3' },
                    },
                    tooltip: { enabled: false },
                },
                yaxis: {
                    min: 0,
                    max: 1.08,
                    tickAmount: 6,
                    labels: {
                        style: { colors: '#a3a3a3' },
                        formatter: (value) => formatNumber(value, 2),
                    },
                    title: {
                        text: '실측 밀도(KDE)',
                        style: { color: '#a3a3a3' },
                    },
                },
                tooltip: {
                    enabledOnSeries: [1],
                    shared: false,
                    intersect: true,
                    followCursor: true,
                    marker: {
                        show: true,
                    },
                    custom: ({ seriesIndex, dataPointIndex, w }) => {
                        const point = w?.config?.series?.[seriesIndex]?.data?.[dataPointIndex];
                        const pointMeta = point?.meta;

                        if (!pointMeta) {
                            return '<div style="display:none; opacity:0;"></div>';
                        }

                        return buildDistributionTooltipMarkup({
                            pointMeta,
                            distributionMeta: detailDistributionData,
                            detailScale,
                            baseDate: detailDistributionBaseDate,
                            pointMode: distributionPointMode,
                            isOneSidedUpperTolerance: isDetailOneSidedUpperTolerance,
                        });
                    },
                },
            };
        }

        return {
            chart: {
                type: isDetailDayChart ? 'line' : 'candlestick',
                background: 'transparent',
                foreColor: '#a3a3a3',
                toolbar: { show: false },
                zoom: { enabled: false },
                animations: { enabled: true, easing: 'easeinout', speed: 280 },
                events: {
                    dataPointSelection: (event, __, config) => {
                        if (!isPrimarySelectionEvent(event)) {
                            return;
                        }

                        if (detailScale !== DETAIL_SCALE_MONTH) {
                            return;
                        }

                        const nextIndex = Number(config?.dataPointIndex);
                        if (!Number.isInteger(nextIndex) || nextIndex < 0) {
                            return;
                        }

                        const nextPoint = detailPaddedSlots[nextIndex]?.point;
                        const nextMeta = nextPoint?.meta;
                        const nextBaseDate =
                            nextMeta?.bucketDate ?? nextMeta?.bucketDateTime ?? '';
                        const nextDate = toInputDateValue(nextBaseDate);
                        const nextMonth = toInputMonthValue(nextBaseDate);

                        if (!nextMeta || !nextDate) {
                            return;
                        }

                        setSelectedMonth(nextMonth);
                        setSelectedDate(nextDate);
                        setDetailScale(DETAIL_SCALE_DAY);
                    },
                },
            },
            legend: {
                show: false,
            },
            noData: {
                text: detailNoDataText,
                align: 'center',
                verticalAlign: 'middle',
                style: { color: '#a3a3a3' },
            },
            grid: {
                borderColor: 'rgba(163, 163, 163, 0.22)',
                strokeDashArray: 4,
                padding: {
                    left: 10,
                    right: 6,
                },
            },
            plotOptions: isDetailDayChart
                ? {}
                : {
                      candlestick: {
                          colors: {
                              upward: CANDLE_COLOR_STABLE,
                              downward: CANDLE_COLOR_RISK,
                          },
                          wick: {
                              useFillColor: true,
                          },
                      },
                  },
            stroke: isDetailDayChart
                ? {
                      curve: 'straight',
                      width: 2,
                      colors: ['#7dd3fc'],
                  }
                : {
                      width: 1,
                  },
            markers: isDetailDayChart
                ? {
                      size: 4,
                      colors: ['#7dd3fc'],
                      strokeColors: '#d8f3ff',
                      strokeWidth: 1,
                      hover: {
                          sizeOffset: 1,
                      },
                  }
                : {
                      size: 0,
                  },
            annotations: {
                yaxis: [
                    {
                        y: detailYAxisScale.toDisplayValue(detailYAxisScale.centerRaw),
                        borderColor: 'rgba(226,232,240,0.28)',
                    },
                    {
                        y: detailYAxisScale.toDisplayValue(detailYAxisScale.uslRaw),
                        borderColor: 'rgba(255,120,120,0.26)',
                    },
                    {
                        y: detailYAxisScale.toDisplayValue(detailYAxisScale.lslRaw),
                        borderColor: 'rgba(255,120,120,0.26)',
                    },
                ],
            },
            xaxis: {
                type: 'category',
                categories: detailPaddedSlots.map((slot) => slot.key),
                tickPlacement: 'on',
                labels: {
                    rotate: -45,
                    rotateAlways: true,
                    hideOverlappingLabels: false,
                    trim: false,
                    showDuplicates: true,
                    offsetY: 8,
                    minHeight: 56,
                    maxHeight: 120,
                    style: {
                        colors: '#a3a3a3',
                        fontSize: '10px',
                    },
                    formatter: (value) => detailLabelMap.get(value) || '',
                },
                tooltip: { enabled: false },
            },
            yaxis: {
                min: detailYAxisScale.minDisplay,
                max: detailYAxisScale.maxDisplay,
                stepSize: detailYAxisScale.stepSize,
                labels: {
                    style: { colors: '#a3a3a3' },
                    formatter: (value) => {
                        const rawValue = detailYAxisScale.toRawValue(value);
                        return formatNumber(rawValue, 4);
                    },
                },
                title: {
                    text: '실측값',
                    style: { color: '#a3a3a3' },
                },
            },
            tooltip: {
                enabledOnSeries: [0],
                shared: false,
                intersect: true,
                followCursor: true,
                marker: {
                    show: isDetailDayChart,
                },
                custom: ({ seriesIndex, dataPointIndex, w }) => {
                    const point = w?.config?.series?.[seriesIndex]?.data?.[dataPointIndex];
                    const slot = Number.isInteger(dataPointIndex)
                        ? detailPaddedSlots[dataPointIndex]
                        : null;
                    const meta = point?.meta || slot?.point?.meta;

                    if (!meta) {
                        return '<div style="display:none; opacity:0;"></div>';
                    }

                    return buildDetailTooltipMarkup({
                        meta,
                        detailScale,
                        projectReportCountLabel,
                    });
                },
            },
        };
    }, [
        detailDistributionAxisScale,
        detailDistributionBaseDate,
        detailDistributionData,
        detailLabelMap,
        detailNoDataText,
        detailPaddedSlots,
        detailScale,
        detailYAxisScale,
        distributionPointMode,
        isDetailDayChart,
        isDetailDistributionChart,
        isDetailOneSidedUpperTolerance,
        projectReportCountLabel,
    ]);

    const projectLabel = useMemo(() => {
        return project
            ? `선택 프로젝트 : ${project?.projNum || '-'} | ${project?.projName || '-'}`
            : '프로젝트 리스트에서 선택 후 이동했습니다.';
    }, [project]);

    const registeredReportChipLabel = useMemo(
        () => `등록된 성적서 : ${projectReportCountLabel}개`,
        [projectReportCountLabel],
    );

    const chartModeTitle = useMemo(
        () =>
            activeChartView === 'detail'
                ? detailScale === DETAIL_SCALE_DAY
                    ? `세부 일 차트 (${detailVisualModeLabel}) : ${selectedCharacteristic?.charNo || selectedCharacteristic?.label || '-'}`
                    : `세부 월 차트 (${detailVisualModeLabel}) : ${selectedCharacteristic?.charNo || selectedCharacteristic?.label || '-'}`
                : '메인 차트',
        [
            activeChartView,
            detailScale,
            detailVisualModeLabel,
            selectedCharacteristic?.charNo,
            selectedCharacteristic?.label,
        ],
    );

    const activeChartModeLabel = useMemo(
        () =>
            activeChartView === 'detail'
                ? detailScale === DETAIL_SCALE_DAY
                    ? `세부 일 차트 모드 (${detailVisualModeLabel})`
                    : `세부 월 차트 모드 (${detailVisualModeLabel})`
                : '메인 차트 모드',
        [activeChartView, detailScale, detailVisualModeLabel],
    );

    const yAxisRangeLabel = useMemo(() => {
        return '하단 여백 1칸 + 0% / 6σ / 5σ / 4σ / 3σ / 2σ / 1σ / 100%';
    }, []);

    const infoSummaryItems = useMemo(
        () => [
            `데이터 소스: ${sourceLabel}`,
            `특성치 수: ${candleData.length}`,
            `측정값 수: ${totalMeasuredCount}`,
            `선택 프로젝트 성적서 수: ${projectReportCountLabel}`,
            `현재 모드: ${activeChartModeLabel}`,
            `세부 대상: ${selectedCharacteristic?.label || '-'}`,
            `세부 스케일: ${detailScaleLabel}`,
            `세부 표시: ${detailVisualModeLabel}`,
            isDetailDistributionChart
                ? `정규분포 해석: ${detailDistributionInterpretationLabel}`
                : null,
            '메인 막대: Cpk -> 3×Cpk -> 불량률',
            `Y축 범위: ${yAxisRangeLabel}`,
            `기본 표시 특성치 수: ${DEFAULT_VISIBLE_CANDLE_COUNT}개`,
            isBackendLoading ? '백엔드 통계 로딩 중' : null,
        ].filter(Boolean),
        [
            sourceLabel,
            candleData.length,
            totalMeasuredCount,
            projectReportCountLabel,
            activeChartModeLabel,
            selectedCharacteristic?.label,
            detailScaleLabel,
            detailVisualModeLabel,
            detailDistributionInterpretationLabel,
            isDetailDistributionChart,
            yAxisRangeLabel,
            isBackendLoading,
        ],
    );

    const series = useMemo(
        () => [
            {
                name: '불량률',
                type: 'bar',
                data: mainBarSeriesData,
            },
        ],
        [mainBarSeriesData],
    );

    const options = useMemo(
        () => ({
            chart: {
                type: 'bar',
                background: 'transparent',
                foreColor: '#a3a3a3',
                toolbar: { show: false },
                zoom: { enabled: false },
                animations: { enabled: true, easing: 'easeinout', speed: 350 },
                events: {
                    dataPointSelection: (event, __, config) => {
                        if (!isPrimarySelectionEvent(event)) {
                            return;
                        }

                        const seriesIndex = Number(config?.seriesIndex);
                        const nextIndex = Number(config?.dataPointIndex);

                        if (seriesIndex !== 0 || !Number.isInteger(nextIndex) || nextIndex < 0) {
                            return;
                        }

                        const nextPoint = mainChartSlots[nextIndex]?.point;
                        if (!nextPoint?.meta) {
                            return;
                        }

                        startDetailReadyMeasurement(nextPoint.meta);
                        startTransition(() => {
                            setSelectedCharacteristic(nextPoint.meta);
                            setDetailScale(DETAIL_SCALE_MONTH);
                            setSelectedMonth('');
                            setSelectedDate('');
                            setActiveChartView('detail');
                        });
                    },
                },
            },
            legend: {
                show: false,
            },
            noData: {
                text: '표시할 측정 데이터가 없습니다.',
                align: 'center',
                verticalAlign: 'middle',
                style: { color: '#a3a3a3' },
            },
            grid: {
                borderColor: 'rgba(163, 163, 163, 0.22)',
                strokeDashArray: 4,
                padding: {
                    left: 10,
                    right: 6,
                },
            },
            plotOptions: {
                bar: {
                    columnWidth: '58%',
                    borderRadius: 5,
                    borderRadiusApplication: 'end',
                },
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                width: 1,
                colors: ['rgba(0,0,0,0)'],
            },
            annotations: {
                yaxis: Array.from({ length: MAIN_CHART_AXIS_MAX + 1 }, (_, index) => ({
                    y: index,
                    borderColor:
                        index === 0
                            ? 'rgba(226,232,240,0.38)'
                            : 'rgba(163, 163, 163, 0.14)',
                })),
            },
            xaxis: {
                type: 'category',
                categories: mainChartSlots.map((slot) => slot.key),
                tickPlacement: 'on',
                labels: {
                    rotate: -45,
                    rotateAlways: true,
                    hideOverlappingLabels: false,
                    trim: false,
                    showDuplicates: true,
                    offsetY: 5,
                    minHeight: 56,
                    maxHeight: 120,
                    style: { colors: '#a3a3a3' },
                    formatter: (value) => {
                        return slotLabelMap.get(value) || '';
                    },
                },
                tooltip: { enabled: false },
            },
            yaxis: {
                min: MAIN_CHART_AXIS_MIN,
                max: MAIN_CHART_AXIS_MAX,
                stepSize: MAIN_CHART_AXIS_STEP,
                forceNiceScale: false,
                labels: {
                    style: { colors: '#a3a3a3' },
                    formatter: formatMainChartYAxisLabel,
                },
                title: {
                    text: '불량률 / 시그마 수준',
                    style: { color: '#a3a3a3' },
                },
            },
            tooltip: {
                enabledOnSeries: [0],
                shared: false,
                intersect: true,
                followCursor: true,
                marker: {
                    show: false,
                },
                custom: ({ seriesIndex, dataPointIndex, w }) => {
                    const point = w?.config?.series?.[seriesIndex]?.data?.[dataPointIndex];
                    const slot =
                        Number.isInteger(dataPointIndex) ? mainChartSlots[dataPointIndex] : null;
                    const meta = point?.meta || slot?.point?.meta;

                    if (!meta) {
                        return '<div style="display:none; opacity:0;"></div>';
                    }

                    return buildMainTooltipMarkup({
                        meta,
                        projectReportCountLabel,
                    });
                },
            },
        }),
        [mainChartSlots, projectReportCountLabel, slotLabelMap],
    );

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                p: 3,
                gap: 2,
                bgcolor: 'background.default',
                color: 'neutral.300',
            }}
        >
            <UnifiedHeaderBar
                title={chartModeTitle}
                titleVariant="h5"
                onBack={handleBack}
                onHome={handleHome}
                showNavigationButtons
                titleAdornment={
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.55,
                            minWidth: 0,
                        }}
                    >
                        <IconButton
                            size="small"
                            onClick={handleInfoIconClick}
                            sx={{
                                color: 'info.light',
                                p: 0.35,
                                '&:hover': {
                                    color: 'info.main',
                                    bgcolor: 'rgba(33,150,243,0.12)',
                                },
                            }}
                            title="차트 안내 보기"
                        >
                            <InfoOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <Chip
                            size="small"
                            label={projectLabel}
                            sx={{
                                maxWidth: 'clamp(180px, 34vw, 420px)',
                                height: 24,
                                borderRadius: '999px',
                                border: '1px solid rgba(163,163,163,0.22)',
                                bgcolor: 'rgba(28,31,36,0.78)',
                                color: '#d4d4d8',
                                '& .MuiChip-label': {
                                    px: 1,
                                    fontSize: '0.72rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                },
                            }}
                            title={projectLabel}
                        />
                        <Chip
                            size="small"
                            label={registeredReportChipLabel}
                            sx={{
                                height: 24,
                                borderRadius: '999px',
                                border: '1px solid rgba(102,187,106,0.28)',
                                bgcolor: 'rgba(20,45,31,0.82)',
                                color: '#ccebd5',
                                '& .MuiChip-label': {
                                    px: 1,
                                    fontSize: '0.72rem',
                                    whiteSpace: 'nowrap',
                                },
                            }}
                            title={registeredReportChipLabel}
                        />
                    </Box>
                }
                rightSlot={
                    <>
                        {chartNotifications.length > 0 && (
                            <IconButton
                                size="small"
                                onClick={handleMessageIconClick}
                                sx={{
                                    color: chartMessageIconColor,
                                    '&:hover': {
                                        bgcolor:
                                            highestChartNotificationSeverity ===
                                            CHART_NOTIFICATION_SEVERITY.ERROR
                                                ? 'rgba(255,95,109,0.12)'
                                                : highestChartNotificationSeverity ===
                                                    CHART_NOTIFICATION_SEVERITY.WARNING
                                                  ? 'rgba(255,183,77,0.12)'
                                                  : highestChartNotificationSeverity ===
                                                      CHART_NOTIFICATION_SEVERITY.SUCCESS
                                                    ? 'rgba(102,187,106,0.12)'
                                                    : 'rgba(41,182,246,0.12)',
                                    },
                                }}
                                title="메시지 보기"
                            >
                                <Badge
                                    badgeContent={chartNotifications.length}
                                    max={99}
                                    sx={{
                                        '& .MuiBadge-badge': {
                                            bgcolor: chartMessageIconColor,
                                            color: '#0b1118',
                                            fontWeight: 700,
                                        },
                                    }}
                                >
                                    <MessageIcon fontSize="small" />
                                </Badge>
                            </IconButton>
                        )}
                    </>
                }
            />

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    minHeight: 0,
                    minWidth: 0,
                    gap: 2,
                }}
            >
                {activeChartView === 'detail' ? (
                    <DetailCharacteristicChart
                        chartWidthRatio={detailChartWidthRatio}
                        options={detailOptions}
                        series={detailSeries}
                        overlayControls={detailOverlayControls}
                        onBack={handleBack}
                    />
                ) : (
                    <MainCharacteristicChart
                        chartWidthRatio={chartWidthRatio}
                        options={options}
                        series={series}
                        yAxisHoverTooltipResolver={formatMainChartExpectedDefectRateTooltip}
                    />
                )}
            </Box>

            {isFloatingChartNotification ? (
                <ChartFloatingNotification
                    open={isChartNotificationOpen}
                    anchorEl={detailPerfAnchorRef.current}
                    notification={activeChartNotification}
                    onClose={handleChartNotificationClose}
                />
            ) : (
                <Snackbar
                    open={isChartNotificationOpen}
                    autoHideDuration={getChartNotificationAutoHideDuration(
                        activeChartNotification?.severity,
                    )}
                    onClose={handleChartNotificationClose}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{
                        mt: '84px',
                        mr: 3,
                    }}
                >
                    <Alert
                        severity={
                            activeChartNotification?.severity || CHART_NOTIFICATION_SEVERITY.INFO
                        }
                        onClose={handleChartNotificationClose}
                        sx={{
                            bgcolor: activeChartNotificationStyle.bgcolor,
                            color: activeChartNotificationStyle.color,
                            border: activeChartNotificationStyle.border,
                            boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
                            opacity: 1,
                            '& .MuiAlert-icon': {
                                color: activeChartNotificationStyle.iconColor,
                            },
                            '& .MuiAlert-action': {
                                color: activeChartNotificationStyle.actionColor,
                            },
                        }}
                    >
                        {activeChartNotification?.message || ''}
                    </Alert>
                </Snackbar>
            )}

            <Popover
                open={Boolean(messageAnchorEl)}
                anchorEl={messageAnchorEl}
                onClose={handleMessagePopoverClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            minWidth: '320px',
                            maxWidth: '420px',
                            backgroundColor: 'transparent',
                            boxShadow: 'none',
                            overflow: 'visible',
                        },
                    },
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {chartNotifications.map((notification) => (
                        <Alert
                            key={notification.id}
                            severity={notification.severity}
                            sx={{
                                bgcolor:
                                    notification.severity === CHART_NOTIFICATION_SEVERITY.ERROR
                                        ? '#42161a'
                                        : notification.severity ===
                                            CHART_NOTIFICATION_SEVERITY.WARNING
                                          ? '#3b2a14'
                                          : notification.severity ===
                                              CHART_NOTIFICATION_SEVERITY.SUCCESS
                                            ? '#163324'
                                            : '#0f2942',
                                color:
                                    notification.severity === CHART_NOTIFICATION_SEVERITY.ERROR
                                        ? '#ffdadd'
                                        : notification.severity ===
                                            CHART_NOTIFICATION_SEVERITY.WARNING
                                          ? '#ffe8c2'
                                          : notification.severity ===
                                              CHART_NOTIFICATION_SEVERITY.SUCCESS
                                            ? '#d4f5de'
                                            : '#e3f2fd',
                                border:
                                    notification.severity === CHART_NOTIFICATION_SEVERITY.ERROR
                                        ? '1px solid #ff5f6d'
                                        : notification.severity ===
                                            CHART_NOTIFICATION_SEVERITY.WARNING
                                          ? '1px solid #ffb74d'
                                          : notification.severity ===
                                              CHART_NOTIFICATION_SEVERITY.SUCCESS
                                            ? '1px solid #66bb6a'
                                            : '1px solid #29b6f6',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
                                '& .MuiAlert-icon': {
                                    color:
                                        notification.severity ===
                                        CHART_NOTIFICATION_SEVERITY.ERROR
                                            ? '#ff5f6d'
                                            : notification.severity ===
                                                CHART_NOTIFICATION_SEVERITY.WARNING
                                              ? '#ffb74d'
                                              : notification.severity ===
                                                  CHART_NOTIFICATION_SEVERITY.SUCCESS
                                                ? '#66bb6a'
                                                : '#29b6f6',
                                },
                            }}
                        >
                            <Typography variant="body2" sx={{ color: 'inherit' }}>
                                {notification.message}
                            </Typography>
                        </Alert>
                    ))}
                </Box>
            </Popover>

            <Popover
                open={isInfoSnackbarOpen}
                anchorEl={infoAnchorEl}
                onClose={handleInfoSnackbarClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            backgroundColor: 'transparent',
                            boxShadow: 'none',
                            overflow: 'visible',
                        },
                    },
                }}
            >
                <Alert
                    severity="info"
                    onClose={handleInfoSnackbarClose}
                    sx={{
                        bgcolor: '#0f2942',
                        color: '#e3f2fd',
                        border: '1px solid #29b6f6',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
                        opacity: 1,
                        '& .MuiAlert-icon': {
                            color: '#29b6f6',
                        },
                        '& .MuiAlert-action': {
                            color: '#81d4fa',
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: 'inherit' }}>
                            {INFO_MESSAGE}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                            {infoSummaryItems.map((item) => (
                                <Chip
                                    key={item}
                                    label={item}
                                    size="small"
                                    sx={{
                                        height: 'auto',
                                        borderRadius: '999px',
                                        border: '1px solid rgba(129,212,250,0.45)',
                                        bgcolor: 'rgba(15,41,66,0.75)',
                                        color: '#dff3ff',
                                        '& .MuiChip-label': {
                                            px: 1,
                                            py: 0.35,
                                            fontSize: '0.75rem',
                                            lineHeight: 1.35,
                                        },
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                </Alert>
            </Popover>
        </Box>
    );
};

export default Chart;
