package com.spc.spc_back.dto.spcdata;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InspectionBatchSaveReqDto {
    private Long projId;
    private String serialNo;
    private LocalDateTime inspDt;
    private List<InspectionBatchRowReqDto> rows;
}
