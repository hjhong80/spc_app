package com.spc.spc_back.dto.spcdata;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.spc.spc_back.entity.spcdata.Project;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProjectAddReqDto {
    @NotBlank(message = "projNum is required.")
    private String projNum;

    @NotBlank(message = "projName is required.")
    private String projName;

    @NotNull(message = "dataStartRow is required.")
    @Min(value = 1, message = "dataStartRow must be greater than or equal to 1.")
    private Integer dataStartRow;

    @NotBlank(message = "charNoCol is required.")
    private String charNoCol;

    private String axisCol;

    @NotBlank(message = "nominalCol is required.")
    private String nominalCol;

    @NotBlank(message = "uTolCol is required.")
    @JsonProperty("uTolCol")
    private String uTolCol;

    @NotBlank(message = "lTolCol is required.")
    @JsonProperty("lTolCol")
    private String lTolCol;

    @NotBlank(message = "measuredValueCol is required.")
    private String measuredValueCol;

    @NotBlank(message = "serialNumberSourceJson is required.")
    private String serialNumberSourceJson;

    @NotBlank(message = "measurementTimeSourceJson is required.")
    private String measurementTimeSourceJson;

    private String fileName;

    @Valid
    private List<CharacteristicAddReqDto> characteristicList = new ArrayList<>();

    public Project toEntity() {
        Project project = new Project();
        project.setProjNum(projNum);
        project.setProjName(projName);
        project.setDataStartRow(dataStartRow);
        project.setCharNoCol(charNoCol);
        project.setAxisCol(axisCol);
        project.setNominalCol(nominalCol);
        project.setUTolCol(uTolCol);
        project.setLTolCol(lTolCol);
        project.setMeasuredValueCol(measuredValueCol);
        project.setSerialNumberSourceJson(serialNumberSourceJson);
        project.setMeasurementTimeSourceJson(measurementTimeSourceJson);
        return project;
    }

    // Compatibility bridge for stale runtime metadata that may still
    // reference the removed nested dto type name.
    @Deprecated
    public static class CharacteristicReqDto extends CharacteristicAddReqDto {
        public CharacteristicReqDto() {
            super();
        }
    }
}
