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
public class ExcelInputReqDto {
    @ExcelProperty(index = 0)
    private String qualityIndicator;

    @ExcelProperty(index = 1)
    private Double nominal;
}
