package com.spc.spc_back.entity.spcdata;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Characteristic {
    private Long charId;
    private Long projId;
    private String charNo;
    private String axis;
    private Double nominal;
    @JsonProperty("uTol")
    private Double uTol;
    @JsonProperty("lTol")
    private Double lTol;
    private LocalDateTime createDt;
    private LocalDateTime updateDt;
}
