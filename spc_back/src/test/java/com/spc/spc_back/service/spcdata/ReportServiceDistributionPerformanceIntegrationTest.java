package com.spc.spc_back.service.spcdata;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.YearMonth;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import com.spc.spc_back.dto.ApiRespDto;
import com.spc.spc_back.dto.spcdata.ChartDistributionRespDto;
import com.spc.spc_back.dto.spcdata.ChartDistributionSourceDto;
import com.spc.spc_back.entity.user.Role;
import com.spc.spc_back.entity.user.UserRole;
import com.spc.spc_back.repository.InspectionDataRepository;
import com.spc.spc_back.security.model.PrincipalUser;
import com.spc.spc_back.util.RoleAccessUtil;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(OrderAnnotation.class)
class ReportServiceDistributionPerformanceIntegrationTest extends AbstractReportPerformanceIntegrationTest {
    private static final int TARGET_SAMPLE_COUNT = 10_000;
    private static final long DISTRIBUTION_THRESHOLD_MS = 1_500L;
    private static final int WARM_UP_RUNS = 1;
    private static final int MEASURED_RUNS = 3;
    private static final int BATCH_SIZE = 500;

    @Autowired
    private ReportService reportService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private InspectionDataRepository inspectionDataRepository;

    private boolean performanceSeeded;

    @BeforeAll
    void setUpPerformanceFixture() {
        resetDatabase(jdbcTemplate);
    }

    @Test
    @Order(1)
    void distribution조회용인덱스가테스트스키마에존재한다() {
        Integer dataIndexCount = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM information_schema.statistics
                        WHERE table_schema = DATABASE()
                          AND table_name = 'insp_data_tb'
                          AND index_name = 'idx_insp_data_char_report_data'
                        """,
                Integer.class);
        Integer reportIndexCount = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM information_schema.statistics
                        WHERE table_schema = DATABASE()
                          AND table_name = 'insp_report_tb'
                          AND index_name = 'idx_insp_report_dt_report'
                        """,
                Integer.class);

