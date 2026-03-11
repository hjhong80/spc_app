package com.spc.spc_back.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.spc.spc_back.dto.spcdata.SerialSearchCandidateRespDto;
import com.spc.spc_back.entity.spcdata.InspectionReport;
import com.spc.spc_back.mapper.InspectionReportMapper;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class InspectionReportRepository {
    private final InspectionReportMapper inspectionReportMapper;

    public int insertInspectionReport(InspectionReport inspectionReport) {
        return inspectionReportMapper.insertInspectionReport(inspectionReport);
    }

    public Optional<InspectionReport> selectInspectionReportByInspReportId(Long inspReportId) {
        return Optional.ofNullable(inspectionReportMapper.selectInspectionReportByInspReportId(inspReportId));
    }

    public Optional<InspectionReport> selectInspectionReportBySerialNo(String serialNo) {
        return Optional.ofNullable(inspectionReportMapper.selectInspectionReportBySerialNo(serialNo));
    }

    public Optional<List<SerialSearchCandidateRespDto>> searchSerialReportCandidates(Long projId, String keyword, int limit) {
        return Optional.ofNullable(inspectionReportMapper.searchSerialReportCandidates(projId, keyword, limit));
    }

    public boolean existsBySerialNo(String serialNo) {
        return inspectionReportMapper.existsBySerialNo(serialNo);
    }

    public Optional<List<InspectionReport>> selectInspectionReportListByProjId(Long projId) {
        return Optional.ofNullable(inspectionReportMapper.selectInspectionReportListByProjId(projId));
    }

    public Optional<Long> selectInspectionReportCountByProjId(Long projId) {
        return Optional.ofNullable(inspectionReportMapper.selectInspectionReportCountByProjId(projId));
    }

    public Optional<List<Long>> selectRecentlyProjId() {
        return Optional.ofNullable(inspectionReportMapper.selectRecentlyProjId());
    }

    public int updateInspectionReport(InspectionReport inspectionReport) {
        return inspectionReportMapper.updateInspectionReport(inspectionReport);
    }

    public int deleteInspectionReport(Long inspReportId) {
        return inspectionReportMapper.deleteInspectionReport(inspReportId);
    }
}
