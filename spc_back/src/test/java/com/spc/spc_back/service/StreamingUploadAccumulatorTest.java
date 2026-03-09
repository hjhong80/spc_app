package com.spc.spc_back.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.spc.spc_back.dto.spcdata.ExcelParsePreviewRespDto;
import com.spc.spc_back.service.excel.StreamingUploadAccumulator;

class StreamingUploadAccumulatorTest {

    @Test
    void accumulator는전체건수와샘플미리보기상한을유지한다() {
        StreamingUploadAccumulator accumulator = new StreamingUploadAccumulator(20);

        for (int index = 0; index < 950; index += 1) {
            accumulator.recordParsedRow(ExcelParsePreviewRespDto.ParsedRow.builder()
                    .excelRowNo(index + 2)
                    .charNo("C-01")
                    .axis("X")
                    .nominal(10.0)
                    .uTol(0.5)
                    .lTol(-0.5)
                    .measuredValue(10.0 + index)
                    .build());
        }

        assertThat(accumulator.getParsedRowCount()).isEqualTo(950);
        assertThat(accumulator.getPreviewRows()).hasSize(20);
        assertThat(accumulator.getPreviewRows().get(0).getExcelRowNo()).isEqualTo(2);
        assertThat(accumulator.getPreviewRows().get(19).getExcelRowNo()).isEqualTo(21);
    }

    @Test
    void accumulator는저장및스킵집계를누적한다() {
        StreamingUploadAccumulator accumulator = new StreamingUploadAccumulator(20);

        accumulator.recordInsertedRows(900);
        accumulator.recordSkippedRow();
        accumulator.recordSkippedRow();

        assertThat(accumulator.getInsertedRowCount()).isEqualTo(900);
        assertThat(accumulator.getSkippedRowCount()).isEqualTo(2);
    }
}
