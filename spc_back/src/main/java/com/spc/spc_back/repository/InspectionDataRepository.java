package com.spc.spc_back.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.spc.spc_back.dto.spcdata.ChartDetailSourceDto;
import com.spc.spc_back.dto.spcdata.ChartDistributionSourceDto;
import com.spc.spc_back.dto.spcdata.ChartStatRespDto;
import com.spc.spc_back.dto.spcdata.SerialReportDetailRespDto;
import com.spc.spc_back.entity.spcdata.InspectionData;
import com.spc.spc_back.mapper.InspectionDataMapper;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class InspectionDataRepository {
    private final InspectionDataMapper inspectionDataMapper;

    public int insertInspectionData(InspectionData inspectionData) {
        return inspectionDataMapper.insertInspectionData(inspectionData);
    }

    public int insertInspectionDataBatch(List<InspectionData> inspectionDataList) {
        return inspectionDataMapper.insertInspectionDataBatch(inspectionDataList);
    }

    public Optional<List<InspectionData>> selectInspectionDataListByInspReportId(Long inspReportId) {
        return Optional.ofNullable(inspectionDataMapper.selectInspectionDataListByInspReportId(inspReportId));
    }

    public Optional<List<InspectionData>> selectInspectionDataListByCharId(Long charId) {
        return Optional.ofNullable(inspectionDataMapper.selectInspectionDataListByCharId(charId));
    }

    public Optional<List<SerialReportDetailRespDto>> selectSerialReportDetailsBySerialNo(String serialNo) {
        return Optional.ofNullable(inspectionDataMapper.selectSerialReportDetailsBySerialNo(serialNo));
    }

    public Optional<ChartDistributionSourceDto> selectDistributionMetaByProjIdAndCharId(Long projId, Long charId) {
        return Optional.ofNullable(inspectionDataMapper.selectDistributionMetaByProjIdAndCharId(projId, charId));
    }

    public Optional<List<ChartDistributionSourceDto>> selectDistributionMeasuredValueListByCharIdAndPeriod(
            Long projId,
            Long charId,
            LocalDateTime startDt,
            LocalDateTime endDt) {
        return Optional.ofNullable(
                inspectionDataMapper.selectDistributionMeasuredValueListByCharIdAndPeriod(projId, charId, startDt, endDt));
    }

    public Optional<List<ChartDetailSourceDto>> selectMonthDetailSourceListByProjIdAndCharIdAndPeriod(
            Long projId,
            Long charId,
            LocalDateTime startDt,
            LocalDateTime endDt) {
        return Optional.ofNullable(
                inspectionDataMapper.selectMonthDetailSourceListByProjIdAndCharIdAndPeriod(projId, charId, startDt, endDt));
    }

    public Optional<List<ChartStatRespDto>> selectChartStatsByProjId(Long projId) {
        return Optional.ofNullable(inspectionDataMapper.selectChartStatsByProjId(projId));
    }

    public Optional<Double> selectMeasuredValueAvgByCharId(Long charId) {
        return Optional.ofNullable(inspectionDataMapper.selectMeasuredValueAvgByCharId(charId));
    }

    public Optional<Double> selectMeasuredValueStddevByCharId(Long charId) {
        return Optional.ofNullable(inspectionDataMapper.selectMeasuredValueStddevByCharId(charId));
    }

    public int updateInspectionData(InspectionData inspectionData) {
        return inspectionDataMapper.updateInspectionData(inspectionData);
    }

    public int deleteInspectionData(Long inspDataId) {
        return inspectionDataMapper.deleteInspectionData(inspDataId);
    }
}
