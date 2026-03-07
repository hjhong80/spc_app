package com.spc.spc_back.service.spcdata;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.stream.Collectors;

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
import com.spc.spc_back.dto.spcdata.ChartDetailRespDto;
import com.spc.spc_back.entity.user.Role;
import com.spc.spc_back.entity.user.UserRole;
import com.spc.spc_back.security.model.PrincipalUser;
import com.spc.spc_back.util.RoleAccessUtil;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(OrderAnnotation.class)
class ReportServiceDetailPerformanceIntegrationTest extends AbstractReportPerformanceIntegrationTest {
    private static final int TARGET_SAMPLE_COUNT = 10_000;
    private static final long DETAIL_THRESHOLD_MS = 1_500L;
    private static final int WARM_UP_RUNS = 1;
    private static final int MEASURED_RUNS = 3;
    private static final int BATCH_SIZE = 500;

    @Autowired
    private ReportService reportService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private boolean performanceSeeded;

    @BeforeAll
    void setUpPerformanceFixture() {
        resetDatabase(jdbcTemplate);
    }

    @Test
    @Order(1)
    void detail조회용인덱스가테스트스키마에존재한다() {
        Integer dataReportCharIndexCount = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM information_schema.statistics
                        WHERE table_schema = DATABASE()
                          AND table_name = 'insp_data_tb'
                          AND index_name = 'idx_insp_data_report_char_data'
                        """,
                Integer.class);
        Integer reportProjDateIndexCount = jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM information_schema.statistics
                        WHERE table_schema = DATABASE()
                          AND table_name = 'insp_report_tb'
                          AND index_name = 'idx_insp_report_proj_dt_report'
                        """,
                Integer.class);

