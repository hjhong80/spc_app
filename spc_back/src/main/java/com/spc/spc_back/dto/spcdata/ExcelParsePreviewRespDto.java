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
public class ExcelParsePreviewRespDto {
    private Long projId;
    private String projNum;
    private String projName;
    private String fileName;

    private Integer dataStartRow;
    private String charNoCol;
    private String axisCol;
    private String nominalCol;
    private String uTolCol;
    private String lTolCol;
    private String measuredValueCol;

    private String serialNo;
    private String inspDt;
    private Boolean skippedDuplicateSerialNo;
    private String skipReason;

    private Integer parsedRowCount;
    private List<ParsedRow> parsedRows;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParsedRow {
        private Integer excelRowNo;
        private String charNo;
        private String axis;
        private Double nominal;
        private Double uTol;
        private Double lTol;
        private Double measuredValue;
    }
}
