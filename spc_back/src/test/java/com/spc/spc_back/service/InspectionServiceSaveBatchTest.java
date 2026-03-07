package com.spc.spc_back.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.spc.spc_back.dto.spcdata.ExcelInputReqDto;
import com.spc.spc_back.repository.CharacteristicRepository;
import com.spc.spc_back.repository.InspectionDataRepository;
import com.spc.spc_back.repository.InspectionReportRepository;
import com.spc.spc_back.repository.ProjectRepository;

class InspectionServiceSaveBatchTest {

    private final InspectionServiceImpl inspectionService = new InspectionServiceImpl(
            mock(ProjectRepository.class),
            mock(CharacteristicRepository.class),
            mock(InspectionReportRepository.class),
            mock(InspectionDataRepository.class));

    @Test
    void legacySaveBatch는필수메타데이터없음예외를던진다() {
        assertThatThrownBy(() -> inspectionService.saveBatch(List.of(
                ExcelInputReqDto.builder()
                        .qualityIndicator("C-01")
                        .nominal(10.0)
                        .build()), "LOT-NEW"))
                .isInstanceOf(UnsupportedOperationException.class)
                .hasMessageContaining("legacy saveBatch")
                .hasMessageContaining("projId")
                .hasMessageContaining("serialNo")
                .hasMessageContaining("inspDt")
                .hasMessageContaining("measuredValue");
    }
}
