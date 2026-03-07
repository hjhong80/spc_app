package com.spc.spc_back.dto.spcdata;

import com.alibaba.excel.annotation.ExcelProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InspectionExcelRowReqDto {
    @ExcelProperty(index = 0)
    private String charNo;

    @ExcelProperty(index = 1)
    private String axis;

    @ExcelProperty(index = 2)
    private Double nominal;

    @ExcelProperty(index = 3)
    private Double uTol;

    @ExcelProperty(index = 4)
    private Double lTol;

    @ExcelProperty(index = 5)
    private Double measuredValue;
}