        assertThat(dataIndexCount).isGreaterThan(0);
        assertThat(reportIndexCount).isGreaterThan(0);
    }

    @Test
    @Order(2)
    void distribution조회쿼리는의도한인덱스를사용한다() {
        List<ExplainPlanRow> explainRows = explainDistributionQuery();

        System.out.println("[DistributionExplain] rows=" + explainRows);

        assertThat(explainRows).isNotEmpty();
        assertThat(explainRows).extracting(ExplainPlanRow::table)
                .contains("idt", "irt")
                .doesNotContain("ct");
        assertThat(explainRows.get(0).table()).isEqualTo("irt");
        assertThat(explainRows).extracting(ExplainPlanRow::key)
                .contains("idx_insp_report_dt_report");
        assertThat(explainRows).filteredOn(row -> row.table() != null && ("idt".equals(row.table()) || "irt".equals(row.table())))
                .extracting(ExplainPlanRow::type)
                .doesNotContain("ALL");
        assertThat(explainRows).filteredOn(row -> "irt".equals(row.table()))
                .extracting(ExplainPlanRow::key)
                .containsExactly("idx_insp_report_dt_report");
        assertThat(explainRows).filteredOn(row -> "idt".equals(row.table()))
                .extracting(ExplainPlanRow::key)
                .containsAnyOf("fk_data_report", "idx_insp_data_char_report_data");
        assertThat(explainRows).extracting(ExplainPlanRow::extra)
                .filteredOn(Objects::nonNull)
                .noneMatch(extra -> extra.contains("Using filesort"));
    }

    @Test
    @Order(3)
    void distribution월조회는1만샘플기준성능임계값이내여야한다() {
        ensurePerformanceFixture();

        for (int index = 0; index < WARM_UP_RUNS; index++) {
            invokeDistribution();
        }

        long[] elapsedMsRuns = new long[MEASURED_RUNS];
        ApiRespDto<ChartDistributionRespDto> response = null;
        for (int index = 0; index < MEASURED_RUNS; index++) {
            long startedAt = System.nanoTime();
            response = invokeDistribution();
            elapsedMsRuns[index] = (System.nanoTime() - startedAt) / 1_000_000L;
        }

        long medianElapsedMs = calculateMedian(elapsedMsRuns);
        System.out.println("[DistributionPerf] runsMs=" + Arrays.toString(elapsedMsRuns)
                + ", medianMs=" + medianElapsedMs
                + ", sampleCount=" + response.getData().getSampleCount());

        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(response.getData()).isNotNull();
        assertThat(response.getData().getSampleCount()).isEqualTo((long) TARGET_SAMPLE_COUNT);
        assertThat(medianElapsedMs).isLessThanOrEqualTo(DISTRIBUTION_THRESHOLD_MS);
    }

    @Test
    @Order(4)
    void distribution성능은fetch와aggregate로분리계측할수있다() {
        ensurePerformanceFixture();

        for (int index = 0; index < WARM_UP_RUNS; index++) {
            invokeDistribution();
        }

        long[] totalElapsedMsRuns = new long[MEASURED_RUNS];
        long[] fetchElapsedMsRuns = new long[MEASURED_RUNS];
        long[] aggregateElapsedMsRuns = new long[MEASURED_RUNS];
        ApiRespDto<ChartDistributionRespDto> response = null;
        ChartDistributionRespDto aggregateResponse = null;
        for (int index = 0; index < MEASURED_RUNS; index++) {
            long startedAt = System.nanoTime();
            response = invokeDistribution();
            totalElapsedMsRuns[index] = (System.nanoTime() - startedAt) / 1_000_000L;

            DistributionSplitMeasurement measurement = measureDistributionSplit();
            fetchElapsedMsRuns[index] = measurement.fetchMs();
            aggregateElapsedMsRuns[index] = measurement.aggregateMs();
            aggregateResponse = measurement.response();
        }

        long totalMedianMs = calculateMedian(totalElapsedMsRuns);
        long fetchMedianMs = calculateMedian(fetchElapsedMsRuns);
        long aggregateMedianMs = calculateMedian(aggregateElapsedMsRuns);
        long splitMedianMs = fetchMedianMs + aggregateMedianMs;

        System.out.println("[DistributionPerfSplit] totalMs=" + Arrays.toString(totalElapsedMsRuns)
                + ", fetchMs=" + Arrays.toString(fetchElapsedMsRuns)
                + ", aggregateMs=" + Arrays.toString(aggregateElapsedMsRuns)
                + ", totalMedianMs=" + totalMedianMs
                + ", fetchMedianMs=" + fetchMedianMs
                + ", aggregateMedianMs=" + aggregateMedianMs
                + ", splitMedianMs=" + splitMedianMs);

        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(response.getData()).isNotNull();
        assertThat(response.getData().getSampleCount()).isEqualTo((long) TARGET_SAMPLE_COUNT);
        assertThat(aggregateResponse).isNotNull();
        assertThat(aggregateResponse.getSampleCount()).isEqualTo((long) TARGET_SAMPLE_COUNT);
        assertThat(fetchMedianMs).isGreaterThan(0L);
        assertThat(aggregateMedianMs).isGreaterThan(0L);
        assertThat(splitMedianMs).isLessThanOrEqualTo(totalMedianMs + 200L);
    }

    private PrincipalUser createPrincipalUser() {
        return PrincipalUser.builder()
                .userId(1L)
                .username("tester")
                .password("pw")
                .userRoleList(List.of(UserRole.builder()
                        .roleId(RoleAccessUtil.ROLE_ID_USER)
                        .role(Role.builder()
                                .roleId(RoleAccessUtil.ROLE_ID_USER)
                                .roleName(RoleAccessUtil.ROLE_NAME_USER)
                                .build())
                        .build()))
                .build();
    }

    private ApiRespDto<ChartDistributionRespDto> invokeDistribution() {
        return reportService.getCharacteristicDistribution(
                1L,
                101L,
                "month",
                "2026-03",
                createPrincipalUser());
    }

    private void ensurePerformanceFixture() {
        if (performanceSeeded) {
            return;
        }

        seedTargetDistributionSamples();
        seedNoiseSamples();
        analyzePerformanceTables(jdbcTemplate);
        performanceSeeded = true;
    }

    private void seedTargetDistributionSamples() {
        int additionalSampleCount = TARGET_SAMPLE_COUNT - 3;
        List<Object[]> reportBatchArgs = new ArrayList<>(additionalSampleCount);
        List<Object[]> dataBatchArgs = new ArrayList<>(additionalSampleCount);

        for (int index = 0; index < additionalSampleCount; index++) {
            long reportId = 3_000L + index;
            long dataId = 10_000L + index;
            LocalDateTime inspectionDateTime = LocalDateTime.of(2026, 3, (index % 28) + 1, index % 24, index % 60);
            double measuredValue = 9.5D + ((index % 200) * 0.005D);

            reportBatchArgs.add(new Object[] {
                    reportId,
                    1L,
                    "PERF-SN-" + reportId,
                    inspectionDateTime,
                    inspectionDateTime
            });
            dataBatchArgs.add(new Object[] {
                    dataId,
                    reportId,
                    101L,
                    measuredValue
            });
        }

        batchInsertReports(reportBatchArgs);
        batchInsertInspectionData(dataBatchArgs);
    }

    private void seedNoiseSamples() {
        List<Object[]> reportBatchArgs = new ArrayList<>();
        List<Object[]> dataBatchArgs = new ArrayList<>();

        for (int index = 0; index < 120; index++) {
            long reportId = 30_000L + index;
            long dataId = 40_000L + index;
            LocalDateTime inspectionDateTime = LocalDateTime.of(2026, 3, (index % 28) + 1, (index * 3) % 24, (index * 7) % 60);

            reportBatchArgs.add(new Object[] {
                    reportId,
                    1L,
                    "NOISE-CH102-" + reportId,
                    inspectionDateTime,
                    inspectionDateTime
            });
            dataBatchArgs.add(new Object[] {
                    dataId,
                    reportId,
                    102L,
                    19.0D + (index * 0.01D)
            });
        }

        for (int index = 0; index < 120; index++) {
            long reportId = 31_000L + index;
            long dataId = 41_000L + index;
            LocalDateTime inspectionDateTime = LocalDateTime.of(2026, 3, (index % 28) + 1, (index * 5) % 24, (index * 11) % 60);

            reportBatchArgs.add(new Object[] {
                    reportId,
                    2L,
                    "NOISE-PROJ2-" + reportId,
                    inspectionDateTime,
                    inspectionDateTime
            });
            dataBatchArgs.add(new Object[] {
                    dataId,
                    reportId,
                    201L,
                    29.0D + (index * 0.02D)
            });
        }

        batchInsertReports(reportBatchArgs);
        batchInsertInspectionData(dataBatchArgs);
    }

    private void batchInsertReports(List<Object[]> batchArgs) {
        String sql = """
                INSERT INTO insp_report_tb (
                    insp_report_id, proj_id, serial_no, insp_dt, create_dt, update_dt
                ) VALUES (?, ?, ?, ?, ?, NULL)
                """;
        batchUpdate(sql, batchArgs);
    }

    private void batchInsertInspectionData(List<Object[]> batchArgs) {
        String sql = """
                INSERT INTO insp_data_tb (
                    insp_data_id, insp_report_id, char_id, measured_value
                ) VALUES (?, ?, ?, ?)
                """;
        batchUpdate(sql, batchArgs);
    }

    private void batchUpdate(String sql, List<Object[]> batchArgs) {
        for (int start = 0; start < batchArgs.size(); start += BATCH_SIZE) {
            int end = Math.min(start + BATCH_SIZE, batchArgs.size());
            List<Object[]> chunk = batchArgs.subList(start, end);
            jdbcTemplate.batchUpdate(sql, chunk);
        }
    }

    private long calculateMedian(long[] values) {
        long[] sortedValues = Arrays.copyOf(values, values.length);
        Arrays.sort(sortedValues);
        return sortedValues[sortedValues.length / 2];
    }

    private DistributionSplitMeasurement measureDistributionSplit() {
        LocalDateTime startDateTime = YearMonth.parse("2026-03").atDay(1).atStartOfDay();
        LocalDateTime endDateTime = YearMonth.parse("2026-03").plusMonths(1).atDay(1).atStartOfDay();

        long fetchStartedAt = System.nanoTime();
        ChartDistributionSourceDto distributionMeta = inspectionDataRepository
                .selectDistributionMetaByProjIdAndCharId(1L, 101L)
                .orElse(null);
        List<ChartDistributionSourceDto> sourceRows = inspectionDataRepository
                .selectDistributionMeasuredValueListByCharIdAndPeriod(1L, 101L, startDateTime, endDateTime)
                .orElseGet(Collections::emptyList);
        long fetchMs = (System.nanoTime() - fetchStartedAt) / 1_000_000L;

        long aggregateStartedAt = System.nanoTime();
        ChartDistributionRespDto response = buildDistributionResponse(distributionMeta, sourceRows);
        long aggregateMs = (System.nanoTime() - aggregateStartedAt) / 1_000_000L;

        return new DistributionSplitMeasurement(fetchMs, aggregateMs, response);
    }

    private ChartDistributionRespDto buildDistributionResponse(
            ChartDistributionSourceDto distributionMeta,
            List<ChartDistributionSourceDto> sourceRows) {
        List<ChartDistributionSourceDto> filteredRows = sourceRows.stream()
                .filter(Objects::nonNull)
                .filter(row -> row.getMeasuredValue() != null)
                .sorted(Comparator
                        .comparing(ChartDistributionSourceDto::getInspDt)
                        .thenComparing(ChartDistributionSourceDto::getInspReportId))
                .toList();

        List<Double> measuredValues = filteredRows.stream()
                .map(ChartDistributionSourceDto::getMeasuredValue)
                .toList();
        ChartDistributionSourceDto metaRow = distributionMeta != null ? distributionMeta : filteredRows.get(0);

        return ChartDistributionRespDto.builder()
                .charId(metaRow.getCharId())
                .charNo(metaRow.getCharNo())
                .axis(metaRow.getAxis())
                .scale("month")
                .baseDate("2026-03")
                .nominal(metaRow.getNominal())
                .uTol(metaRow.getUTol())
                .lTol(metaRow.getLTol())
                .measuredMin(measuredValues.stream().min(Double::compareTo).orElse(null))
                .measuredMax(measuredValues.stream().max(Double::compareTo).orElse(null))
                .measuredMean(measuredValues.stream().mapToDouble(Double::doubleValue).average().orElse(0D))
                .measuredSigma(calculatePopulationSigma(measuredValues))
                .sampleCount((long) measuredValues.size())
                .measuredValues(measuredValues)
                .build();
    }

    private double calculatePopulationSigma(List<Double> values) {
        if (values.isEmpty()) {
            return 0D;
        }

        double mean = values.stream().mapToDouble(Double::doubleValue).average().orElse(0D);
        double variance = values.stream()
                .mapToDouble(value -> Math.pow(value - mean, 2))
                .average()
                .orElse(0D);

        return Math.sqrt(variance);
    }

    private List<ExplainPlanRow> explainDistributionQuery() {
        LocalDateTime startDateTime = YearMonth.parse("2026-03").atDay(1).atStartOfDay();
        LocalDateTime endDateTime = YearMonth.parse("2026-03").plusMonths(1).atDay(1).atStartOfDay();

        String sql = """
                EXPLAIN
                SELECT
                    idt.char_id as charId,
                    idt.measured_value as measuredValue,
                    irt.insp_report_id as inspReportId,
                    irt.serial_no as serialNo,
                    irt.insp_dt as inspDt
                FROM
                    insp_report_tb irt
                    STRAIGHT_JOIN insp_data_tb idt ON idt.insp_report_id = irt.insp_report_id
                WHERE
                    irt.insp_dt >= ?
                    AND irt.insp_dt < ?
                    AND idt.char_id = ?
                """;

        return jdbcTemplate.queryForList(sql, startDateTime, endDateTime, 101L).stream()
                .map(this::toExplainPlanRow)
                .toList();
    }

    private ExplainPlanRow toExplainPlanRow(Map<String, Object> row) {
        return new ExplainPlanRow(
                asString(row.get("table")),
                asString(row.get("type")),
                asString(row.get("key")),
                asString(row.get("Extra")));
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private record DistributionSplitMeasurement(
            long fetchMs,
            long aggregateMs,
            ChartDistributionRespDto response) {
    }

    private record ExplainPlanRow(
            String table,
            String type,
            String key,
            String extra) {
    }
}
