package com.spc.spc_back.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.spc.spc_back.dto.spcdata.ExcelInputReqDto;
import com.spc.spc_back.dto.spcdata.InspectionBatchRowReqDto;
import com.spc.spc_back.dto.spcdata.InspectionBatchSaveReqDto;
import com.spc.spc_back.entity.spcdata.Characteristic;
import com.spc.spc_back.entity.spcdata.InspectionData;
import com.spc.spc_back.entity.spcdata.InspectionReport;
import com.spc.spc_back.repository.CharacteristicRepository;
import com.spc.spc_back.repository.InspectionDataRepository;
import com.spc.spc_back.repository.InspectionReportRepository;
import com.spc.spc_back.repository.ProjectRepository;

class InspectionServiceSaveBatchTest {

    private final ProjectRepository projectRepository = mock(ProjectRepository.class);
    private final CharacteristicRepository characteristicRepository = mock(CharacteristicRepository.class);
    private final InspectionReportRepository inspectionReportRepository = mock(InspectionReportRepository.class);
    private final InspectionDataRepository inspectionDataRepository = mock(InspectionDataRepository.class);
    private final InspectionServiceImpl inspectionService = new InspectionServiceImpl(
            projectRepository,
            characteristicRepository,
            inspectionReportRepository,
            inspectionDataRepository);

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

    @Test
    void 공통saveBatch는중복검사에exists쿼리를우선사용한다() {
        when(inspectionReportRepository.existsBySerialNo("LOT-EXISTS")).thenReturn(false);
        when(characteristicRepository.selectCharacteristicListByProjId(1L)).thenReturn(Optional.of(List.of(
                new Characteristic(101L, 1L, "C-01", "X", 10.0, 0.5, -0.5, null, null))));
        doAnswer(invocation -> {
            InspectionReport report = invocation.getArgument(0);
            report.setInspReportId(5001L);
            return 1;
        }).when(inspectionReportRepository).insertInspectionReport(any(InspectionReport.class));
        when(inspectionDataRepository.insertInspectionDataBatch(any())).thenReturn(1);

        inspectionService.saveBatch(InspectionBatchSaveReqDto.builder()
                .projId(1L)
                .serialNo("LOT-EXISTS")
                .inspDt(LocalDateTime.of(2026, 5, 5, 14, 30))
                .rows(List.of(InspectionBatchRowReqDto.builder()
                        .excelRowNo(2)
                        .charNo("C-01")
                        .axis("X")
                        .nominal(10.0)
                        .uTol(0.5)
                        .lTol(-0.5)
                        .measuredValue(10.4)
                        .build()))
                .build());

        verify(inspectionReportRepository).existsBySerialNo("LOT-EXISTS");
        verify(inspectionReportRepository, never()).selectInspectionReportBySerialNo("LOT-EXISTS");
    }

    @Test
    void 공통saveBatch는측정데이터를batchInsert로저장한다() {
        when(inspectionReportRepository.existsBySerialNo("LOT-BATCH")).thenReturn(false);
        when(characteristicRepository.selectCharacteristicListByProjId(1L)).thenReturn(Optional.of(List.of(
                new Characteristic(101L, 1L, "C-01", "X", 10.0, 0.5, -0.5, null, null),
                new Characteristic(102L, 1L, "C-02", "Y", 20.0, 1.0, -1.0, null, null))));
        doAnswer(invocation -> {
            InspectionReport report = invocation.getArgument(0);
            report.setInspReportId(5002L);
            return 1;
        }).when(inspectionReportRepository).insertInspectionReport(any(InspectionReport.class));
        when(inspectionDataRepository.insertInspectionDataBatch(any())).thenReturn(2);

        inspectionService.saveBatch(InspectionBatchSaveReqDto.builder()
                .projId(1L)
                .serialNo("LOT-BATCH")
                .inspDt(LocalDateTime.of(2026, 5, 5, 14, 30))
                .rows(List.of(
                        InspectionBatchRowReqDto.builder()
                                .excelRowNo(2)
                                .charNo("C-01")
                                .axis("X")
                                .nominal(10.0)
                                .uTol(0.5)
                                .lTol(-0.5)
                                .measuredValue(10.4)
                                .build(),
                        InspectionBatchRowReqDto.builder()
                                .excelRowNo(3)
                                .charNo("C-02")
                                .axis("Y")
                                .nominal(20.0)
                                .uTol(1.0)
                                .lTol(-1.0)
                                .measuredValue(19.9)
                                .build()))
                .build());

        ArgumentCaptor<List<InspectionData>> batchCaptor = ArgumentCaptor.forClass(List.class);
        verify(inspectionDataRepository).insertInspectionDataBatch(batchCaptor.capture());
        verify(inspectionDataRepository, never()).insertInspectionData(any(InspectionData.class));

        assertThat(batchCaptor.getValue()).hasSize(2);
        assertThat(batchCaptor.getValue()).extracting(InspectionData::getInspReportId).containsOnly(5002L);
        assertThat(batchCaptor.getValue()).extracting(InspectionData::getCharId).containsExactly(101L, 102L);
    }
}
