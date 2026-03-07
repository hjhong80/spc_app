package com.spc.spc_back.dto.spcdata;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChartDistributionRespDto {
    private Long charId;
    private String charNo;
    private String axis;
    private String scale;
    private String baseDate;
    private Double nominal;
    private Double uTol;
    private Double lTol;
    private Double measuredMin;
    private Double measuredMax;
    private Double measuredMean;
    private Double measuredSigma;
    private Long sampleCount;
    private List<Double> measuredValues;
}
