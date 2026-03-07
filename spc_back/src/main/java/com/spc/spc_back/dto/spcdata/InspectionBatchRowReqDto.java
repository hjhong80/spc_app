package com.spc.spc_back.dto.spcdata;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InspectionBatchRowReqDto {
    private Integer excelRowNo;
    private String charNo;
    private String axis;
    private Double nominal;
    private Double uTol;
    private Double lTol;
    private Double measuredValue;
}
