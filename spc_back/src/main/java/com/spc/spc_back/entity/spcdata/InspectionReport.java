package com.spc.spc_back.entity.spcdata;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InspectionReport {
    private Long inspReportId;
    private Long projId;
    private String serialNo;
    private LocalDateTime inspDt;
    private LocalDateTime createDt;
    private LocalDateTime updateDt;

    private List<InspectionData> inspectionDatas;
}
