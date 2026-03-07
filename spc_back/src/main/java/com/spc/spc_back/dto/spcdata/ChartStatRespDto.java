package com.spc.spc_back.dto.spcdata;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChartStatRespDto {
    private Long charId;
    private String charNo;
    private String axis;
    private Double nominal;
    private Double uTol;
    private Double lTol;
    private Double measuredMin;
    private Double measuredMax;
    private Double measuredMean;
    private Double measuredSigma;
    private Long sampleCount;
    private Double usl;
    private Double lsl;
    private Double cpk;
    private Double sigmaLevel;
    private Double goodRatePercent;
    private Double defectRatePercent;
}
