package com.spc.spc_back.entity.spcdata;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Project {
    private Long projId;
    private String projNum;
    private String projName;
    private Integer dataStartRow;
    private String charNoCol;
    private String axisCol;
    private String nominalCol;
    @JsonProperty("uTolCol")
    private String uTolCol;
    @JsonProperty("lTolCol")
    private String lTolCol;
    private String measuredValueCol;
    private String serialNumberSourceJson;
    private String measurementTimeSourceJson;
    private LocalDateTime createDt;
    private LocalDateTime updateDt;

    private List<Characteristic> characteristicList;
}
