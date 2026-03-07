package com.spc.spc_back.dto.spcdata;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChartDistributionSourceDto {
    private Long charId;
    private String charNo;
    private String axis;
    private Double nominal;
    private Double uTol;
    private Double lTol;
    private Double measuredValue;
    private Long inspReportId;
    private String serialNo;
    private LocalDateTime inspDt;
}
