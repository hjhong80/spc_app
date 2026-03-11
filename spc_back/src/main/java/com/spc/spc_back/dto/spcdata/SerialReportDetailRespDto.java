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
public class SerialReportDetailRespDto {
    private String charNo;
    private String axis;
    private Double nominal;
    private Double uTol;
    private Double lTol;
    private Double measuredValue;
    private LocalDateTime createDt;
    private LocalDateTime updateDt;
}
