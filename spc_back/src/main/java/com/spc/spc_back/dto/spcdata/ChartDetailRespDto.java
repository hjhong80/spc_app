package com.spc.spc_back.dto.spcdata;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChartDetailRespDto {
    private Long charId;
    private String charNo;
    private String axis;
    private Double nominal;
    private Double uTol;
    private Double lTol;
    private String bucketKey;
    private String bucketLabel;
    private LocalDate bucketDate;
    private LocalDateTime bucketDateTime;
    private Double measuredMin;
    private Double measuredMax;
    private Double measuredMean;
    private Double measuredSigma;
    private Long sampleCount;
    private Long inspReportId;
    private String serialNo;
}
