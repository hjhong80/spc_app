package com.spc.spc_back.entity.spcdata;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InspectionData {
    private Long inspDataId;
    private Long inspReportId;
    private Long charId;
    private Double measuredValue;

    private Characteristic characteristic;
}
