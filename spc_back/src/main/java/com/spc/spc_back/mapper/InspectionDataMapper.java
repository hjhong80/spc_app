package com.spc.spc_back.mapper;

import java.time.LocalDateTime;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.spc.spc_back.dto.spcdata.ChartDetailSourceDto;
import com.spc.spc_back.dto.spcdata.ChartDistributionSourceDto;
import com.spc.spc_back.dto.spcdata.ChartStatRespDto;
import com.spc.spc_back.entity.spcdata.InspectionData;

@Mapper
public interface InspectionDataMapper {
    int insertInspectionData(InspectionData inspectionData);

    int insertInspectionDataBatch(@Param("items") List<InspectionData> items);

    List<InspectionData> selectInspectionDataListByInspReportId(Long inspReportId);

    List<InspectionData> selectInspectionDataListByCharId(Long charId);

    ChartDistributionSourceDto selectDistributionMetaByProjIdAndCharId(
            @Param("projId") Long projId,
            @Param("charId") Long charId);

    List<ChartDistributionSourceDto> selectDistributionMeasuredValueListByCharIdAndPeriod(
            @Param("projId") Long projId,
            @Param("charId") Long charId,
            @Param("startDt") LocalDateTime startDt,
            @Param("endDt") LocalDateTime endDt);

    List<ChartDetailSourceDto> selectMonthDetailSourceListByProjIdAndCharIdAndPeriod(
            @Param("projId") Long projId,
            @Param("charId") Long charId,
            @Param("startDt") LocalDateTime startDt,
            @Param("endDt") LocalDateTime endDt);

    List<ChartStatRespDto> selectChartStatsByProjId(Long projId);

    Double selectMeasuredValueAvgByCharId(Long charId);

    Double selectMeasuredValueStddevByCharId(Long charId);

    int updateInspectionData(InspectionData inspectionData);

    int deleteInspectionData(Long inspDataId);
}
