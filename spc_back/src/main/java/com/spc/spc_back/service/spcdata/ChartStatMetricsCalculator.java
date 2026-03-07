package com.spc.spc_back.service.spcdata;

import com.spc.spc_back.dto.spcdata.ChartStatRespDto;

final class ChartStatMetricsCalculator {
    private static final double SIGMA_PER_CPK = 3.0;
    private static final double MIN_CPK_FOR_DEFECT_RATE = 0.0;
    private static final double MAX_CPK_FOR_DEFECT_RATE = 2.0;
    private static final double MIN_PERCENT = 0.0;
    private static final double MAX_PERCENT = 100.0;

    private ChartStatMetricsCalculator() {
    }

    static ChartStatRespDto enrich(ChartStatRespDto source) {
        if (source == null) {
            return null;
        }

        Double usl = resolveUpperSpecLimit(source.getNominal(), source.getUTol());
        Double lsl = resolveLowerSpecLimit(source.getNominal(), source.getLTol());
        Double cpk = calculateCpk(source.getMeasuredMean(), source.getMeasuredSigma(), usl, lsl);
        Double sigmaLevel = cpk == null ? null : cpk * SIGMA_PER_CPK;
        Double goodRatePercent = calculateGoodRatePercent(sigmaLevel);
        Double defectRatePercent = calculateDefectRatePercent(goodRatePercent);

        source.setUsl(usl);
        source.setLsl(lsl);
        source.setCpk(cpk);
        source.setSigmaLevel(sigmaLevel);
        source.setGoodRatePercent(goodRatePercent);
        source.setDefectRatePercent(defectRatePercent);
        return source;
    }

    private static Double resolveUpperSpecLimit(Double nominal, Double uTol) {
        if (nominal == null || uTol == null) {
            return null;
        }
        return nominal + uTol;
    }

    private static Double resolveLowerSpecLimit(Double nominal, Double lTol) {
        if (nominal == null || lTol == null) {
            return null;
        }
        return nominal + lTol;
    }

    private static Double calculateCpk(Double mean, Double sigma, Double usl, Double lsl) {
        if (mean == null || sigma == null || sigma <= 0) {
            return null;
        }

        Double cpu = usl == null ? null : (usl - mean) / (SIGMA_PER_CPK * sigma);
        Double cpl = lsl == null ? null : (mean - lsl) / (SIGMA_PER_CPK * sigma);

        if (cpu == null && cpl == null) {
            return null;
        }
        if (cpu == null) {
            return cpl;
        }
        if (cpl == null) {
            return cpu;
        }
        return Math.min(cpu, cpl);
    }

    private static Double calculateGoodRatePercent(Double sigmaLevel) {
        if (sigmaLevel == null) {
            return MIN_PERCENT;
        }

        double cpk = sigmaLevel / SIGMA_PER_CPK;
        if (cpk <= MIN_CPK_FOR_DEFECT_RATE) {
            return MIN_PERCENT;
        }
        if (cpk >= MAX_CPK_FOR_DEFECT_RATE) {
            return MAX_PERCENT;
        }

        double goodRate = (2.0 * cumulativeStandardNormal(sigmaLevel) - 1.0) * MAX_PERCENT;
        return clampPercent(goodRate);
    }

    private static Double calculateDefectRatePercent(Double goodRatePercent) {
        if (goodRatePercent == null) {
            return MAX_PERCENT;
        }
        return clampPercent(MAX_PERCENT - goodRatePercent);
    }

    private static double clampPercent(double value) {
        return Math.max(MIN_PERCENT, Math.min(MAX_PERCENT, value));
    }

    private static double cumulativeStandardNormal(double zValue) {
        double x = Math.abs(zValue);
        double t = 1.0 / (1.0 + 0.2316419 * x);
        double density = 0.3989422804014327 * Math.exp(-0.5 * x * x);
        double polynomial = (((((1.330274429 * t) - 1.821255978) * t) + 1.781477937) * t
                - 0.356563782) * t + 0.319381530;
        double probability = 1.0 - density * polynomial * t;
        return zValue >= 0 ? probability : 1.0 - probability;
    }
}
