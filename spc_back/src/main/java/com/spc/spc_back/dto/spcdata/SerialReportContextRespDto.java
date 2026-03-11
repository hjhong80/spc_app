package com.spc.spc_back.dto.spcdata;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SerialReportContextRespDto {
    private Long projId;
    private String serialNo;
    private LocalDateTime inspDt;
}
