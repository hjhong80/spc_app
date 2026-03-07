package com.spc.spc_back.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.spc.spc_back.entity.spcdata.InspectionReport;

@Mapper
public interface InspectionReportMapper {
    int insertInspectionReport(InspectionReport inspectionReport);

    InspectionReport selectInspectionReportByInspReportId(Long inspReportId);

    InspectionReport selectInspectionReportBySerialNo(String serialNo);

    List<InspectionReport> selectInspectionReportListByProjId(Long projId);

    Long selectInspectionReportCountByProjId(Long projId);

    List<Long> selectRecentlyProjId();

    int updateInspectionReport(InspectionReport inspectionReport);

    int deleteInspectionReport(Long inspReportId);
}