        assertThat(dataReportCharIndexCount).isGreaterThan(0);
        assertThat(reportProjDateIndexCount).isGreaterThan(0);
    }

    @Test
    @Order(2)
    void detail조회쿼리는의도한실행계획을사용한다() {
        List<ExplainPlanRow> explainRows = explainMonthDetailQuery();

        System.out.println("[DetailExplain] rows=" + explainRows);

        assertThat(explainRows).isNotEmpty();
        assertThat(explainRows).extracting(ExplainPlanRow::table)
                .contains("irt", "idt", "ct");
        assertThat(explainRows).extracting(ExplainPlanRow::type)
                .doesNotContain("ALL");
        assertThat(explainRows).filteredOn(row -> "irt".equals(row.table()))
                .extracting(ExplainPlanRow::key)
                .containsAnyOf("idx_insp_report_proj_dt_report", "idx_insp_report_dt_report", "fk_report_proj")
                .isNotEmpty();
        assertThat(explainRows).filteredOn(row -> "idt".equals(row.table()))
                .extracting(ExplainPlanRow::key)
                .containsAnyOf("idx_insp_data_report_char_data", "fk_data_report", "idx_insp_data_char_report_data")
                .isNotEmpty();
        assertThat(explainRows).extracting(ExplainPlanRow::extra)
                .filteredOn(Objects::nonNull)
                .noneMatch(extra -> extra.contains("Using filesort"));
    }

    @Test
    @Order(3)
    void detail월조회는1만샘플기준성능임계값이내여야한다() {
        ensurePerformanceFixture();

        for (int index = 0; index < WARM_UP_RUNS; index++) {
            invokeMonthDetail();
        }

        long[] elapsedMsRuns = new long[MEASURED_RUNS];
        ApiRespDto<List<ChartDetailRespDto>> response = null;
        for (int index = 0; index < MEASURED_RUNS; index++) {
            long startedAt = System.nanoTime();
            response = invokeMonthDetail();
            elapsedMsRuns[index] = (System.nanoTime() - startedAt) / 1_000_000L;
        }

        long medianElapsedMs = calculateMedian(elapsedMsRuns);
        long totalSampleCount = response.getData().stream()
                .mapToLong(ChartDetailRespDto::getSampleCount)
                .sum();

        System.out.println("[DetailPerf] runsMs=" + Arrays.toString(elapsedMsRuns)
                + ", medianMs=" + medianElapsedMs
                + ", bucketCount=" + response.getData().size()
                + ", totalSampleCount=" + totalSampleCount);

        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(totalSampleCount).isEqualTo(TARGET_SAMPLE_COUNT);
        assertThat(medianElapsedMs).isLessThanOrEqualTo(DETAIL_THRESHOLD_MS);
    }

    @Test
    @Order(4)
    void detail월조회는fetch와aggregate로분리계측할수있다() {
        ensurePerformanceFixture();

        for (int index = 0; index < WARM_UP_RUNS; index++) {
            invokeMonthDetail();
        }

        long[] totalElapsedMsRuns = new long[MEASURED_RUNS];
        long[] fetchElapsedMsRuns = new long[MEASURED_RUNS];
        long[] aggregateElapsedMsRuns = new long[MEASURED_RUNS];
        ApiRespDto<List<ChartDetailRespDto>> response = null;
        List<ChartDetailRespDto> aggregateRows = null;
        for (int index = 0; index < MEASURED_RUNS; index++) {
            long startedAt = System.nanoTime();
            response = invokeMonthDetail();
            totalElapsedMsRuns[index] = (System.nanoTime() - startedAt) / 1_000_000L;

            DetailSplitMeasurement measurement = measureMonthDetailSplit();
            fetchElapsedMsRuns[index] = measurement.fetchMs();
            aggregateElapsedMsRuns[index] = measurement.aggregateMs();
            aggregateRows = measurement.rows();
        }

        long totalMedianMs = calculateMedian(totalElapsedMsRuns);
        long fetchMedianMs = calculateMedian(fetchElapsedMsRuns);
        long aggregateMedianMs = calculateMedian(aggregateElapsedMsRuns);
        long splitMedianMs = fetchMedianMs + aggregateMedianMs;

        System.out.println("[DetailPerfSplit] totalMs=" + Arrays.toString(totalElapsedMsRuns)
                + ", fetchMs=" + Arrays.toString(fetchElapsedMsRuns)
                + ", aggregateMs=" + Arrays.toString(aggregateElapsedMsRuns)
                + ", totalMedianMs=" + totalMedianMs
                + ", fetchMedianMs=" + fetchMedianMs
                + ", aggregateMedianMs=" + aggregateMedianMs
                + ", splitMedianMs=" + splitMedianMs);

        assertThat(response.getStatus()).isEqualTo("success");
        assertThat(aggregateRows).isNotEmpty();
        assertThat(fetchMedianMs).isGreaterThan(0L);
        assertThat(aggregateMedianMs).isGreaterThan(0L);
        assertThat(splitMedianMs).isLessThanOrEqualTo(totalMedianMs + 200L);
    }

    private ApiRespDto<List<ChartDetailRespDto>> invokeMonthDetail() {
        return reportService.getCharacteristicChartDetail(
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

        seedTargetDetailSamples();
        seedNoiseSamples();
        analyzePerformanceTables(jdbcTemplate);
        performanceSeeded = true;
    }

    private DetailSplitMeasurement measureMonthDetailSplit() {
        long fetchStartedAt = System.nanoTime();
        List<DetailSourceRow> sourceRows = fetchMonthDetailSourceRows();
        long fetchMs = (System.nanoTime() - fetchStartedAt) / 1_000_000L;

        long aggregateStartedAt = System.nanoTime();
        List<ChartDetailRespDto> rows = buildMonthlyDetailRows(sourceRows);
        long aggregateMs = (System.nanoTime() - aggregateStartedAt) / 1_000_000L;

        return new DetailSplitMeasurement(fetchMs, aggregateMs, rows);
    }

    private List<ChartDetailRespDto> buildMonthlyDetailRows(List<DetailSourceRow> sourceRows) {
        YearMonth targetMonth = YearMonth.parse("2026-03");
        Map<LocalDate, List<DetailSourceRow>> rowsByDate = sourceRows.stream()
                .filter(sourceRow -> YearMonth.from(sourceRow.inspDt()).equals(targetMonth))
                .collect(Collectors.groupingBy(
                        sourceRow -> sourceRow.inspDt().toLocalDate(),
                        TreeMap::new,
                        Collectors.toList()));

        List<ChartDetailRespDto> detailRows = new ArrayList<>();
        rowsByDate.forEach((bucketDate, bucketRows) -> {
            List<Double> measuredValues = bucketRows.stream()
                    .map(DetailSourceRow::measuredValue)
                    .filter(Objects::nonNull)
                    .toList();

            if (measuredValues.isEmpty()) {
                return;
            }

            DetailSourceRow firstRow = bucketRows.get(0);
            detailRows.add(ChartDetailRespDto.builder()
                    .charId(firstRow.charId())
                    .charNo(firstRow.charNo())
                    .axis(firstRow.axis())
                    .nominal(firstRow.nominal())
                    .uTol(firstRow.uTol())
                    .lTol(firstRow.lTol())
                    .bucketKey(bucketDate.toString())
                    .bucketLabel(bucketDate.format(java.time.format.DateTimeFormatter.ofPattern("MM-dd")))
                    .bucketDate(bucketDate)
                    .bucketDateTime(bucketDate.atStartOfDay())
                    .measuredMin(measuredValues.stream().min(Double::compareTo).orElse(null))
                    .measuredMax(measuredValues.stream().max(Double::compareTo).orElse(null))
                    .measuredMean(measuredValues.stream().mapToDouble(Double::doubleValue).average().orElse(0D))
                    .measuredSigma(calculatePopulationSigma(measuredValues))
                    .sampleCount((long) measuredValues.size())
                    .build());
        });

        return detailRows;
    }

    private List<DetailSourceRow> fetchMonthDetailSourceRows() {
        LocalDateTime startDateTime = YearMonth.parse("2026-03").atDay(1).atStartOfDay();
        LocalDateTime endDateTime = YearMonth.parse("2026-03").plusMonths(1).atDay(1).atStartOfDay();

        String sql = """
                SELECT
                    idt.char_id as charId,
                    ct.char_no as charNo,
                    ct.axis as axis,
                    ct.nominal as nominal,
                    ct.u_tol as uTol,
                    ct.l_tol as lTol,
                    irt.insp_report_id as inspReportId,
                    irt.serial_no as serialNo,
                    irt.insp_dt as inspDt,
                    idt.measured_value as measuredValue
                FROM
                    insp_report_tb irt
                    STRAIGHT_JOIN insp_data_tb idt ON idt.insp_report_id = irt.insp_report_id
                    INNER JOIN char_tb ct ON idt.char_id = ct.char_id
                WHERE
                    irt.proj_id = ?
                    AND irt.insp_dt >= ?
                    AND irt.insp_dt < ?
                    AND idt.char_id = ?
                """;

        return jdbcTemplate.query(sql,
                (rs, rowNum) -> new DetailSourceRow(
                        rs.getLong("charId"),
                        rs.getString("charNo"),
                        rs.getString("axis"),
                        rs.getDouble("nominal"),
                        rs.getDouble("uTol"),
                        rs.getDouble("lTol"),
                        rs.getLong("inspReportId"),
                        rs.getString("serialNo"),
                        rs.getTimestamp("inspDt").toLocalDateTime(),
                        rs.getDouble("measuredValue")),
                1L,
                startDateTime,
                endDateTime,
                101L).stream()
                .sorted(Comparator
                        .comparing(DetailSourceRow::inspDt)
                        .thenComparing(DetailSourceRow::inspReportId))
                .toList();
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

    private List<ExplainPlanRow> explainMonthDetailQuery() {
        LocalDateTime startDateTime = YearMonth.parse("2026-03").atDay(1).atStartOfDay();
        LocalDateTime endDateTime = YearMonth.parse("2026-03").plusMonths(1).atDay(1).atStartOfDay();

        String sql = """
                EXPLAIN
                SELECT
                    idt.char_id as charId,
                    ct.char_no as charNo,
                    ct.axis as axis,
                    ct.nominal as nominal,
                    ct.u_tol as uTol,
                    ct.l_tol as lTol,
                    irt.insp_report_id as inspReportId,
                    irt.serial_no as serialNo,
                    irt.insp_dt as inspDt,
                    idt.measured_value as measuredValue
                FROM
                    insp_report_tb irt
                    STRAIGHT_JOIN insp_data_tb idt ON idt.insp_report_id = irt.insp_report_id
                    INNER JOIN char_tb ct ON idt.char_id = ct.char_id
                WHERE
                    irt.proj_id = ?
                    AND irt.insp_dt >= ?
                    AND irt.insp_dt < ?
                    AND idt.char_id = ?
                """;

        return jdbcTemplate.queryForList(sql, 1L, startDateTime, endDateTime, 101L).stream()
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

    private void seedTargetDetailSamples() {
        int additionalSampleCount = TARGET_SAMPLE_COUNT - 3;
        List<Object[]> reportBatchArgs = new ArrayList<>(additionalSampleCount);
        List<Object[]> dataBatchArgs = new ArrayList<>(additionalSampleCount);

        for (int index = 0; index < additionalSampleCount; index++) {
            long reportId = 50_000L + index;
            long dataId = 60_000L + index;
            LocalDateTime inspectionDateTime = LocalDateTime.of(2026, 3, (index % 28) + 1, index % 24, index % 60);
            double measuredValue = 9.5D + ((index % 200) * 0.005D);

            reportBatchArgs.add(new Object[] {
                    reportId,
                    1L,
                    "DETAIL-PERF-SN-" + reportId,
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
            long reportId = 70_000L + index;
            long dataId = 80_000L + index;
            LocalDateTime inspectionDateTime = LocalDateTime.of(2026, 3, (index % 28) + 1, (index * 3) % 24, (index * 7) % 60);

            reportBatchArgs.add(new Object[] {
                    reportId,
                    1L,
                    "DETAIL-NOISE-CH102-" + reportId,
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
            long reportId = 71_000L + index;
            long dataId = 81_000L + index;
            LocalDateTime inspectionDateTime = LocalDateTime.of(2026, 3, (index % 28) + 1, (index * 5) % 24, (index * 11) % 60);

            reportBatchArgs.add(new Object[] {
                    reportId,
                    2L,
                    "DETAIL-NOISE-PROJ2-" + reportId,
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

    private record DetailSplitMeasurement(
            long fetchMs,
            long aggregateMs,
            List<ChartDetailRespDto> rows) {
    }

    private record ExplainPlanRow(
            String table,
            String type,
            String key,
            String extra) {
    }

    private record DetailSourceRow(
            Long charId,
            String charNo,
            String axis,
            Double nominal,
            Double uTol,
            Double lTol,
            Long inspReportId,
            String serialNo,
            LocalDateTime inspDt,
            Double measuredValue) {
    }
}
