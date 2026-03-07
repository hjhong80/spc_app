package com.spc.spc_back.service.spcdata;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

import com.spc.spc_back.dto.spcdata.ChartStatRespDto;

class ChartStatMetricsCalculatorTest {

    @Test
    void enrichCalculatesMetricsForCenteredProcess() {
        ChartStatRespDto source = ChartStatRespDto.builder()
                .nominal(5.0)
                .uTol(3.0)
                .lTol(-3.0)
                .measuredMean(5.0)
                .measuredSigma(1.0)
                .build();

        ChartStatRespDto enriched = ChartStatMetricsCalculator.enrich(source);

        assertThat(enriched.getUsl()).isEqualTo(8.0);
        assertThat(enriched.getLsl()).isEqualTo(2.0);
        assertThat(enriched.getCpk()).isCloseTo(1.0, within(0.0001));
        assertThat(enriched.getSigmaLevel()).isCloseTo(3.0, within(0.0001));
        assertThat(enriched.getGoodRatePercent()).isCloseTo(99.73, within(0.05));
        assertThat(enriched.getDefectRatePercent()).isCloseTo(0.27, within(0.05));
    }

    @Test
    void enrichClampsNegativeCpkToHundredPercentDefectRate() {
        ChartStatRespDto source = ChartStatRespDto.builder()
                .nominal(5.0)
                .uTol(1.0)
                .lTol(-1.0)
                .measuredMean(7.0)
                .measuredSigma(0.5)
                .build();

        ChartStatRespDto enriched = ChartStatMetricsCalculator.enrich(source);

        assertThat(enriched.getCpk()).isNegative();
        assertThat(enriched.getSigmaLevel()).isNegative();
        assertThat(enriched.getGoodRatePercent()).isZero();
        assertThat(enriched.getDefectRatePercent()).isEqualTo(100.0);
    }

    @Test
    void enrichKeepsHighCapabilityWithinZeroDefectBounds() {
        ChartStatRespDto source = ChartStatRespDto.builder()
                .nominal(10.0)
                .uTol(4.0)
                .lTol(-4.0)
                .measuredMean(10.0)
                .measuredSigma(0.5)
                .build();

        ChartStatRespDto enriched = ChartStatMetricsCalculator.enrich(source);

        assertThat(enriched.getCpk()).isCloseTo(2.6667, within(0.001));
        assertThat(enriched.getSigmaLevel()).isGreaterThan(6.0);
        assertThat(enriched.getGoodRatePercent()).isEqualTo(100.0);
        assertThat(enriched.getDefectRatePercent()).isZero();
    }
}
