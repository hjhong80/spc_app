package com.spc.spc_back.controller.spcdata.report;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.spc.spc_back.dto.ApiRespDto;
import com.spc.spc_back.dto.spcdata.ChartDistributionRespDto;
import com.spc.spc_back.dto.spcdata.ChartDetailRespDto;
import com.spc.spc_back.dto.spcdata.ChartStatRespDto;
import com.spc.spc_back.dto.spcdata.ProjIdAndNameRespDto;
import com.spc.spc_back.dto.spcdata.SerialSearchCandidateRespDto;
import com.spc.spc_back.dto.spcdata.SerialReportContextRespDto;
import com.spc.spc_back.dto.spcdata.SerialReportDetailRespDto;
import com.spc.spc_back.security.model.PrincipalUser;
import com.spc.spc_back.service.spcdata.ReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(value = "/spcdata/report", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;

    @GetMapping("/recently-project/list")
    public ResponseEntity<ApiRespDto<List<ProjIdAndNameRespDto>>> getRecentlyProjectList(
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(reportService.getRecentlyProjectList(principalUser));
    }

    @GetMapping("/project/{projId}/chart-stats")
    public ResponseEntity<ApiRespDto<List<ChartStatRespDto>>> getProjectChartStats(
            @PathVariable Long projId,
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(reportService.getProjectChartStats(projId, principalUser));
    }

    @GetMapping("/serial/{serialNo}/details")
    public ResponseEntity<ApiRespDto<List<SerialReportDetailRespDto>>> getSerialReportDetails(
            @PathVariable String serialNo,
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(reportService.getSerialReportDetails(serialNo, principalUser));
    }

    @GetMapping("/serial/{serialNo}/context")
    public ResponseEntity<ApiRespDto<SerialReportContextRespDto>> getSerialReportContext(
            @PathVariable String serialNo,
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(reportService.getSerialReportContext(serialNo, principalUser));
    }

    @GetMapping("/project/{projId}/serial-search")
    public ResponseEntity<ApiRespDto<List<SerialSearchCandidateRespDto>>> searchSerialReportCandidates(
            @PathVariable Long projId,
            @RequestParam String keyword,
            @RequestParam(required = false) Integer limit,
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(reportService.searchSerialReportCandidates(projId, keyword, limit, principalUser));
    }

    @GetMapping("/project/{projId}/characteristic/{charId}/detail")
    public ResponseEntity<ApiRespDto<List<ChartDetailRespDto>>> getCharacteristicChartDetail(
            @PathVariable Long projId,
            @PathVariable Long charId,
            @RequestParam(required = false) String scale,
            @RequestParam(required = false) String baseDate,
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(
                reportService.getCharacteristicChartDetail(projId, charId, scale, baseDate, principalUser));
    }

    @GetMapping("/project/{projId}/characteristic/{charId}/distribution")
    public ResponseEntity<ApiRespDto<ChartDistributionRespDto>> getCharacteristicDistribution(
            @PathVariable Long projId,
            @PathVariable Long charId,
            @RequestParam String scale,
            @RequestParam String baseDate,
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(
                reportService.getCharacteristicDistribution(projId, charId, scale, baseDate, principalUser));
    }

    @GetMapping("/project/{projId}/report-count")
    public ResponseEntity<ApiRespDto<Long>> getProjectReportCount(
            @PathVariable Long projId,
            @AuthenticationPrincipal PrincipalUser principalUser) {
        return ResponseEntity.ok(reportService.getProjectReportCount(projId, principalUser));
    }
}
