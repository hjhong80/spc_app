package com.spc.spc_back.dto.spcdata;

import com.spc.spc_back.entity.spcdata.Project;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
public class ProjIdAndNameRespDto {
    private Long projId;
    private String projName;

    public static ProjIdAndNameRespDto from(Project project) {
        if (project == null) {
            return null;
        }
        try {
            Long projId = project.getProjId();
            String projName = project.getProjName();
            return ProjIdAndNameRespDto.builder()
                    .projId(projId)
                    .projName(projName)
                    .build();
        } catch (Exception e) {
            log.error("Error converting Project to ProjIdAndNameRespDto: {}", e.getMessage());
            return null;
        }
    }
}