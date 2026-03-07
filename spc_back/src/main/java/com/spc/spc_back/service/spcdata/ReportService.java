package com.spc.spc_back.service.spcdata;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.spc.spc_back.dto.ApiRespDto;
import com.spc.spc_back.dto.spcdata.ChartDetailSourceDto;
import com.spc.spc_back.dto.spcdata.ChartDistributionRespDto;
import com.spc.spc_back.dto.spcdata.ChartDistributionSourceDto;
import com.spc.spc_back.dto.spcdata.ChartDetailRespDto;
import com.spc.spc_back.dto.spcdata.ChartStatRespDto;
import com.spc.spc_back.dto.spcdata.ProjIdAndNameRespDto;
import com.spc.spc_back.entity.spcdata.Characteristic;
import com.spc.spc_back.entity.spcdata.InspectionData;
import com.spc.spc_back.entity.spcdata.InspectionReport;
import com.spc.spc_back.repository.InspectionDataRepository;
import com.spc.spc_back.repository.InspectionReportRepository;
import com.spc.spc_back.repository.ProjectRepository;
import com.spc.spc_back.security.model.PrincipalUser;
import com.spc.spc_back.util.RoleAccessUtil;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportService {
    private static final String DETAIL_SCALE_MONTH = "month";
    private static final String DETAIL_SCALE_DAY = "day";
    private static final DateTimeFormatter DETAIL_MONTH_LABEL_FORMATTER = DateTimeFormatter.ofPattern("MM-dd");
    private static final DateTimeFormatter DETAIL_DAY_LABEL_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final InspectionDataRepository inspectionDataRepository;
    private final InspectionReportRepository inspectionReportRepository;
    private final ProjectRepository projectRepository;

    public ApiRespDto<List<ProjIdAndNameRespDto>> getRecentlyProjectList(PrincipalUser principalUser) {
        if (!RoleAccessUtil.hasSpcDataAccess(principalUser)) {
            return forbiddenResponse();
        }

        List<Long> recentlyProjIdList = inspectionReportRepository.selectRecentlyProjId()
                .orElseGet(Collections::emptyList);
        if (recentlyProjIdList.isEmpty()) {
            return new ApiRespDto<>("success", "최근 사용 프로젝트가 없습니다.", Collections.emptyList());
        }

        Set<Long> distinctProjIdSet = new LinkedHashSet<>();
        for (Long projId : recentlyProjIdList) {
            if (projId == null || projId <= 0L) {
                continue;
            }
            distinctProjIdSet.add(projId);
        }

        if (distinctProjIdSet.isEmpty()) {
            return new ApiRespDto<>("success", "최근 사용 프로젝트가 없습니다.", Collections.emptyList());
        }

        List<ProjIdAndNameRespDto> recentlyProjectList = new ArrayList<>();
        for (Long projId : distinctProjIdSet) {
            projectRepository.selectProjectByProjId(projId)
                    .ifPresent(project -> {
                        ProjIdAndNameRespDto recentlyProjectRespDto = ProjIdAndNameRespDto.from(project);
                        if (recentlyProjectRespDto != null) {
                            recentlyProjectList.add(recentlyProjectRespDto);
                        }
                    });
        }

        return new ApiRespDto<>("success", "최근 사용 프로젝트 목록을 조회했습니다.", recentlyProjectList);
    }

    public ApiRespDto<List<ChartStatRespDto>> getProjectChartStats(Long projId, PrincipalUser principalUser) {
        if (!RoleAccessUtil.hasSpcDataAccess(principalUser)) {
            return forbiddenResponse();
        }

        if (projId == null || projId <= 0L) {
            return new ApiRespDto<>("failed", "유효한 프로젝트 ID(projId)가 필요합니다.", null);
        }

        if (projectRepository.selectProjectByProjId(projId).isEmpty()) {
            return new ApiRespDto<>("failed", "프로젝트를 찾을 수 없습니다. projId=" + projId, null);
        }

        List<ChartStatRespDto> chartStats = inspectionDataRepository.selectChartStatsByProjId(projId)
                .orElseGet(Collections::emptyList)
                .stream()
                .map(ChartStatMetricsCalculator::enrich)
                .toList();

        if (chartStats.isEmpty()) {
            return new ApiRespDto<>("success", "차트 통계 데이터가 없습니다.", Collections.emptyList());
        }

        return new ApiRespDto<>("success", "프로젝트 차트 통계를 조회했습니다.", chartStats);
    }

    public ApiRespDto<List<ChartDetailRespDto>> getCharacteristicChartDetail(
            Long projId,
            Long charId,
            String scale,
            String baseDate,
            PrincipalUser principalUser) {
        if (!RoleAccessUtil.hasSpcDataAccess(principalUser)) {
            return forbiddenResponse();
        }

        if (projId == null || projId <= 0L) {
            return new ApiRespDto<>("failed", "유효한 프로젝트 ID(projId)가 필요합니다.", null);
        }

        if (charId == null || charId <= 0L) {
            return new ApiRespDto<>("failed", "유효한 특성 ID(charId)가 필요합니다.", null);
        }

        if (projectRepository.selectProjectByProjId(projId).isEmpty()) {
            return new ApiRespDto<>("failed", "프로젝트를 찾을 수 없습니다. projId=" + projId, null);
        }

        String normalizedScale = normalizeDetailScale(scale);
        if (normalizedScale == null) {
            return new ApiRespDto<>("failed", "scale 값은 month 또는 day 이어야 합니다.", null);
        }

        if (DETAIL_SCALE_MONTH.equals(normalizedScale)) {
            try {
                List<ChartDetailRespDto> detailRows = buildMonthlyDetailRowsByQuery(projId, charId, baseDate);
                return new ApiRespDto<>("success", "특성 월단위 상세 차트를 조회했습니다.", detailRows);
            } catch (IllegalArgumentException exception) {
                return new ApiRespDto<>("failed", exception.getMessage(), null);
            }
        }

        List<InspectionReport> reportList = inspectionReportRepository.selectInspectionReportListByProjId(projId)
                .orElseGet(Collections::emptyList);
        if (reportList.isEmpty()) {
            return new ApiRespDto<>("success", "성적서 데이터가 없습니다.", Collections.emptyList());
        }

        Map<Long, InspectionReport> reportById = reportList.stream()
                .filter(Objects::nonNull)
                .filter(report -> report.getInspReportId() != null)
                .collect(Collectors.toMap(
                        InspectionReport::getInspReportId,
                        report -> report,
                        (left, right) -> left,
                        LinkedHashMap::new));

        List<ChartDetailSourceRow> sourceRows = inspectionDataRepository.selectInspectionDataListByCharId(charId)
                .orElseGet(Collections::emptyList)
                .stream()
                .map(inspectionData -> toChartDetailSourceRow(inspectionData, reportById))
                .filter(Objects::nonNull)
                .sorted(Comparator
                        .comparing(ChartDetailSourceRow::getInspDt)
                        .thenComparing(ChartDetailSourceRow::getInspReportId))
                .toList();

        if (sourceRows.isEmpty()) {
            return new ApiRespDto<>("success", "선택한 특성의 상세 데이터가 없습니다.", Collections.emptyList());
        }

        try {
            List<ChartDetailRespDto> detailRows = buildDailyDetailRows(sourceRows, baseDate);
            return new ApiRespDto<>("success", "특성 일단위 상세 차트를 조회했습니다.", detailRows);
        } catch (IllegalArgumentException exception) {
            return new ApiRespDto<>("failed", exception.getMessage(), null);
        }
    }

    public ApiRespDto<ChartDistributionRespDto> getCharacteristicDistribution(
            Long projId,
            Long charId,
            String scale,
            String baseDate,
            PrincipalUser principalUser) {
        if (!RoleAccessUtil.hasSpcDataAccess(principalUser)) {
            return forbiddenResponse();
        }

        if (projId == null || projId <= 0L) {
            return new ApiRespDto<>("failed", "유효한 프로젝트 ID(projId)가 필요합니다.", null);
        }

        if (charId == null || charId <= 0L) {
            return new ApiRespDto<>("failed", "유효한 특성 ID(charId)가 필요합니다.", null);
        }

        if (projectRepository.selectProjectByProjId(projId).isEmpty()) {
            return new ApiRespDto<>("failed", "프로젝트를 찾을 수 없습니다. projId=" + projId, null);
        }

        String normalizedScale = normalizeDetailScale(scale);
        if (normalizedScale == null) {
            return new ApiRespDto<>("failed", "scale 값은 month 또는 day 이어야 합니다.", null);
        }

        if (baseDate == null || baseDate.isBlank()) {
            return new ApiRespDto<>("failed", "baseDate는 필수입니다.", null);
        }

        LocalDateTime startDateTime;
        LocalDateTime endDateTime;
        try {
            if (DETAIL_SCALE_DAY.equals(normalizedScale)) {
                LocalDate targetDate = LocalDate.parse(baseDate.trim());
                startDateTime = targetDate.atStartOfDay();
                endDateTime = targetDate.plusDays(1).atStartOfDay();
            } else {
                YearMonth targetMonth = YearMonth.parse(baseDate.trim());
                startDateTime = targetMonth.atDay(1).atStartOfDay();
                endDateTime = targetMonth.plusMonths(1).atDay(1).atStartOfDay();
            }
        } catch (DateTimeParseException exception) {
            String message = DETAIL_SCALE_DAY.equals(normalizedScale)
                    ? "baseDate는 YYYY-MM-DD 형식이어야 합니다."
                    : "baseDate는 YYYY-MM 형식이어야 합니다.";
            return new ApiRespDto<>("failed", message, null);
        }

        ChartDistributionSourceDto distributionMeta = inspectionDataRepository
                .selectDistributionMetaByProjIdAndCharId(projId, charId)
                .orElse(null);

        List<ChartDistributionSourceDto> sourceRows = inspectionDataRepository
                .selectDistributionMeasuredValueListByCharIdAndPeriod(projId, charId, startDateTime, endDateTime)
                .orElseGet(Collections::emptyList)
                .stream()
                .filter(Objects::nonNull)
                .filter(row -> row.getMeasuredValue() != null)
                .sorted(Comparator
                        .comparing(ChartDistributionSourceDto::getInspDt)
                        .thenComparing(ChartDistributionSourceDto::getInspReportId))
                .toList();

        if (sourceRows.isEmpty()) {
            return new ApiRespDto<>("success", "선택한 기간의 분포 데이터가 없습니다.", null);
        }

        List<Double> measuredValues = sourceRows.stream()
                .map(ChartDistributionSourceDto::getMeasuredValue)
                .toList();
        ChartDistributionSourceDto metaRow = distributionMeta != null ? distributionMeta : sourceRows.get(0);
        ChartDistributionRespDto response = ChartDistributionRespDto.builder()
                .charId(metaRow.getCharId())
                .charNo(metaRow.getCharNo())
                .axis(metaRow.getAxis())
                .scale(normalizedScale)
                .baseDate(baseDate.trim())
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

        String message = DETAIL_SCALE_DAY.equals(normalizedScale)
                ? "특성 일단위 정규분포 데이터를 조회했습니다."
                : "특성 월단위 정규분포 데이터를 조회했습니다.";
        return new ApiRespDto<>("success", message, response);
    }

    public ApiRespDto<Long> getProjectReportCount(Long projId, PrincipalUser principalUser) {
        if (!RoleAccessUtil.hasSpcDataAccess(principalUser)) {
            return forbiddenResponse();
        }

        if (projId == null || projId <= 0L) {
            return new ApiRespDto<>("failed", "유효한 프로젝트 ID(projId)가 필요합니다.", null);
        }

        if (projectRepository.selectProjectByProjId(projId).isEmpty()) {
            return new ApiRespDto<>("failed", "프로젝트를 찾을 수 없습니다. projId=" + projId, null);
        }

        Long reportCount = inspectionReportRepository.selectInspectionReportCountByProjId(projId)
                .orElse(0L);

        return new ApiRespDto<>("success", "프로젝트 성적서 건수를 조회했습니다.", reportCount);
    }

    private <T> ApiRespDto<T> forbiddenResponse() {
        return new ApiRespDto<>("failed", RoleAccessUtil.SPC_ACCESS_DENIED_MESSAGE, null);
    }

    private String normalizeDetailScale(String scale) {
        if (scale == null || scale.isBlank()) {
            return DETAIL_SCALE_MONTH;
        }

        String normalized = scale.trim().toLowerCase();
        if (DETAIL_SCALE_MONTH.equals(normalized) || DETAIL_SCALE_DAY.equals(normalized)) {
            return normalized;
        }
        return null;
    }

    private ChartDetailSourceRow toChartDetailSourceRow(
            InspectionData inspectionData,
            Map<Long, InspectionReport> reportById) {
        if (inspectionData == null || inspectionData.getInspReportId() == null) {
            return null;
        }

        InspectionReport inspectionReport = reportById.get(inspectionData.getInspReportId());
        if (inspectionReport == null || inspectionReport.getInspDt() == null || inspectionData.getMeasuredValue() == null) {
            return null;
        }

        Characteristic characteristic = inspectionData.getCharacteristic();
        return new ChartDetailSourceRow(
                inspectionData.getCharId(),
                characteristic == null ? null : characteristic.getCharNo(),
                characteristic == null ? null : characteristic.getAxis(),
                characteristic == null ? null : characteristic.getNominal(),
                characteristic == null ? null : characteristic.getUTol(),
                characteristic == null ? null : characteristic.getLTol(),
                inspectionData.getMeasuredValue(),
                inspectionData.getInspReportId(),
                inspectionReport.getSerialNo(),
                inspectionReport.getInspDt());
    }

    private List<ChartDetailRespDto> buildMonthlyDetailRowsByQuery(Long projId, Long charId, String baseDate) {
        YearMonth targetMonth = resolveTargetMonthByQuery(projId, charId, baseDate);
        if (targetMonth == null) {
            return Collections.emptyList();
        }
        LocalDateTime startDateTime = targetMonth.atDay(1).atStartOfDay();
        LocalDateTime endDateTime = targetMonth.plusMonths(1).atDay(1).atStartOfDay();

        List<ChartDetailSourceDto> sourceRows = inspectionDataRepository
                .selectMonthDetailSourceListByProjIdAndCharIdAndPeriod(projId, charId, startDateTime, endDateTime)
                .orElseGet(Collections::emptyList)
                .stream()
                .filter(Objects::nonNull)
                .filter(row -> row.getMeasuredValue() != null)
                .sorted(Comparator
                        .comparing(ChartDetailSourceDto::getInspDt)
                        .thenComparing(ChartDetailSourceDto::getInspReportId))
                .toList();

        if (sourceRows.isEmpty()) {
            return Collections.emptyList();
        }

        Map<LocalDate, List<ChartDetailSourceDto>> rowsByDate = sourceRows.stream()
                .collect(Collectors.groupingBy(
                        row -> row.getInspDt().toLocalDate(),
                        TreeMap::new,
                        Collectors.toList()));

        List<ChartDetailRespDto> detailRows = new ArrayList<>();
        rowsByDate.forEach((bucketDate, bucketRows) -> {
            List<Double> measuredValues = bucketRows.stream()
                    .map(ChartDetailSourceDto::getMeasuredValue)
                    .filter(Objects::nonNull)
                    .toList();

            if (measuredValues.isEmpty()) {
                return;
            }

            ChartDetailSourceDto firstRow = bucketRows.get(0);
            detailRows.add(ChartDetailRespDto.builder()
                    .charId(firstRow.getCharId())
                    .charNo(firstRow.getCharNo())
                    .axis(firstRow.getAxis())
                    .nominal(firstRow.getNominal())
                    .uTol(firstRow.getUTol())
                    .lTol(firstRow.getLTol())
                    .bucketKey(bucketDate.toString())
                    .bucketLabel(bucketDate.format(DETAIL_MONTH_LABEL_FORMATTER))
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

    private List<ChartDetailRespDto> buildMonthlyDetailRows(List<ChartDetailSourceRow> sourceRows, String baseDate) {
        YearMonth targetMonth = resolveTargetMonth(sourceRows, baseDate);

        Map<LocalDate, List<ChartDetailSourceRow>> rowsByDate = sourceRows.stream()
                .filter(sourceRow -> YearMonth.from(sourceRow.getInspDt()).equals(targetMonth))
                .collect(Collectors.groupingBy(
                        sourceRow -> sourceRow.getInspDt().toLocalDate(),
                        TreeMap::new,
                        Collectors.toList()));

        if (rowsByDate.isEmpty()) {
            return Collections.emptyList();
        }

        List<ChartDetailRespDto> detailRows = new ArrayList<>();
        rowsByDate.forEach((bucketDate, bucketRows) -> {
            List<Double> measuredValues = bucketRows.stream()
                    .map(ChartDetailSourceRow::getMeasuredValue)
                    .filter(Objects::nonNull)
                    .toList();

            if (measuredValues.isEmpty()) {
                return;
            }

            ChartDetailSourceRow firstRow = bucketRows.get(0);
            detailRows.add(ChartDetailRespDto.builder()
                    .charId(firstRow.getCharId())
                    .charNo(firstRow.getCharNo())
                    .axis(firstRow.getAxis())
                    .nominal(firstRow.getNominal())
                    .uTol(firstRow.getUTol())
                    .lTol(firstRow.getLTol())
                    .bucketKey(bucketDate.toString())
                    .bucketLabel(bucketDate.format(DETAIL_MONTH_LABEL_FORMATTER))
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

    private List<ChartDetailRespDto> buildDailyDetailRows(List<ChartDetailSourceRow> sourceRows, String baseDate) {
        LocalDate targetDate = resolveTargetDate(sourceRows, baseDate);

        return sourceRows.stream()
                .filter(sourceRow -> sourceRow.getInspDt().toLocalDate().equals(targetDate))
                .map(sourceRow -> ChartDetailRespDto.builder()
                        .charId(sourceRow.getCharId())
                        .charNo(sourceRow.getCharNo())
                        .axis(sourceRow.getAxis())
                        .nominal(sourceRow.getNominal())
                        .uTol(sourceRow.getUTol())
                        .lTol(sourceRow.getLTol())
                        .bucketKey(sourceRow.getInspDt() + "-" + sourceRow.getInspReportId())
                        .bucketLabel(sourceRow.getInspDt().format(DETAIL_DAY_LABEL_FORMATTER))
                        .bucketDate(targetDate)
                        .bucketDateTime(sourceRow.getInspDt())
                        .measuredMin(sourceRow.getMeasuredValue())
                        .measuredMax(sourceRow.getMeasuredValue())
                        .measuredMean(sourceRow.getMeasuredValue())
                        .measuredSigma(0D)
                        .sampleCount(1L)
                        .inspReportId(sourceRow.getInspReportId())
                        .serialNo(sourceRow.getSerialNo())
                        .build())
                .toList();
    }

    private YearMonth resolveTargetMonth(List<ChartDetailSourceRow> sourceRows, String baseDate) {
        if (baseDate != null && !baseDate.isBlank()) {
            try {
                return YearMonth.parse(baseDate.trim());
            } catch (DateTimeParseException exception) {
                throw new IllegalArgumentException("baseDate는 YYYY-MM 형식이어야 합니다.");
            }
        }

        ChartDetailSourceRow latestRow = sourceRows.get(sourceRows.size() - 1);
        return YearMonth.from(latestRow.getInspDt());
    }

    private YearMonth resolveTargetMonthFromBaseDate(String baseDate) {
        if (baseDate != null && !baseDate.isBlank()) {
            try {
                return YearMonth.parse(baseDate.trim());
            } catch (DateTimeParseException exception) {
                throw new IllegalArgumentException("baseDate는 YYYY-MM 형식이어야 합니다.");
            }
        }

        throw new IllegalArgumentException("baseDate는 YYYY-MM 형식이어야 합니다.");
    }

    private YearMonth resolveTargetMonthByQuery(Long projId, Long charId, String baseDate) {
        if (baseDate != null && !baseDate.isBlank()) {
            return resolveTargetMonthFromBaseDate(baseDate);
        }

        List<InspectionReport> reportList = inspectionReportRepository.selectInspectionReportListByProjId(projId)
                .orElseGet(Collections::emptyList);
        Map<Long, InspectionReport> reportById = reportList.stream()
                .filter(Objects::nonNull)
                .filter(report -> report.getInspReportId() != null)
                .collect(Collectors.toMap(
                        InspectionReport::getInspReportId,
                        report -> report,
                        (left, right) -> left,
                        LinkedHashMap::new));

        List<ChartDetailSourceRow> sourceRows = inspectionDataRepository.selectInspectionDataListByCharId(charId)
                .orElseGet(Collections::emptyList)
                .stream()
                .map(inspectionData -> toChartDetailSourceRow(inspectionData, reportById))
                .filter(Objects::nonNull)
                .sorted(Comparator
                        .comparing(ChartDetailSourceRow::getInspDt)
                        .thenComparing(ChartDetailSourceRow::getInspReportId))
                .toList();

        if (sourceRows.isEmpty()) {
            return null;
        }

        ChartDetailSourceRow latestRow = sourceRows.get(sourceRows.size() - 1);
        return YearMonth.from(latestRow.getInspDt());
    }

    private LocalDate resolveTargetDate(List<ChartDetailSourceRow> sourceRows, String baseDate) {
        if (baseDate != null && !baseDate.isBlank()) {
            try {
                return LocalDate.parse(baseDate.trim());
            } catch (DateTimeParseException exception) {
                throw new IllegalArgumentException("baseDate는 YYYY-MM-DD 형식이어야 합니다.");
            }
        }

        ChartDetailSourceRow latestRow = sourceRows.get(sourceRows.size() - 1);
        return latestRow.getInspDt().toLocalDate();
    }

    private Double calculatePopulationSigma(List<Double> values) {
        if (values == null || values.isEmpty()) {
            return 0D;
        }

        double mean = values.stream().mapToDouble(Double::doubleValue).average().orElse(0D);
        double variance = values.stream()
                .mapToDouble(value -> Math.pow(value - mean, 2))
                .average()
                .orElse(0D);

        return Math.sqrt(variance);
    }

    private static final class ChartDetailSourceRow {
        private final Long charId;
        private final String charNo;
        private final String axis;
        private final Double nominal;
        private final Double uTol;
        private final Double lTol;
        private final Double measuredValue;
        private final Long inspReportId;
        private final String serialNo;
        private final LocalDateTime inspDt;

        private ChartDetailSourceRow(
                Long charId,
                String charNo,
                String axis,
                Double nominal,
                Double uTol,
                Double lTol,
                Double measuredValue,
                Long inspReportId,
                String serialNo,
                LocalDateTime inspDt) {
            this.charId = charId;
            this.charNo = charNo;
            this.axis = axis;
            this.nominal = nominal;
            this.uTol = uTol;
            this.lTol = lTol;
            this.measuredValue = measuredValue;
            this.inspReportId = inspReportId;
            this.serialNo = serialNo;
            this.inspDt = inspDt;
        }

        private Long getCharId() {
            return charId;
        }

        private String getCharNo() {
            return charNo;
        }

        private String getAxis() {
            return axis;
        }

        private Double getNominal() {
            return nominal;
        }

        private Double getUTol() {
            return uTol;
        }

        private Double getLTol() {
            return lTol;
        }

        private Double getMeasuredValue() {
            return measuredValue;
        }

        private Long getInspReportId() {
            return inspReportId;
        }

        private String getSerialNo() {
            return serialNo;
        }

        private LocalDateTime getInspDt() {
            return inspDt;
        }
    }
}
