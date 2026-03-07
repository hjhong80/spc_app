package com.spc.spc_back.listener;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.spc.spc_back.dto.spcdata.InspectionBatchRowReqDto;
import com.spc.spc_back.dto.spcdata.InspectionBatchSaveReqDto;
import com.spc.spc_back.dto.spcdata.InspectionExcelRowReqDto;
import com.spc.spc_back.service.InspectionService;

class InspectionDataListenerTest {

    private final InspectionService inspectionService = mock(InspectionService.class);

    @Test
    void doAfterAllAnalysed는남은행을공통저장요청으로전달한다() {
        LocalDateTime inspDt = LocalDateTime.of(2026, 5, 5, 14, 30);
        InspectionDataListener listener = new InspectionDataListener(
                inspectionService,
                1L,
                "LOT-NEW",
                inspDt);

        listener.invoke(InspectionExcelRowReqDto.builder()
                .charNo("C-01")
                .axis("X")
                .nominal(10.0)
                .uTol(0.5)
                .lTol(-0.5)
                .measuredValue(10.4)
                .build(), null);

        listener.doAfterAllAnalysed(null);

        ArgumentCaptor<InspectionBatchSaveReqDto> requestCaptor = ArgumentCaptor.forClass(InspectionBatchSaveReqDto.class);
        verify(inspectionService).saveBatch(requestCaptor.capture());

        InspectionBatchSaveReqDto request = requestCaptor.getValue();
        assertThat(request.getProjId()).isEqualTo(1L);
        assertThat(request.getSerialNo()).isEqualTo("LOT-NEW");
        assertThat(request.getInspDt()).isEqualTo(inspDt);
        assertThat(request.getRows())
                .hasSize(1)
                .first()
                .satisfies(row -> {
                    assertThat(row.getExcelRowNo()).isNull();
                    assertThat(row.getCharNo()).isEqualTo("C-01");
                    assertThat(row.getAxis()).isEqualTo("X");
                    assertThat(row.getNominal()).isEqualTo(10.0);
                    assertThat(row.getMeasuredValue()).isEqualTo(10.4);
                });
    }

    @Test
    void invoke는배치크기이상이면자동flush한다() {
        InspectionDataListener listener = new InspectionDataListener(
                inspectionService,
                1L,
                "LOT-1000",
                LocalDateTime.of(2026, 5, 5, 14, 30));

        for (int index = 0; index < 1000; index += 1) {
            listener.invoke(InspectionExcelRowReqDto.builder()
                    .charNo("C-01")
                    .axis("X")
                    .nominal(10.0)
                    .uTol(0.5)
                    .lTol(-0.5)
                    .measuredValue(10.0 + index)
                    .build(), null);
        }

        ArgumentCaptor<InspectionBatchSaveReqDto> requestCaptor = ArgumentCaptor.forClass(InspectionBatchSaveReqDto.class);
        verify(inspectionService, times(1)).saveBatch(requestCaptor.capture());

        List<InspectionBatchRowReqDto> rows = requestCaptor.getValue().getRows();
        assertThat(rows).hasSize(1000);
        assertThat(rows.get(0).getMeasuredValue()).isEqualTo(10.0);
        assertThat(rows.get(999).getMeasuredValue()).isEqualTo(1009.0);
    }
}
